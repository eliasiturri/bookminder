const { db } = require('../database/database.js');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const axios = require('axios');
const { pluginsMem, allowedPlugins } = require('../database/loki.js');

const { GLOBAL_LIBRARY_DATA_PATH, USER_LIBRARY_DATA_PATH } = require('../utils/env.js');

const DEFAULT_FILE_METADATA_PLUGIN_UUID = process.env.DEFAULT_FILE_METADATA_PLUGIN_UUID;

const Book = require('../classes/Book.js');

var BUSY = false;

const findNewFiles = () => {
    setInterval(async () => {
        if (BUSY) {
            return;
        }
        let sql = `
            SELECT f.id, f.library_id, f.filename, f.folder_path, f.path, f.status, l.type AS library_type 
            FROM files_to_process AS f 
            LEFT JOIN libraries AS l ON f.library_id = l.id
            WHERE status = 'pending';
        `;
    
        let metadataPlugin = pluginsMem.findOne({ public_uuid: DEFAULT_FILE_METADATA_PLUGIN_UUID });
        //console.log("metadataPlugin", metadataPlugin);
        if (!metadataPlugin) {
            console.log("No metadata plugin found");
            return;
        }

        let metadataEntrypoint = metadataPlugin.entrypoints.find((entrypoint) => entrypoint.type === 'file-metadata');
        if (!metadataEntrypoint) {
            console.log("No metadata entrypoint found");
            return;
        }

        //console.log("allowedPlugins", allowedPlugins);

        let pluginContainerName = metadataPlugin.container_name;
        let pluginContainerPort = metadataPlugin.container_port;
        let pluginPrivateUuid = metadataPlugin.private_uuid;
        let pluginEndpoint = metadataEntrypoint.url;

        let pluginToken = allowedPlugins[metadataPlugin.public_uuid];
        if (!pluginToken) {
            console.log("No token found for plugin");
            return;
        }

        let basicAuthString = `Basic ${Buffer.from(`${pluginPrivateUuid}:${pluginToken}`).toString('base64')}`;

        let files = db.prepare(sql).all();

        if (files.length > 0) {
            BUSY = true;
        } else {
            BUSY = false;
        }
    
        for (const file of files) {
            try {
                console.log("processing file", file.filename);
                let id = file.id;
                let library_id = file.library_id;
                let library_type = file.library_type;
                let filename = file.filename;
                let filePath = file.path;
                let folder_path = file.folder_path;
                const folder_id = file.folder_id;
        
                let readFile = fs.readFileSync(filePath);
                let url = `http://${pluginContainerName}:${pluginContainerPort}${pluginEndpoint}`;
        
                let basePath = library_type == 'global' ? GLOBAL_LIBRARY_DATA_PATH : USER_LIBRARY_DATA_PATH;
                let relativePathPrefix = library_type == 'global' ? 'global' : 'user';
        
                const formData = new FormData();
                formData.append('file', readFile);
                formData.append('filename', filename);
        
        
                let fileResult = await axios.post(url, {
                        file: readFile,
                        filename: filename
                    }, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': basicAuthString
                        }
                    }
                );
                
                console.log("fileResult", fileResult.status);
                if (fileResult.status === 200) {
                    let metadata = fileResult.data.metadata;
                    let coverBase64 = fileResult.data.cover;
        
                    let coverPath = null;
                    if (coverBase64) {
                        coverPath = path.join(folder_path, 'cover.png');
                        console.log("=== COVER PROCESSING ===");
                        console.log("folder_path:", folder_path);
                        console.log("basePath:", basePath);
                        console.log("relativePathPrefix:", relativePathPrefix);
                        console.log("Full cover path:", coverPath);
                        fs.writeFileSync(coverPath, coverBase64, 'base64');
                        console.log("Cover written successfully");
                    } else {
                        console.log("No cover data received from plugin");
                    }

                    let relativeCoverPath = coverPath;
                    if (coverPath && coverPath.startsWith(basePath)) {
                        relativeCoverPath = coverPath.substring(basePath.length);
                        console.log("After removing basePath:", relativeCoverPath);
                        // Remove leading slash if present
                        if (relativeCoverPath.startsWith('/')) {
                            relativeCoverPath = relativeCoverPath.substring(1);
                            console.log("After removing leading slash:", relativeCoverPath);
                        }
                        relativeCoverPath = path.join(relativePathPrefix, relativeCoverPath);
                        console.log("Final relative cover path:", relativeCoverPath);
                    } else if (coverPath) {
                        console.log("WARNING: Cover path doesn't start with basePath!");
                        console.log("  coverPath:", coverPath);
                        console.log("  basePath:", basePath);
                    }

                    // books.path should only store the filename, not the full path
                    let relativeFilePath = filename;
                    console.log("Book filename (books.path):", relativeFilePath);
                    console.log("Format folder (books_formats.path):", folder_path ? path.basename(folder_path) : null);

                    // Derive format_path from the destination folder where file was saved
                    const format_path = folder_path ? path.basename(folder_path) : null;
                    console.log("filePath", filePath);
                    // Book constructor signature:
                    // new Book(metadata, library_id=null, title=null, authors=null, subjects=null, description=null,
                    //   identifiers=null, language=null, publisher=null, published=null, cover_url=null, file_path=null, format_path=null, folder_id=null)
                    let bookObj = new Book(
                        metadata,
                        library_id,
                        null, // title
                        null, // authors
                        null, // subjects
                        null, // description
                        null, // identifiers
                        null, // language
                        null, // publisher
                        null, // published
                        relativeCoverPath,
                        relativeFilePath,
                        format_path,
                        folder_id
                    );
                    let insertResult = bookObj.saveToDatabase();
        
                    if (insertResult) {
                        let updateSql = `UPDATE files_to_process SET status = 'done' WHERE id = ?;`;
                        db.prepare(updateSql).run(id);
                    } else {
                        let updateSql = `UPDATE files_to_process SET status = 'failed' WHERE id = ?;`;
                        db.prepare(updateSql).run(id);
                    }
                } 
            } catch (error) {
                console.error("Error processing file:", filename);
                console.error("Error details:", error);
                console.error("Stack trace:", error.stack);
                // Mark file as failed
                try {
                    let updateSql = `UPDATE files_to_process SET status = 'failed' WHERE id = ?;`;
                    db.prepare(updateSql).run(file.id);
                } catch (e) {
                    console.error("Error updating file status:", e);
                }
            }
            BUSY = false;
        };
    }, 5000);
};

function startIntervalJobs() {
    findNewFiles();
}

module.exports = {
    startIntervalJobs
}
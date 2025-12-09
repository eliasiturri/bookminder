const express = require('express');
const router = express.Router();
const {db} = require('../database/database.js');

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const Busboy = require('busboy');

const { GLOBAL_LIBRARY_DATA_PATH, USER_LIBRARY_DATA_PATH } = require('../utils/env.js');

// receives a file and saves it to the library
router.post('/upload', async (req, res) => {

    try {
    let headerParams = req.headers['params'];

        // Extract params from header and validate
        if (!headerParams) {
            return res.status(400).send('Missing upload parameters');
        }
    const params = JSON.parse(headerParams);
        const userId = req.session && req.session.userId;
        const username = req.session && req.session.username;
        if (!userId) {
            return res.status(401).send('Unauthorized');
        }
        if (!params.libraryId) {
            return res.status(400).send('Missing libraryId');
        }
        
        console.log("=== UPLOAD REQUEST ===");
        console.log("Library ID:", params.libraryId);

    
        // saves an entry in the database for the file to be processed (metadata extracted and populated into the db)
        let insertPendingSql = `
            INSERT INTO files_to_process (filename, library_id, folder_path, path, status) VALUES (?, ?, ?, ?, ?);
        `;
    
        // Resolve library and verify user has add permission
        let sql = `
            SELECT l.id, l.type, l.name, lf.path, lu.add_enabled, lu.see_enabled FROM libraries as l
            LEFT JOIN libraries_folders AS lf ON l.id = lf.library_id
            LEFT JOIN libraries_users AS lu ON lu.library_id = l.id AND lu.user_id = ?
            WHERE l.id = ?;
        `;
        let library = await db.prepare(sql).get(userId, params.libraryId);
    
        if (!library || !library.id) {
            return res.status(400).send('Library not found');
        }
        if (library.see_enabled === 0 || library.add_enabled === 0) {
            return res.status(401).send('Unauthorized');
        }
    
        // Build upload target using library name as the folder
        let uploadBase = library.type === 'global' ? GLOBAL_LIBRARY_DATA_PATH : USER_LIBRARY_DATA_PATH;
        
        // Simple structure: user/{username}/{library_name}/
        // No subfolders - library name IS the folder
        let fullDestinationPath = '';
        if (library.type === 'user') {
            fullDestinationPath = path.join(username, library.name);
        } else if (library.type === 'global') {
            fullDestinationPath = library.name;
        }
        
        let uploadPath = path.join(uploadBase, fullDestinationPath);
        
        console.log("Upload path:", uploadPath);

        // Get any folder_id for this library (we don't care which one, just need one for the foreign key)
        let folderIdRow = db.prepare(`SELECT id FROM libraries_folders WHERE library_id = ? LIMIT 1`).get(library.id);
        const folderId = folderIdRow ? folderIdRow.id : null;
        console.log("Using folder_id:", folderId);
    
        // create the path if it does not exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
    
        // deal with the form data/chunked data
    let busboy = Busboy({ headers: req.headers, immediate: true });
    
    busboy.on('file', async function (fieldname, file, filename, encoding, mimetype) {

        let count = 1;
        console.log("FILENAME", filename);
        
        // Parse the filename to get name and extension
        let filenameParsed = path.parse(filename.filename);
        let baseFilename = filenameParsed.name;
        let extension = filenameParsed.ext;
        
        // Create a unique folder name for this book
        let folderName = baseFilename;
        let folderPath = path.join(uploadPath, folderName);
        
        while (fs.existsSync(folderPath)) {
            folderName = `${baseFilename}_${count}`;
            folderPath = path.join(uploadPath, folderName);
            count++;
        }
        
        // Create the book's folder
        fs.mkdirSync(folderPath, { recursive: true });
        
        // Save the file inside the folder with its original filename
        let saveTo = path.join(folderPath, filename.filename);

        file.pipe(fs.createWriteStream(saveTo));

        file.on('end', async function () {
            db.prepare(insertPendingSql).run(filename.filename, library.id, folderPath, saveTo, 'pending');
            // If schema expects user_id and folder_id, upsert them separately
            try {
                db.prepare(`UPDATE files_to_process SET user_id = ?, folder_id = ? WHERE filename = ? AND library_id = ? AND path = ?`).run(userId, folderId, filename.filename, library.id, saveTo);
            } catch {}
        });            
    });        busboy.on('finish', async function () {
            res.send('File uploaded');
            //delete progressEvents[uuid];
        });

        req.pipe(busboy);

    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

module.exports = router;
var express = require('express');
var router = express.Router();
var axios = require('axios');

const {db} = require('../database/database.js');

const { pluginsMem, allowedPlugins } = require('../database/loki.js');

const { requiresPluginAuth } = require('../middleware/middleware.js');


// TODO: (PLUGINS) refactor all this


/*router.get('*', async function(req, res, next) {
    // proxy the query to the plugins server
    let url = req.originalUrl.replace('/plugins', '');
    console.log("url", url);
    let response = await new Promise((resolve, reject) => {
        axios.get(`http://localhost:5015${url}`)
            .then(response => {
                resolve(response.data);
            })
            .catch(err => {
                console.error(err);
                reject(false);
            });
    });
})*/


router.get('/settings', async (req, res) => {
    let userId = req.session.userId;
    const { publicUuid } = req.query;
    
    console.log('GET /settings called:', { userId, publicUuid });

    let sql = `SELECT data FROM plugin_data WHERE user_id = ? AND public_uuid = ?;`;

    try {
        let result = db.prepare(sql).get(userId, publicUuid);
        console.log("Plugin settings result: ", result);
        if (!result) {
            console.log("No plugin settings found for user");
            res.json(null);
            return;
        }
        res.json(result.data);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

router.get('/get-settings-plugin', async (req, res) => {
    try {

        const { publicUuid, privateUuid, userId } = req.query;

        let allowedPluginPrivateUuid = allowedPlugins[publicUuid];
        if (!allowedPluginPrivateUuid || allowedPluginPrivateUuid !== privateUuid) {
            console.log("PLUGIN AUTHORIZATION ERROR");
            res.json({ error: 'Plugin not allowed' });
            return;
        } else {
            console.log("PLUGIN AUTHORIZATION SUCCESS");
        }

        let sql = `SELECT data FROM plugin_data WHERE user_id = ? AND public_uuid = ?;`;

        let result = db.prepare(sql).get(userId, publicUuid);
        console.log("result: ", result);
        if (!result) {
            res.json(null);
            return;
        }
        res.json(result.data);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

router.post('/settings', (req, res) => {
    let userId = req.session.userId;
     const { publicUuid, data } = req.body;
     let jsonData = JSON.stringify(data);
     
     console.log('POST /settings called:', { userId, publicUuid, dataLength: jsonData.length });
     console.log('Full session:', req.session);
     
     if (!userId) {
         console.error('ERROR: No userId in session! User is not logged in or session is broken.');
         return res.status(401).json({ error: 'User not authenticated. Please log in again.' });
     }
 
     try {
 
         let selectSql = `SELECT * FROM plugin_data WHERE user_id = ? AND public_uuid = ?;`;
         let result = db.prepare(selectSql).get(userId, publicUuid);
         if (result) {
             console.log('Updating existing plugin settings');
             let sql = `UPDATE plugin_data SET data = ? WHERE user_id = ? AND public_uuid = ?;`;
             db.prepare(sql).run(jsonData, userId, publicUuid);
         } else {
             console.log('Inserting new plugin settings');
             let sql = `INSERT INTO plugin_data (user_id, public_uuid, data) VALUES (?, ?, ?);`;
             db.prepare(sql).run(userId, publicUuid, jsonData);
         }
         console.log('Plugin settings saved successfully');
         res.json({ success: true });
     } catch (err) {
         console.log("Error saving plugin settings:", err);
         res.status(500).json({ error: err });
     }
 });

router.post('/action', async (req, res) => {
    const { publicUuid, payload } = req.body;

    let userId = req.session.userId;
    payload['user_id'] = userId;
    
    console.log('Plugin action called:', { publicUuid, payload });

    // Special handling for calibre format conversion
    if (publicUuid === '985f95c0-fe2d-4213-8240-6b3799569cca' && payload.url === '/convert') {
        try {
            const { input_file, output_format, book_id, library_id } = payload;
            
            // Import the path utilities
            const path = require('path');
            const { GLOBAL_LIBRARY_DATA_PATH, USER_LIBRARY_DATA_PATH } = require('../utils/env.js');
            
            // Determine the full input path
            // input_file comes as "global/LibraryName/folder/format/file.epub"
            let fullInputPath;
            let relativeInputPath = input_file;
            if (input_file.startsWith('global/')) {
                fullInputPath = path.join(GLOBAL_LIBRARY_DATA_PATH, input_file.replace('global/', ''));
            } else if (input_file.startsWith('user/')) {
                fullInputPath = path.join(USER_LIBRARY_DATA_PATH, input_file.replace(/^user\/[^\/]+\//, ''));
            } else {
                return res.status(400).json({ error: 'Invalid file path format' });
            }
            
            // Get the directory and base filename
            const inputDir = path.dirname(fullInputPath);
            const inputBasename = path.basename(fullInputPath, path.extname(fullInputPath));
            
            // Construct output filename
            const outputFilename = `${inputBasename}.${output_format}`;
            const fullOutputPath = path.join(inputDir, outputFilename);
            
            // Update payload with full paths
            payload.input_file = fullInputPath;
            payload.output_file = fullOutputPath;
            
            console.log('Calibre conversion:', { fullInputPath, fullOutputPath });
            
            // Call the plugin
            let response = await pluginPost(publicUuid, payload);
            
            console.log('Calibre plugin response:', response);
            
            // If conversion was successful, add the new format to the database
            if (response && response.success) {
                console.log('Conversion successful, adding to database...');
                try {
                    // Get the relative path for the output file (just the filename)
                    const relativeOutputFilename = outputFilename;
                    const formatName = output_format.toUpperCase();
                    const formatExtension = output_format.toLowerCase();
                    
                    console.log('Database insert params:', { book_id, format: formatName, filename: relativeOutputFilename });
                    
                    // First, get or create the format in the formats table
                    let formatResult = db.prepare('SELECT id FROM formats WHERE name = ?').get(formatName);
                    let formatId;
                    
                    if (!formatResult) {
                        // Format doesn't exist, create it
                        const insertFormat = db.prepare('INSERT INTO formats (name, extension) VALUES (?, ?)');
                        const newFormat = insertFormat.run(formatName, formatExtension);
                        formatId = newFormat.lastInsertRowid;
                        console.log('Created new format:', { formatId, formatName, formatExtension });
                    } else {
                        formatId = formatResult.id;
                        console.log('Using existing format:', { formatId, formatName });
                    }
                    
                    // Insert into books_formats with the format_id
                    const insertFormatSql = `
                        INSERT INTO books_formats (book_id, format_id, path)
                        VALUES (?, ?, ?)
                    `;
                    const result = db.prepare(insertFormatSql).run(book_id, formatId, relativeOutputFilename);
                    
                    console.log('Database insert result:', result);
                    console.log('Added new format to database:', { book_id, formatId, format: formatName, filename: relativeOutputFilename });
                } catch (dbError) {
                    console.error('Error adding format to database:', dbError);
                    // Don't fail the request, just log the error
                }
            } else {
                console.log('Conversion not successful or no success flag in response');
            }
            
            return res.json(response);
        } catch (error) {
            console.error('Error preparing calibre conversion:', error);
            return res.status(500).json({ error: 'Failed to prepare conversion paths' });
        }
    }

    let response = await pluginPost(publicUuid, payload);
    res.json(response);
});

router.get('/all', (req, res) => {
    let plugins = pluginsMem.find();
    for (let plugin of plugins) {
        delete plugin.private_uuid;
    }
    res.json(plugins);
});

router.get('/get-settings', async (req, res) => {
    let userId = req.session.userId;

    const { publicUuid } = req.query;

    console.log("publicUuid: ", publicUuid, req.query);

    let sql = `
        SELECT u.username, u.email,
        json_group_object(s.name, us.value) AS setting_value,
        json_group_object(s.name, s.fallback_value) AS setting_fallback_value
        FROM users AS u
        LEFT JOIN user_settings AS us ON u.id = us.user_id
        LEFT JOIN settings AS s ON s.id = us.setting_id
        WHERE u.id = ?;    
    `;

    try {
        let result = db.prepare(sql).get(userId);

        if (!result) {
            console.log('User not found');
            res.status(500).json({ error: 'User not found' });
            return;
        }

        let plugin = pluginsMem.findOne({ public_uuid: publicUuid });
        if (!plugin) {
            console.log('Plugin not found');
            res.status(500).json({ error: 'Plugin not found' });
            return;
        }

        console.log("plugin: ", plugin);

        let pluginContainerName = plugin.container_name;
        let pluginContainerPort = plugin.container_port;

        let settingsEntrypoint = plugin.entrypoints.find(entrypoint => entrypoint.type === 'settings');
        if (!settingsEntrypoint) {
            console.log('Settings entrypoint not found');
            res.status(500).json({ error: 'Settings entrypoint not found' });
            return;
        }

        let settingsUrl = `http://${pluginContainerName}:${pluginContainerPort}/get-settings`;

        let settingsResult = await axios.get(settingsUrl, {
            params: {
                username: result.username,
            }
        });


        res.json(settingsResult.data);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});


router.get('/pluginData', (req, res) => {
    console.log("pluginData req.query: ", req.query);
    console.log("session data: ", req.session);

    // get the username frome the session
    let username = req.session.username;

    // get the user_id from the table users
    let sqlUserId = `SELECT id FROM users WHERE username = ?;`;
    let userId = db.prepare(sqlUserId).get(username).id;

    if (!userId) {
        res.json({ error: 'User not found' });
    }

    // get the data from database in table "plugindata" (in the table, plugin_id references the table "plugins"), the data is in the column "data", and return the data
    let pluginId = req.query.pluginId;
    let sql = `SELECT is_encrypted, algorithm, key, iv, data FROM plugindataencrypted AS pdata LEFT JOIN plugins AS p ON pdata.plugin_id = p.id WHERE p.uuid = ? AND user_id = ?;`;
    let result = db.prepare(sql).get(pluginId, userId);
    if (!result) {
        res.json({})
    }
    console.log("pluginData result: ", result);
    res.json(result);
});

router.post('/register', requiresPluginAuth, (req, res) => {
    try {
        //console.log("PLUGIN REGISTER CALLED");
        const { name, 
            description, 
            public_uuid, 
            private_uuid,
            container_port,
            container_name,
            entrypoints,
            last_modified_ts } = req.body;
    
        let pluginData = {
            name: name,
            description: description,
            public_uuid: public_uuid,
            private_uuid: private_uuid,
            container_port: container_port,
            container_name: container_name,
            entrypoints: entrypoints,
            last_modified_ts: last_modified_ts
        }
    
        let allowedPluginSecret = allowedPlugins[public_uuid];
        if (!allowedPluginSecret) {
            res.json({ error: 'Plugin not allowed' });
        }
    
        //console.log("pluginData: ", pluginData);    
    
        let registeredPlugin = pluginsMem.findOne({ public_uuid: public_uuid });
        //console.log("plugin: ", registeredPlugin);
        // if the plugin exists, update the data
        if (registeredPlugin && parseInt(registeredPlugin.last_modified_ts) < parseInt(last_modified_ts)) {
    
            registeredPlugin.name = name;
            registeredPlugin.description = description;
            //registeredPlugin.public_uuid = public_uuid;
            registeredPlugin.private_uuid = private_uuid;
            registeredPlugin.container_port = container_port;
            registeredPlugin.container_name = container_name;
            registeredPlugin.entrypoints = entrypoints;
            registeredPlugin.last_modified_ts = last_modified_ts;
    
            pluginsMem.update(registeredPlugin);
        } else if (!registeredPlugin) {
            // if the plugin does not exist, insert the data
            pluginsMem.insert(pluginData);
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ error: error });
    }
});

router.post('/pluginData', (req, res) => {
    console.log("pluginData req.body: ", req.body);
    console.log("session data: ", req.session);

    // get the username frome the session
    let username = req.session.username;

    // get the user_id from the table users
    let sqlUserId = `SELECT id FROM users WHERE username = ?;`;
    let userId = db.prepare(sqlUserId).get(username).id;

    if (!userId) {
        res.json({ error: 'User not found' });
    }

    // update the data in the database in table "plugindata" (in the table, plugin_id references the table "plugins"), the data is in the column "data"
    let pluginId = req.body.pluginId;
    let data = req.body.data;
    data = JSON.stringify(data);

    console.log("type of data: ", typeof data);
    console.log('type of pluginId: ', typeof pluginId);

    // check if there is a row with data in the table plugindata
    let sql = `SELECT * FROM plugin_data WHERE plugin_uuid = ? AND user_id = ?;;`;
    let result = db.prepare(sql).all(pluginId, userId);
    console.log("result: ", result);

    // if the row exists, update the data
    if (result.length > 0) {
        sql = `UPDATE plugin_data SET data = ? WHERE plugin_id = (SELECT id FROM plugins WHERE uuid = ?) AND user_id = ?;;`;
        db.prepare(sql).run(data, pluginId, userId);
    } else {
        // if the row does not exist, insert the data
        sql = `INSERT INTO plugin_data (plugin_id, data, is_encrypted) VALUES ((SELECT id FROM plugins WHERE uuid = ?), ?, 0);`;
        db.prepare(sql).run(pluginId, data);
    }
    res.json({ success: true });
});

const pluginPost = async (publicUuid, payload) => {
    try {

        console.log("allowedPlugins: ", allowedPlugins);
        console.log("registeredPlugins: ", pluginsMem.find());

        let allowedPlugin = allowedPlugins[publicUuid];
        let registeredPlugin = pluginsMem.findOne({ public_uuid: publicUuid });

        console.log("allowedPlugin: ", allowedPlugin);
        console.log("registeredPlugin: ", registeredPlugin);

        if (!allowedPlugin || !registeredPlugin) {
            return { error: 'Plugin not found' };
        }

        const { url } = payload;

        const { container_port, container_name, entrypoints } = registeredPlugin;

        let basicAuthBase64 = Buffer.from(`${container_name}:${allowedPlugin}`).toString('base64');
        let headers = {
            authorization: `Basic ${basicAuthBase64}`
        };
        

        // we build the url
        let actionUrl = `http://${container_name}:${container_port}${url}`;
        console.log("sending action to url: ", url);
        const response = await axios.post(actionUrl, payload, { headers });
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

const pluginGet = async (publicUuid, data) => {
    try {

        let allowedPlugin = allowedPlugins[publicUuid];
        let registeredPlugin = pluginsMem.findOne({ public_uuid: publicUuid });

        if (!allowedPlugin || !registeredPlugin) {
            return { error: 'Plugin not found' };
        }

        const { container_port, container_name, entrypoints } = allowedPlugin;
        const { baseUrl, endpointUrl, payload } = data;

        // we check if the endpoint url is in the entrypoints
        if (!entrypoints.includes(endpointUrl)) {
            return { error: 'Endpoint not allowed' };
        }

        let basicAuthBase64 = Buffer.from(`${container_name}:${registeredPlugin.secret}`).toString('base64');
        let headers = {
            authorization: `Basic ${basicAuthBase64}`
        };
        

        // we build the url
        let url = `http://${baseUrl}:${container_port}/${endpointUrl}`;
        const response = await axios.get(url, { headers }, { params: payload });
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

// Download a book from Gutenberg and add it to a library
router.post('/gutenberg/download', async (req, res) => {
    try {
        const userId = req.session && req.session.userId;
        const username = req.session && req.session.username;
        
        if (!userId) {
            return res.status(401).send('Unauthorized');
        }

        const { bookId, libraryId } = req.body;
        
        if (!bookId || !libraryId) {
            return res.status(400).json({ error: 'Missing bookId or libraryId' });
        }

        console.log(`User ${username} downloading Gutenberg book ${bookId} to library ${libraryId}`);

        // Verify user has access to the library
        let sql = `
            SELECT l.id, l.type, l.name, lf.path, lu.add_enabled, lu.see_enabled 
            FROM libraries as l
            LEFT JOIN libraries_folders AS lf ON l.id = lf.library_id
            LEFT JOIN libraries_users AS lu ON lu.library_id = l.id AND lu.user_id = ?
            WHERE l.id = ? AND (l.type = 'global' OR (lu.see_enabled = 1 AND lu.add_enabled = 1));
        `;
        
        let library = await db.prepare(sql).get(userId, libraryId);
        
        if (!library || !library.id) {
            return res.status(403).json({ error: 'Library not found or access denied' });
        }

        if (library.add_enabled === 0) {
            return res.status(403).json({ error: 'You do not have permission to add books to this library' });
        }

        // Download the EPUB from Project Gutenberg using the deterministic URL pattern
        // Pattern: https://www.gutenberg.org/cache/epub/{id}/pg{id}-images.epub
        const downloadUrl = `https://www.gutenberg.org/cache/epub/${bookId}/pg${bookId}-images.epub`;
        
        console.log(`Downloading from: ${downloadUrl}`);
        
        const response = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 60000, // 60 second timeout
            maxRedirects: 5 // Follow redirects
        });

        if (response.status !== 200) {
            return res.status(500).json({ error: 'Failed to download book from Gutenberg' });
        }

        // Prepare file system paths
        const { GLOBAL_LIBRARY_DATA_PATH, USER_LIBRARY_DATA_PATH } = require('../utils/env.js');
        const fs = require('fs');
        const path = require('path');
        
        let uploadBase = library.type === 'global' ? GLOBAL_LIBRARY_DATA_PATH : USER_LIBRARY_DATA_PATH;
        
        let fullDestinationPath = '';
        if (library.type === 'user') {
            fullDestinationPath = path.join(username, library.name);
        } else if (library.type === 'global') {
            fullDestinationPath = library.name;
        }
        
        let uploadPath = path.join(uploadBase, fullDestinationPath);
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        // Create book folder and use standard filename convention
        const filename = `book.epub`;  // Use standard naming convention
        let folderName = `gutenberg_${bookId}`;
        let folderPath = path.join(uploadPath, folderName);
        let count = 1;
        
        while (fs.existsSync(folderPath)) {
            folderName = `gutenberg_${bookId}_${count}`;
            folderPath = path.join(uploadPath, folderName);
            count++;
        }
        
        fs.mkdirSync(folderPath, { recursive: true });
        
        // Save the file
        let saveTo = path.join(folderPath, filename);
        fs.writeFileSync(saveTo, response.data);

        // Get folder_id for the library
        let folderIdRow = db.prepare(`SELECT id FROM libraries_folders WHERE library_id = ? LIMIT 1`).get(library.id);
        const folderId = folderIdRow ? folderIdRow.id : null;

        // Add to files_to_process table for metadata extraction
        let insertPendingSql = `
            INSERT INTO files_to_process (filename, library_id, folder_path, path, status, user_id, folder_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?);
        `;
        
        db.prepare(insertPendingSql).run(filename, library.id, folderPath, saveTo, 'pending', userId, folderId);

        console.log(`Book ${bookId} downloaded and queued for processing`);

        res.json({ 
            success: true, 
            message: 'Book downloaded successfully and will be processed shortly',
            bookId: bookId
        });

    } catch (err) {
        console.error("Error downloading Gutenberg book:", err);
        
        if (err.code === 'ECONNABORTED') {
            return res.status(504).json({ error: 'Download timeout - the book file may be too large or the connection is slow' });
        }
        
        if (err.response && err.response.status === 404) {
            return res.status(404).json({ error: 'Book not found on Gutenberg' });
        }
        
        res.status(500).json({ error: 'Failed to download book', details: err.message });
    }
});

module.exports = router;
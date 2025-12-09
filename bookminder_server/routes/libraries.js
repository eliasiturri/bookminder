const express = require('express');
const router = express.Router();
const {db} = require('../database/database.js');

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const { roleActionGuard } = require('../middleware/middleware.js');

const { GLOBAL_LIBRARY_DATA_PATH, USER_LIBRARY_DATA_PATH } = require('../utils/env.js');
const { META_LIBRARY_DATA_PATH } = require('../utils/env.js');
const Busboy = require('busboy');

const { insertLibrariesSql,
    insertLibrariesFoldersSql,
    selectLibraryIdByUuidSql,
    updateLibraryByUuidSql,
    insertLibraryFoldersSql,
    deleteLibraryByIdSql,
    getGlobalOrUserLibrariesNoUsernameSql,
    getGlobalOrUserLibrariesByUsernameSql,
    getGlobalOrUserLibrariesByUserIdSql,
    selectAllLibrariesByUserIdSql,
    selectRecentlyAddedBooksByUsernameAndUserId,
    selectReadingBooksByUsernameAndUserId,
    selectAllBooksByUsernameAndUserIdSql,
    selectAllBooksByUsernameAndUserIdAndLibraryIdSql,
    selectAllAuthorsSql,
    selectBookDetailsSql,
    selectBookUrlSql,
    selectBookProgressSql,
    selectLibrariesUsersByLibraryNameAndUsernameSql,
    insertIntoLibrariesUsersByLibraryNameAndUserIdAndSeeEnabledDeleteEnabledSql,
    updateLibrariesUsersSeeEnabledDeleteEnabledByLibraryNameAndUserNameSql,
    selectMyLibrariesNyUserIdSql
 } = require('../sql/librariesStatements.js');

const { actionGuard } = require('../utils/guards.js');
const { testMiddleware } = require('../middleware/middleware.js');


// adds a library with its folders
router.post('/save-library', async (req, res) => {

    const { username, name, libraryType, description, folders } = req.body;
    const  userId  = req.session.userId;
    console.log("USER ID", userId);

    try {
        let dataPath = libraryType === 'global' ? GLOBAL_LIBRARY_DATA_PATH : USER_LIBRARY_DATA_PATH;
        // atomic transaction
        let createdUuid = uuidv4();
        let createdId = null;
        const transaction = db.transaction(() => {
            // save the new library entry
            let results = db.prepare(insertLibrariesSql).run(libraryType, '/meta/placeholders/lib-placeholder.jpg', name, description, createdUuid);
            let lastInsertedRowId = results.lastInsertRowid;
            createdId = lastInsertedRowId;

            // Persist provided folders (if any)
            if (Array.isArray(folders)) {
                for (const f of folders) {
                    // Accept either raw string or object with path/isNew/removed
                    const pathStr = typeof f === 'string' ? f : (f && f.path ? f.path : null);
                    const removed = typeof f === 'object' && f && f.removed === true;
                    if (!pathStr || removed) continue;
                    db.prepare(insertLibraryFoldersSql).run(lastInsertedRowId, pathStr, dataPath);
                }
            }

            if (libraryType == 'user') {
                let sqlInsertLibrariesUsers = `INSERT INTO libraries_users (library_id, user_id, see_enabled, add_enabled, delete_enabled) VALUES (?, ?, 1, 1, 1);`;
                db.prepare(sqlInsertLibrariesUsers).run(lastInsertedRowId, userId);
            }
        });
        transaction();
    console.log("LIBRARY CREATED", { id: createdId, uuid: createdUuid });
    // Return identifier and image_path so frontend can immediately reflect the cover
    const image_path = `meta/libraries/${createdId}/cover.png`;
    res.json({ message: 'Library created', id: createdId, uuid: createdUuid, image_path });
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }  
});

// edits a library with its folders
router.post('/edit-library', async (req, res) => {

    const { username, name, libraryType, libraryUUID, description, folders } = req.body;

    try {
        // atomic transaction
        let dataPath = libraryType === 'global' ? GLOBAL_LIBRARY_DATA_PATH : USER_LIBRARY_DATA_PATH;

        const transaction = db.transaction(() => {
            // update library data
            db.prepare(updateLibraryByUuidSql).run(name, description, libraryUUID);
            let libraryId = db.prepare(selectLibraryIdByUuidSql ).get(libraryUUID).id;

            // Skip folder management for now - folders contain books and can't be safely deleted
            // The LibraryFolders component is commented out in the UI anyway
            // If folder management is needed in the future, implement proper cascade handling
        });
        transaction();
        res.json({ message: 'Library updated' });
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    } 
});

// deletes a library with its folders
router.delete('/library', async (req, res) => {

    const { libraryUUID } = req.body;

    try {

        // atomic transaction
        const transaction = db.transaction(() => {
            const row = db.prepare(selectLibraryIdByUuidSql).get(libraryUUID);
            if (!row || !row.id) return; // nothing to delete
            const libraryId = row.id;

            // Get all books in this library
            const booksInLibrary = db.prepare(`SELECT DISTINCT book_id FROM books_libraries WHERE library_id = ?`).all(libraryId);
            
            // Delete all book-related data for each book
            for (const bookRow of booksInLibrary) {
                const bookId = bookRow.book_id;
                
                // Delete all book relationships in order
                db.prepare(`DELETE FROM books_authors WHERE book_id = ?`).run(bookId);
                db.prepare(`DELETE FROM books_languages WHERE book_id = ?`).run(bookId);
                db.prepare(`DELETE FROM books_identifiers WHERE book_id = ?`).run(bookId);
                db.prepare(`DELETE FROM books_publishers WHERE book_id = ?`).run(bookId);
                db.prepare(`DELETE FROM books_formats WHERE book_id = ?`).run(bookId);
                db.prepare(`DELETE FROM books_reading WHERE book_id = ?`).run(bookId);
                db.prepare(`DELETE FROM books_libraries WHERE book_id = ?`).run(bookId);
                
                // Delete the book itself
                db.prepare(`DELETE FROM books WHERE id = ?`).run(bookId);
            }
            
            // Delete library relationships
            // 1. Delete libraries_users entries
            db.prepare(`DELETE FROM libraries_users WHERE library_id = ?`).run(libraryId);
            
            // 2. Delete the folders for this library
            db.prepare(`DELETE FROM libraries_folders WHERE library_id = ?`).run(libraryId);
            
            // 3. Delete any pending file processing entries
            db.prepare(`DELETE FROM files_to_process WHERE library_id = ?`).run(libraryId);

            // 4. Finally delete the library itself
            db.prepare(deleteLibraryByIdSql).run(libraryId);
        });
        transaction();
        res.json({ message: 'Library deleted' });
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

// upload or replace a library cover image
router.post('/upload-cover', async (req, res) => {
    try {
        const userId = req.session && req.session.userId;
        if (!userId) {
            return res.status(401).send('Unauthorized');
        }

        const busboy = Busboy({ headers: req.headers });
        let libraryUUID = null;
        let libraryId = null;
        let fileBuffer = null;
        let filename = null;

        busboy.on('field', (fieldname, val) => {
            if (fieldname === 'libraryUUID') {
                libraryUUID = val;
            }
        });

        busboy.on('file', (fieldname, file, fname, encoding, mimetype) => {
            filename = fname;
            const chunks = [];
            file.on('data', d => chunks.push(d));
            file.on('end', () => {
                fileBuffer = Buffer.concat(chunks);
            });
        });

        busboy.on('finish', () => {
            try {
                if (!libraryUUID) {
                    return res.status(400).send('Missing libraryUUID');
                }
                if (!fileBuffer) {
                    return res.status(400).send('Missing file');
                }

                const row = db.prepare(`SELECT id FROM libraries WHERE uuid = ?`).get(libraryUUID);
                if (!row) {
                    return res.status(404).send('Library not found');
                }
                libraryId = row.id;

                const destDir = path.join(META_LIBRARY_DATA_PATH, 'libraries', String(libraryId));
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }
                const destPath = path.join(destDir, 'cover.png');
                fs.writeFileSync(destPath, fileBuffer);

                // Save relative meta path into libraries.image_path with timestamp to bust cache
                const relativeImagePath = path.join('meta', 'libraries', String(libraryId), 'cover.png');
                const imagePathWithTimestamp = `${relativeImagePath}?t=${Date.now()}`;
                db.prepare(`UPDATE libraries SET path = 'cover.png' WHERE id = ?`).run(libraryId);

                return res.status(200).json({ image_path: imagePathWithTimestamp });
            } catch (e) {
                console.error('Error saving library cover', e);
                return res.status(500).send('Error saving cover');
            }
        });

        req.pipe(busboy);
    } catch (err) {
        console.error('upload-cover failed', err);
        return res.status(500).send('Internal server error');
    }
});

// returns the global libraries (if no username is passed) or the global libraries the for the passed username
// Used for the LIBRARY ADMINISTRATION view
router.get('/global-libraries', async (req, res) => {  

    const { username } = req.query;
    const userId = req.session.userId;

    try {
        let sql = "";
        let libraries = [];

        if (!username) {
            // Return all global libraries (admin panel view)
            libraries = db.prepare(getGlobalOrUserLibrariesNoUsernameSql).all('global');
            // turns the folders json string into an array
            const timestamp = Date.now();
            for (let i = 0; i < libraries.length; i++) {
                let f = libraries[i].folders;
                let j = JSON.parse(f);
                libraries[i].folders = j;
                // Add timestamp to image_path to bust browser cache
                if (libraries[i].image_path) {
                    libraries[i].image_path = `${libraries[i].image_path}?t=${timestamp}`;
                }
            }        
            res.send(libraries);
        } else {
            libraries = db.prepare(getGlobalOrUserLibrariesByUsernameSql).all(username, 'global');
            res.send(libraries);
        }
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

// returns the user libraries (if no username is passed) or the user libraries the for the passed username
// Used for the LIBRARY ADMINISTRATION view
router.get('/user-libraries', async (req, res) => {  

    const { username } = req.query;

    const  userId  = req.session.userId;

    try {
        // Return only libraries associated to the logged-in user
        let libraries = db.prepare(getGlobalOrUserLibrariesByUserIdSql).all(userId, 'user');
        // Parse folders JSON string into array (same as global libraries)
        const timestamp = Date.now();
        for (let i = 0; i < libraries.length; i++) {
            let f = libraries[i].folders;
            let j = JSON.parse(f);
            libraries[i].folders = j;
            // Add timestamp to image_path to bust browser cache
            if (libraries[i].image_path) {
                libraries[i].image_path = `${libraries[i].image_path}?t=${timestamp}`;
            }
        }
        res.send(libraries);
        
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

// returns all the libraries for the logged in user
// Used in the HOME view
router.get('/all-libraries', async (req, res) => {  

    const  userId  = req.session.userId;

    

    try {
    let libraries = db.prepare(selectAllLibrariesByUserIdSql).all(userId);
        res.send(libraries);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }    
});


// returns logged in user libraries
// Used in the HOME view
router.get('/my-libraries', async (req, res) => {  

    try {
        let userId = req.session.userId;

        let libraries =  db.prepare(selectMyLibrariesNyUserIdSql).all(userId);
        for (let i = 0; i < libraries.length; i++) {
            libraries[i].paths = JSON.parse(libraries[i].paths);
        }

        res.send(libraries);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

// returns de recently added books for the logged in user
// Used in the HOME view
router.get('/recently-added', async (req, res) => {

    const userId = req.session.userId;
    const username = req.session.username;

    try {
        let libraries = db.prepare(selectRecentlyAddedBooksByUsernameAndUserId).all(username, userId, userId);
        // turns the books json string into an array
        for (let i = 0; i < libraries.length; i++) {
            libraries[i].books = JSON.parse(libraries[i].books);
        }
        res.send(libraries);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
        // TODO: (HTTP) ADD A RETURN STATEMENT IN ALL CATCH BLOCKS
        return;
    }
});

// returns the books the logged in user is currently reading (for each library)
// Used in the HOME view
router.get('/reading', async (req, res) => {

    const userId = req.session.userId;
    const username = req.session.username; 
    
    try {
        let libraries = db.prepare(selectReadingBooksByUsernameAndUserId).all(username, userId, userId);

        // turns the books json string into an array
        for (let i = 0; i < libraries.length; i++) {
            libraries[i].books = JSON.parse(libraries[i].books);
        }
        res.send(libraries);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

// returns the recently added books for the logged in user, for some specific library or otherwise
// Used for the BOOKS view
router.get('/all-books', async (req, res) => {

    const userId = req.session.userId;
    const username = req.session.username;

    const libraryId = req.query.libraryId;

    let books = [];

    try {
        if (libraryId) {
            books = db.prepare(selectAllBooksByUsernameAndUserIdAndLibraryIdSql).all(username, username, username, userId, libraryId);

            // turns the author_ids json string into an array
            for (let i = 0; i < books.length; i++) {
                books[i].author_ids = JSON.parse(books[i].author_ids);
            }
            res.send(books);
        } else {
            books = db.prepare(selectAllBooksByUsernameAndUserIdSql).all(username, username, username, userId);

            // turns the author_ids json string into an array
            for (let i = 0; i < books.length; i++) {
                books[i].author_ids = JSON.parse(books[i].author_ids);
                books[i].formats = JSON.parse(books[i].formats);
            }

            res.send(books);
        }
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }    
});

// returns all the authors for the logged in user
// Used for the AUTHORS view
router.get('/all-authors', async (req, res) => {

    const userId = req.session.userId;

    try {
        let authors = db.prepare(selectAllAuthorsSql).all(userId);
        res.send(authors);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

// returns the details for a specific book given its id and the library it belongs to
// Used in the BOOK DETAILS view
router.get('/book-details', async (req, res) => {

    const userId = req.session.userId;
    const username = req.session.username;

    const bookId = req.query.bookId;
    const libraryId = req.query.libraryId;

    try {
        book = db.prepare(selectBookDetailsSql).get(username, username, username, libraryId, userId, bookId);

        console.log("Raw book cover_url from DB:", book.cover_url);
        
        // turns the json strings into arrays
        book.authors = JSON.parse(book.authors);
        book.identifiers = JSON.parse(book.identifiers);
        book.formats = JSON.parse(book.formats);

        res.send(book);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }  
});    

// gets the book download url (needed to open the book in foliate-js), and the reading progress
// Used in the book reading view (foliate-js)
router.get('/book-url', async (req, res) => {
    
        const { bookId, libraryId, formatId } = req.query;
        const username = req.session.username;

        console.log(`[book-url] Request: bookId=${bookId}, libraryId=${libraryId}, formatId=${formatId}, username=${username}`);

        try {
            // Simple approach: get the book's path for the requested format or first available
            let chosenFormatId = formatId && parseInt(formatId) > 0 ? parseInt(formatId) : null;
            let result = null;
            
            if (chosenFormatId) {
                console.log(`[book-url] Querying with formatId=${chosenFormatId}`);
                result = db.prepare(selectBookUrlSql).get(username, chosenFormatId, bookId);
                console.log(`[book-url] Query result:`, result);
            }
            
            // If no result, get first available format
            if (!result || !result.path) {
                console.log('[book-url] No result from primary query, trying fallback');
                const fallbackSql = `
                SELECT bp.progress,
                CASE WHEN lf.base_path LIKE '%global' 
                     THEN CONCAT('global', '/', l.name, '/', COALESCE(bf.path, ''), CASE WHEN bf.path IS NOT NULL AND bf.path != '' THEN '/' ELSE '' END, b.path) 
                     ELSE CONCAT('user', '/', ?, '/', l.name, '/', COALESCE(bf.path, ''), CASE WHEN bf.path IS NOT NULL AND bf.path != '' THEN '/' ELSE '' END, b.path) END AS path
                FROM books AS b 
                LEFT JOIN books_formats AS bf ON bf.book_id = b.id
                LEFT JOIN books_reading AS bp ON b.id = bp.book_id
                INNER JOIN books_libraries AS bl ON b.id = bl.book_id
                LEFT JOIN libraries AS l ON l.id = bl.library_id
                LEFT JOIN libraries_folders AS lf ON lf.library_id = l.id
                WHERE b.id = ?
                LIMIT 1;`;
                result = db.prepare(fallbackSql).get(username, bookId);
                console.log(`[book-url] Fallback result:`, result);
            }
            
            if (!result || !result.path) {
                console.log('[book-url] ERROR: No path found for book');
                return res.status(404).json({ error: 'Book format path not found' });
            }

            // Convert to assets URL
            let assetUrl = null;
            if (result.path.startsWith('global/')) {
                assetUrl = `/assets/global/${result.path.replace(/^global\//, '')}`;
            } else if (result.path.startsWith('user/')) {
                assetUrl = `/assets/user/${result.path.replace(/^user\//, '')}`;
            } else {
                assetUrl = result.path;
            }

            console.log(`[book-url] Final asset URL: ${assetUrl}`);
            res.send({ url: assetUrl, progress: result.progress });
        } catch (err) {
            console.log("[book-url] Error:", err);
            res.status(500).json({ error: err.message });
        }
    });

// updates the reading progress for a book for the logged in user
// Used in the book reading view (foliate-js)
router.post('/progress', async (req, res) => {
    let userId = req.session.userId;

    const { bookId, progress } = req.body;
    
    try {
        // Upsert reading progress per user/book
        db.prepare(selectBookProgressSql).run(userId, bookId, progress, progress);
        res.json({ message: 'Progress updated' });
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

// saves the user permissions over the libraries
router.post('/global-libraries-access', roleActionGuard('can edit users'), async (req, res) => {

    const { username, changedLibraries } = req.body;

    console.log(username, changedLibraries);

    try {
        // atomic transaction
        // TODO: (SQL) use insertMany
        const transaction = db.transaction(() => {
            for (let i = 0; i < changedLibraries.length; i++) {
                let library = changedLibraries[i];
                let libraryName = library.library_name;
                let seeEnabled = library.see_enabled;
                let addEnabled = library.add_enabled;
                let deleteEnabled = library.delete_enabled;

                let libraryResult = db.prepare(selectLibrariesUsersByLibraryNameAndUsernameSql).get(libraryName, username);
                if (!libraryResult) {
                    db.prepare(insertIntoLibrariesUsersByLibraryNameAndUserIdAndSeeEnabledDeleteEnabledSql).run(libraryName, username, seeEnabled, addEnabled, deleteEnabled);
                    continue;
                } else {
                    db.prepare(updateLibrariesUsersSeeEnabledDeleteEnabledByLibraryNameAndUserNameSql).run(seeEnabled, addEnabled, deleteEnabled, libraryName, username);
                }
            }
        });  
        transaction();
        res.json({ message: 'Access updated' });      
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }

    
});

// folder browswer
// TODO: (HTTP) use a get request
router.post('/folders', async (req, res) => {
    try {
        const { username, libraryType, folderPath } = req.body;
        
        let dataPath = null;
        if (libraryType == 'global') {
            dataPath = GLOBAL_LIBRARY_DATA_PATH;
        } else if (libraryType == 'user') {
            dataPath = USER_LIBRARY_DATA_PATH;
        } else {
            console.log("Invalid library type");
            res.status(400).send('Invalid library type');
        }

        let finalDataPath = path.join(dataPath, folderPath);
        
        let folders = fs.readdirSync(finalDataPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
                return {
                    name: dirent.name,
                    basePath: dataPath,
                    relativePath: dirent.name,
                    hasSubfolders: fs.readdirSync(finalDataPath, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).length > 0,
                };
            });

        res.send(folders);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }    
});

// creates a nes folder under a path
router.post('/new-folder', async (req, res) => {
    try {
        const { usedPath, libraryType, newFolderName } = req.body;

        let dataPath = null;

        if (libraryType == 'global') {
            dataPath = GLOBAL_LIBRARY_DATA_PATH;
        } else if (libraryType == 'user') {
            dataPath = USER_LIBRARY_DATA_PATH;
        } else {
            console.log("Invalid library type");
            res.status(400).send('Invalid library type');
            return;
        }
    
        // TODO: (ENV) use an env variable to set the domain name and path
        let finalDataPath = path.join(dataPath, usedPath, newFolderName);
        fs.mkdirSync(finalDataPath);


        res.json({ message: 'Folder created' });

    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }    
});

// any other path in this route will return an error
router.all('*', (req, res, next) => {
    res.status(404).send({ error: 'Invalid URL' });
});

module.exports = router;
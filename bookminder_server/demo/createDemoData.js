const {db} = require('../database/database.js');
const { GLOBAL_LIBRARY_DATA_PATH, USER_LIBRARY_DATA_PATH } = require('../utils/env.js');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const Book = require('../classes/Book.js');
const { ca } = require('date-fns/locale');
const axios = require('axios');

// Fallback small PNG if a library cover source is missing
const LIB_PLACEHOLDER_PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAABc0lEQVR4nO2XPU7CUBCGn1QYpQb6QmCwDqKpYyQvWQxkq8kWgk4kqI4qL4fGza6PZcJm3c8l2mLNAk3bRkF5eCk8t5z3P8gJY0F7G7I9oZPZqTgZ3QHfXgC9EwzYI3aP0v0wGQv2yQyP9sQ2YwYQe1KXlH4rS0gk6I1hYVf9wJm6wqgVxq3i1CwXzQjC8nT9QfQp3bUE2mLwJwYh6nL8m8tqv0S7l1GzWj0Eo8uQHk3ZV3I3F1cCwNlJvQHc0U2K8fQz2q5VvW4o2mBaA2sXkKcKp1O3Yl0eCkE1m0ZkNwI3lJkO0g2k5xCkNzQ7kqg+o6G5fU3tqH6Y7fQvIYF7Ccll8j9g3uQH7uVb3C3wD9zCwTzY9Zs8mS8YcE7xwZs0mP6tVfKV8KZrE0kP2l4CkKpL0V8S1wqYQvGv9Vb7g7wK8bV8j2lY8o9z8Wv8b+P8J+qe7JY5y8WgAAAABJRU5ErkJggg==';

async function fetchStockCover(seed, outPath, w = 600, h = 900) {
    try {
        const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
        fs.writeFileSync(outPath, res.data);
        return true;
    } catch (e) {
        console.warn(`[seed] stock cover fetch failed for "${seed}": ${e.message}`);
        return false;
    }
}

// type can be 'global' or 'user' or 'both'
// options: { userOffset?: number }
async function createDemoData(type, userId, options = {}) {

    // Prefer generated demo data if present
    let books;
    try {
        books = require('./generated/books.json');
        console.log(`Using generated demo books: ${books.length} entries`);
    } catch (e) {
        books = require('./books.json');
        console.log(`Using default demo books: ${books.length} entries`);
    }
    let libraries = require('./libraryNames.json');

    // Prepare a working copy of books and shuffle by default for random distribution
    const doShuffle = options.shuffle !== false; // default true
    let workingBooks = Array.isArray(books) ? books.slice() : [];
    if (doShuffle) {
        for (let i = workingBooks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [workingBooks[i], workingBooks[j]] = [workingBooks[j], workingBooks[i]];
        }
    }

    if (type == 'global') {
        let rG = await createLibraries(userId, libraries.global, GLOBAL_LIBRARY_DATA_PATH);
        let okGlobal = rG.ok;
        let insertedGlobalLibraryIds = rG.l;
        let insertedGlobalFolderIds = rG.f;
        //console.log("ok", okGlobal, "insertedGlobalLibraryIds", insertedGlobalLibraryIds, "insertedGlobalFolderIds", insertedGlobalFolderIds);
        if (okGlobal) {

            let aIndex = 0;

            for (let i = 0; i < 5; i++) {
                let libraryId = insertedGlobalLibraryIds[i][0];
                let libraryName = insertedGlobalLibraryIds[i][2];
                let folderName = insertedGlobalLibraryIds[i][1];
                let folderId = insertedGlobalFolderIds[0];

                let startIndex = (i * 16) + aIndex;
                let endIndex = startIndex + 16;

                let okBooks, insertedBookIds = insertBooks(workingBooks.slice(startIndex, endIndex), 'global', userId, libraryId, folderId, folderName, libraryName);
            }
        }        
    } else if (type == 'user') {
        // Optionally vary user library names for demo users to differentiate
        let userLibs = libraries.user.map(lib => ({ ...lib }));
        if (options && options.variant === 'demo') {
            userLibs = userLibs.map((lib, idx) => ({
                ...lib,
                name: `Demo — ${lib.name}`,
                description: `${lib.description} (Demo user library)`
            }));
        }
        let r = await createLibraries(userId, userLibs, USER_LIBRARY_DATA_PATH);
        let okUser = r.ok;
        let insertedUserLibraryIds = r.l;
        let insertedUserFolderIds = r.f;
        if (okUser) {
            // allow overriding which slice of demo books to use per-user
            let aIndex = (options && typeof options.userOffset === 'number') ? options.userOffset : 80;

            for (let i = 0; i < 5; i++) {
                let libraryId = insertedUserLibraryIds[i][0];
                console.log("libraryId", libraryId);
                let libraryName = insertedUserLibraryIds[i][2];
                let folderName = insertedUserLibraryIds[i][1];
                let folderId = insertedUserFolderIds[0];

                let startIndex = (i * 16) + aIndex;
                let endIndex = startIndex + 16;
                console.log("startIndex", startIndex, "endIndex", endIndex);

                let okBooks, insertedBookIds = insertBooks(workingBooks.slice(startIndex, endIndex), 'user', userId, libraryId, folderId, folderName, libraryName);
            }
        }    
    } else if (type == 'both') {
        let rG = await createLibraries(userId, libraries.global, GLOBAL_LIBRARY_DATA_PATH);
        let okGlobal = rG.ok;
        let insertedGlobalLibraryIds = rG.l;
        let insertedGlobalFolderIds = rG.f;
        //console.log("ok", okGlobal, "insertedGlobalLibraryIds", insertedGlobalLibraryIds, "insertedGlobalFolderIds", insertedGlobalFolderIds);
        if (okGlobal) {

            let aIndex = 0;

            for (let i = 0; i < 5; i++) {
                let libraryId = insertedGlobalLibraryIds[i][0];
                let libraryName = insertedGlobalLibraryIds[i][2];
                let folderName = insertedGlobalLibraryIds[i][1];
                let folderId = insertedGlobalFolderIds[0];

                let startIndex = (i * 16) + aIndex;
                let endIndex = startIndex + 16;

                let okBooks, insertedBookIds = insertBooks(workingBooks.slice(startIndex, endIndex), 'global', userId, libraryId, folderId, folderName, libraryName);
            }
        }        
        // In 'both', also support demo variant
        let userLibs = libraries.user.map(lib => ({ ...lib }));
        if (options && options.variant === 'demo') {
            userLibs = userLibs.map((lib, idx) => ({
                ...lib,
                name: `Demo — ${lib.name}`,
                description: `${lib.description} (Demo user library)`
            }));
        }
        let r = await createLibraries(userId, userLibs, USER_LIBRARY_DATA_PATH);
        let okUser = r.ok;
        let insertedUserLibraryIds = r.l;
        let insertedUserFolderIds = r.f;
    if (okUser) {
            let aIndex = (options && typeof options.userOffset === 'number') ? options.userOffset : 80;

            for (let i = 0; i < 5; i++) {
                let libraryId = insertedUserLibraryIds[i][0];
                let libraryName = insertedUserLibraryIds[i][2];
                let folderName = insertedUserLibraryIds[i][1];
                let folderId = insertedUserFolderIds[0];


                let startIndex = (i * 16) + aIndex;
                let endIndex = startIndex + 16;

                let okBooks, insertedBookIds = insertBooks(workingBooks.slice(startIndex, endIndex), 'user', userId, libraryId, folderId, folderName, libraryName);
            }
        }       
        
    }
}

async function createLibraries(userId, librariesToInsert, dataPath) {

    // Pre-fetch missing library covers using Picsum, so the transaction remains synchronous
    try {
        const baseDir = '/opt/demo-data/library-images';
        if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
        for (let i = 0; i < librariesToInsert.length; i++) {
            const lib = librariesToInsert[i];
            const hasSource = lib.libraryCover && fs.existsSync(lib.libraryCover);
            if (!hasSource) {
                const slug = (lib.name || `library-${i}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                const tmpPath = path.join(baseDir, `${slug}.png`);
                const ok = await fetchStockCover(lib.name || slug, tmpPath);
                if (ok) {
                    lib.libraryCover = tmpPath;
                } else {
                    // will write placeholder later in the copy step
                    lib.libraryCover = tmpPath; // set target path anyway
                }
            }
        }
    } catch (e) {
        console.warn('[seed] prefetch covers failed:', e.message || e);
    }

    return new Promise((resolve, reject) => {


        function callback(ok, l, f) {
            console.log("ok", ok, "l", l, "f", f);
            resolve({ok: ok, l: l, f: f});
        }

        db.transaction((callback) => { 
            

            let insertedLibraryIds = [];
            let insertedFolderIds = [];

            for (let i = 0; i < librariesToInsert.length; i++) {
                let library = librariesToInsert[i];
                let name = library.name;
                let description = library.description;
                let folders = library.folders;
                let coverPath = library.libraryCover;

                
                console.log("folders", folders);

                let coverPathParts = coverPath.split('/');
                let coverFilename = coverPathParts[coverPathParts.length - 1];
                let coverExtension = coverFilename.split('.')[1];

                let p = `${coverFilename}.${coverExtension}`;

                let libraryPath = path.join(dataPath, name);
                let libraryCoverPath = path.join(dataPath, name, `cover.${coverExtension}`);

                // determine type by dataPath
                let libType = (dataPath === GLOBAL_LIBRARY_DATA_PATH) ? 'global' : 'user';

                // save the new library entry
                let sql = `INSERT INTO libraries (type, image_path, name, description, uuid, path) VALUES (?, ?, ?, ?, ?, ?);`;
                let results = db.prepare(sql).run(libType, libraryCoverPath, name, description, uuidv4(), `cover.${coverExtension}`);
                //console.log("results", results);
                //console.log("lastInsertedRowId", results.lastInsertRowid, [results.lastInsertRowid, folders[0], name]);
                insertedLibraryIds.push([results.lastInsertRowid, folders[0], name]);
                let lastInsertedRowId = results.lastInsertRowid;

                // TODO: (SQL) usin insertMany
                // save every folder for the library we just saved
                // Note: path is now empty string as subfolder structure is obsolete legacy behavior
                folders.forEach(folder => {
                    sql = `INSERT INTO libraries_folders (library_id, path, base_path) VALUES (?, ?, ?);`;
                    let results = db.prepare(sql).run(lastInsertedRowId, '', dataPath);
                    insertedFolderIds.push(results.lastInsertRowid);
                });

                // associate library to the user (and later to others)
                let exists = db.prepare('SELECT id FROM libraries_users WHERE library_id = ? AND user_id = ?').get(lastInsertedRowId, userId);
                if (!exists) {
                    db.prepare('INSERT INTO libraries_users (library_id, user_id, see_enabled, add_enabled, delete_enabled) VALUES (?, ?, ?, ?, ?)')
                      .run(lastInsertedRowId, userId, 1, 1, 0);
                }
            };

            try {
                //console.log("insertedLibraryIds", insertedLibraryIds, "insertedFolderIds", insertedFolderIds);
                librariesToInsert.forEach((library, idx) => {
        
                    let insertedLibraryId = insertedLibraryIds[idx][0];
        
                    let folders = library.folders;
                    let coverPath = library.libraryCover;
        
                    let coverPathParts = coverPath.split('/');
                    let coverFilename = coverPathParts[coverPathParts.length - 1];
                    let coverExtension = coverFilename.split('.')[1];
        
                    let libraryPath = path.join("/opt/data/meta/libraries", insertedLibraryId.toString());
                    let libraryCoverPath = path.join(libraryPath, `cover.${coverExtension}`);
        
                    // create the path if it does not exist
                    if (!fs.existsSync(libraryPath)) {
                        fs.mkdirSync(libraryPath, { recursive: true });
                    }
                    // copy the cover image to the library path; if missing, try fetching a stock photo by library name; fallback to placeholder
                    try {
                        if (fs.existsSync(coverPath)) {
                            fs.copyFileSync(coverPath, libraryCoverPath);
                        } else {
                            console.warn(`[seed] missing library cover: ${coverPath}. Writing placeholder.`);
                            fs.writeFileSync(libraryCoverPath, Buffer.from(LIB_PLACEHOLDER_PNG_BASE64, 'base64'));
                        }
                    } catch (e) {
                        console.warn(`[seed] failed to copy or fetch library cover: ${coverPath} -> ${libraryCoverPath}: ${e.message}. Writing placeholder.`);
                        fs.writeFileSync(libraryCoverPath, Buffer.from(LIB_PLACEHOLDER_PNG_BASE64, 'base64'));
                    }
                });
        
                callback(true, insertedLibraryIds, insertedFolderIds);
        
            } catch (error) {
                console.error(error);
                // Do not fail the whole operation due to a cover copy issue; we inserted libraries/folders above.
                callback(true, insertedLibraryIds, insertedFolderIds);
            }    

        })(callback);

    });

}

function insertBooks(books, libraryType, userId, libraryId, folderId, folderName, libraryName) {
    try {
        //console.log(libraryType, userId, libraryId, folderName, libraryName);

    // Prefer generated metadata if present
    let pubdateData;
    let publishersData;
    let summariesData;
    try { pubdateData = require('./generated/pubdates.json'); } catch { pubdateData = require('./pubdates.json'); }
    try { publishersData = require('./generated/publishers.json'); } catch { publishersData = require('./publishers.json'); }
    try { summariesData = require('./generated/summaries.json'); } catch { summariesData = require('./summaries.json'); }

        let usernameSql = `SELECT username FROM users WHERE id = ?;`;
        let username = db.prepare(usernameSql).get(userId).username;

        let dataPathBase = libraryType == 'global' ? GLOBAL_LIBRARY_DATA_PATH : USER_LIBRARY_DATA_PATH;
        const dataPath = (libraryType == 'user')
            ? path.join(dataPathBase, username, libraryName, folderName)
            : path.join(dataPathBase, libraryName, folderName);

        let bookIds = [];
        let savedCount = 0;
        let skipCount = 0;
        const transaction = db.transaction(() => {
            console.log("LIBRARY TYPE", libraryType);
            books.forEach(book => {
                //console.log("book 1", book);
                // Capture originals before mutation
                const originalBookRel = book.book_path || '';
                const originalCoverRel = book.cover_path || '';

                let fsPath = path.join('/opt/demo-data', originalBookRel);
                let fsCoverPath = path.join('/opt/demo-data', originalCoverRel);
                console.log("fsPath", fsPath, fsCoverPath);

                // Derive file name and use per-book folder (no legacy subfolders)
                let fileNameOnly = '';
                let formatFolder = 'book'; // default fallback
                if (originalBookRel && originalBookRel.includes('/')) {
                    const relParts = originalBookRel.split('/');
                    fileNameOnly = relParts.slice(-1)[0] || path.basename(originalBookRel);
                    // Extract the parent directory as the format folder (e.g., "pg12345" from "global/gutenberg/pg12345/book.epub")
                    if (relParts.length >= 2) {
                        formatFolder = relParts[relParts.length - 2];
                    }
                } else {
                    fileNameOnly = path.basename(originalBookRel || 'book.epub');
                }
                const filename = fileNameOnly.split('.')[0];
                const extension = fileNameOnly.split('.').pop();

                // Store only file name in books.path
                book.book_path = fileNameOnly;

                // New structure: each book lives under a folder named after the Gutenberg ID (e.g., pg12345)
                const destinationDir = path.join(dataPath, formatFolder);

                let bookInternalId = book.internal_id;
                book.description = summariesData[bookInternalId].summary + ' ' + summariesData[bookInternalId].summary_extended;

                let pubdate = pubdateData[bookInternalId];
                let publisher = publishersData[bookInternalId];
                book.published = pubdate;
                book.publisher = publisher;
                
                let coverPath = book.cover_path;
                // preserve the original extension of the source cover (png/jpg/etc)
                const coverExt = path.extname(coverPath) || '.png';
                // finalCoverPath is stored in DB relative to the per-book folder (e.g. "<bookname>/cover.png")
                let finalCoverPath = path.join(formatFolder, `cover${coverExt}`);
                book.cover_path = finalCoverPath;

                //console.log("book.authors", book.authors);
                if (typeof book.authors == 'string') {
                    book.authors = book.authors = JSON.parse(book.authors);
                }
                if (!Array.isArray(book.authors) || book.authors.length === 0) {
                    book.authors = ['Unknown'];
                }
                // Ensure language present
                book.language = book.language || book.language_name || 'Unknown';
                //console.log("book 2", book);
                // Pass file_path as file name (e.g., "book.epub") and format_path as folder (e.g., "pg123")
                let newBook = new Book(
                    book,
                    libraryId,
                    null, null, null, null,
                    null, null, null,
                    null,
                    finalCoverPath,
                    fileNameOnly,
                    path.dirname(finalCoverPath),
                    folderId
                );
                let ok = newBook.saveToDatabase();
                if (ok) {
                    bookIds.push(newBook.id);
                    savedCount++;
                    // Ensure destination directory exists (format folder)
                    if (!fs.existsSync(destinationDir)) {
                        fs.mkdirSync(destinationDir, { recursive: true });
                    }
                    // Copy book file into the format folder
                    const bookTarget = path.join(destinationDir, `${filename}.${extension}`);
                    if (!fs.existsSync(fsPath)) {
                        // Try alternative locations
                        const candidates = [
                            path.join('/opt/demo-data', 'global/gutenberg', formatFolder, fileNameOnly),
                            path.join('/opt/demo-data', formatFolder, fileNameOnly)
                        ];
                        fsPath = candidates.find(p => fs.existsSync(p)) || fsPath;
                    }
                    if (fs.existsSync(fsPath)) {
                        fs.copyFileSync(fsPath, bookTarget);
                        fs.unlinkSync(fsPath);
                    } else {
                        console.warn(`[seed] missing EPUB: ${fsPath}`);
                        skipCount++;
                        return; // skip copying cover too
                    }
                    // Move cover as cover.ext into the same folder
                    const coverTarget = path.join(destinationDir, `cover${coverExt}`);
                    if (fs.existsSync(fsCoverPath)) {
                        fs.copyFileSync(fsCoverPath, coverTarget);
                        fs.unlinkSync(fsCoverPath);
                    } else {
                        // Try alternative cover locations based on new folder
                        const coverCandidates = [
                            path.join('/opt/demo-data', 'global/gutenberg', formatFolder, `cover${coverExt}`),
                            path.join('/opt/demo-data', formatFolder, `cover${coverExt}`)
                        ];
                        const altCover = coverCandidates.find(p => fs.existsSync(p));
                        if (altCover) {
                            fs.copyFileSync(altCover, coverTarget);
                            fs.unlinkSync(altCover);
                        } else {
                            console.warn(`[seed] missing cover: ${fsCoverPath}`);
                        }
                    }
                }
            });
        });
        let ok = transaction();
        console.log(`[seed] inserted ${savedCount} books, skipped ${skipCount} (library=${libraryName} folder=${folderName} type=${libraryType})`);
        return ok, bookIds;
    } catch (error) {
        console.error(error);
        return false, null;
    }
}

module.exports = createDemoData;
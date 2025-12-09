const {db} = require('./database/database.js');

console.log("=== User Libraries Folders ===");
const folders = db.prepare(`
    SELECT lf.id, lf.library_id, lf.path, l.name as library_name, l.type 
    FROM libraries_folders lf 
    JOIN libraries l ON lf.library_id = l.id 
    WHERE l.type = 'user' 
    LIMIT 20
`).all();

console.log(folders);

console.log("\n=== All Libraries ===");
const libraries = db.prepare(`SELECT id, name, type FROM libraries WHERE type = 'user'`).all();
console.log(libraries);

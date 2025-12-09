const { DB_NAME, DB_PATH_ENV } = require('../utils/env.js');
const fs = require('fs');
const path = require('path');

function removeDatabaseFiles() {

    return new Promise((resolve, reject) => {
        try {
            let dbPath = path.join(DB_PATH_ENV, DB_NAME);
            console.log("Removing database files", dbPath);
            if (fs.existsSync(dbPath)) {
                fs.unlinkSync(dbPath);
            }
            let shmPath = dbPath + '-shm';
            if (fs.existsSync(shmPath)) {
                fs.unlinkSync(shmPath);
            }
            let walPath = dbPath + '-wal';
            if (fs.existsSync(walPath)) {
                fs.unlinkSync(walPath);
            }
        
            // Recreate the database file
            fs.closeSync(fs.openSync(dbPath, 'w'));
            resolve();
        } catch (error) {
            console.error("Error removing database files", error);
            reject(error);
        }
    });

}

module.exports = removeDatabaseFiles;
const { DB_PATH, NODE_ENV } = require('../utils/env')

const path = require('path');


let options = {};

if (NODE_ENV === 'development') {
    options = {
        verbose: console.log
    }
}

console.log("DB_PATH", DB_PATH)

const db = require('better-sqlite3')(DB_PATH, options);
db.pragma('journal_mode = WAL');

const SESSION_DB_PATH = path.join(__dirname, '..', 'sessions', 'sessions.sqlite3');
const sessionDb = require('better-sqlite3')(SESSION_DB_PATH, options);
sessionDb.pragma('journal_mode = WAL');

module.exports = {
    db,
    sessionDb
};
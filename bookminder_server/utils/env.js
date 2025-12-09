const path = require('path')
const fs = require('fs')

const NODE_ENV = process.env.NODE_ENV || 'development'

const DB_NAME = process.env.DB_NAME || 'db.sqlite3'
const DB_PATH_ENV = process.env.DB_PATH || './data/database'
const ASSETS_PATH_ENV = process.env.ASSETS_PATH || './data/assets'

const SESSION_DB_NAME = process.env.SESSION_DB_NAME || 'sessions.sqlite3'
const SESSION_DB_PATH = process.env.SESSION_DB_PATH || './data/database'
const SESSION_SECRET = process.env.SESSION_SECRET || 'your secret'
const SESSION_COOKIE_MAX_AGE = process.env.SESSION_COOKIE_MAX_AGE || 1000 * 60 * 60 * 24 * 7
const SESSION_COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE == 0 ? false : true

const TRUST_PROXY = process.env.TRUST_PROXY == "0" ? 0 : 1;

const GLOBAL_LIBRARY_DATA_PATH_ENV = process.env.GLOBAL_LIBRARY_DATA_PATH || ''
const USER_LIBRARY_DATA_PATH_ENV = process.env.USER_LIBRARY_DATA_PATH || ''
const META_LIBRARY_DATA_PATH_ENV = process.env.META_LIBRARY_DATA_PATH || ''

const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT || 3000
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? [...process.env.ALLOWED_ORIGINS.split(',')] : 'http://localhost:3000'

console.log("ALLOWED_ORIGINS", process.env.ALLOWED_ORIGINS)

// Handle DB_PATH - if it's absolute, use it directly; if relative, resolve from project root
const DB_PATH = path.isAbsolute(DB_PATH_ENV) 
    ? path.join(DB_PATH_ENV, DB_NAME)
    : path.join(__dirname, '..', DB_PATH_ENV, DB_NAME);

const GLOBAL_LIBRARY_DATA_PATH = path.join(GLOBAL_LIBRARY_DATA_PATH_ENV)
const USER_LIBRARY_DATA_PATH = path.join(USER_LIBRARY_DATA_PATH_ENV)
const META_LIBRARY_DATA_PATH = path.join(META_LIBRARY_DATA_PATH_ENV)

console.log("GLOBAL_LIBRARY_DATA_PATH", GLOBAL_LIBRARY_DATA_PATH)
console.log("USER_LIBRARY_DATA_PATH", USER_LIBRARY_DATA_PATH)
console.log("META_LIBRARY_DATA_PATH", META_LIBRARY_DATA_PATH)

if (!fs.existsSync(GLOBAL_LIBRARY_DATA_PATH)) {
    fs.mkdirSync(GLOBAL_LIBRARY_DATA_PATH, { recursive: true });
}

if (!fs.existsSync(USER_LIBRARY_DATA_PATH)) {
    fs.mkdirSync(USER_LIBRARY_DATA_PATH, { recursive: true });
}

const ASSETS_PATH = path.join(__dirname, '..', ASSETS_PATH_ENV)

const FRONTEND_BASE = process.env.FRONTEND_BASE || 'frontend'
const FRONTEND_MAIN_JS_PATH_ENV = process.env.FRONTEND_MAIN_JS_PATH_ENV || ''

const FRONTEND_MAIN_JS_PATH = path.join(__dirname, FRONTEND_MAIN_JS_PATH_ENV)

const ALLOWED_PLUGINS_JSON = process.env.ALLOWED_PLUGINS || '[]'
const ALLOWED_PLUGINS = JSON.parse(ALLOWED_PLUGINS_JSON)

console.log("DB_PATH IN ENV.JS", DB_PATH)

module.exports = {
    NODE_ENV,
    DB_NAME,
    HOST,
    PORT,
    ALLOWED_ORIGINS,

    DB_PATH,
    DB_PATH_ENV,
    ASSETS_PATH,

    SESSION_DB_NAME,
    SESSION_DB_PATH,
    SESSION_SECRET,
    SESSION_COOKIE_MAX_AGE,
    SESSION_COOKIE_SECURE,
    ALLOWED_PLUGINS,

    TRUST_PROXY,

    FRONTEND_MAIN_JS_PATH,

    GLOBAL_LIBRARY_DATA_PATH,
    USER_LIBRARY_DATA_PATH,
    META_LIBRARY_DATA_PATH,
}
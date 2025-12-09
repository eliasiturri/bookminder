require('./utils/env.js');

// Import required modules
const express = require('express');

// Create an instance of Express
const app = express();
const axios = require('axios');
var cors = require('cors');

var session = require('express-session');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var SQLiteStore = require('connect-sqlite3')(session);

const { HOST, PORT, ALLOWED_ORIGINS, SESSION_DB_NAME, SESSION_DB_PATH } = require('./utils/env.js');
const { SESSION_SECRET, SESSION_COOKIE_MAX_AGE, SESSION_COOKIE_SECURE } = require('./utils/env.js');
const { TRUST_PROXY, ASSETS_PATH, GLOBAL_LIBRARY_DATA_PATH, USER_LIBRARY_DATA_PATH, META_LIBRARY_DATA_PATH, FRONTEND_BASE, ALLOWED_PLUGINS } = require('./utils/env.js');


var authRouter = require('./routes/auth');
var pluginsRouter = require('./routes/plugins');
var dockerPluginsRouter = require('./routes/docker-plugins');
var searchRouter = require('./routes/search');
var goodreadsRouter = require('./routes/goodreads');
var librariesRouter = require('./routes/libraries');
var usersRouter = require('./routes/users');
var usersVerifyTokenRouter = require('./routes/usersVerifyToken');
var rolesRouter = require('./routes/roles');
var filesRouter = require('./routes/files');

const fs = require('fs');
const path = require('path');
const {db} = require('./database/database.js');
const { initDatabaseIfNeeded } = require('./utils/initDatabase.js');

// Middleware for the routes
const { requiresAuth } = require('./middleware/middleware.js');

// Jobs running at an interval
const { startIntervalJobs } = require('./utils/intervalJobs.js');

const corsOptions = {
    origin: ALLOWED_ORIGINS,
    optionsSuccessStatus: 200,
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
};
app.use(cors(corsOptions));

console.log("SESSION_COOKIE_SECURE", SESSION_COOKIE_SECURE);

const sessionMiddleware = session({
    proxy: true,
    store: new SQLiteStore(
        {
            dir: SESSION_DB_PATH,
            db: SESSION_DB_NAME,
            table: 'sessions',
            concurrentDB: true,
        }

    ),
    secret: SESSION_SECRET,
    cookie: { 
        maxAge: SESSION_COOKIE_MAX_AGE,
        secure: SESSION_COOKIE_SECURE,
      },
    resave: false,
    saveUninitialized: false
});
app.use(sessionMiddleware);




app.set('trust proxy', TRUST_PROXY); 
app.use(cookieParser());
//app.use(bodyParser.json({ limit: '500mb' }));

app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with 10mb limit for avatars
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true })) // Parse URL-encoded bodies (as sent by HTML forms)

// log every request to the console
app.use((req, res, next) => {
    console.log(req.method, req.url);
    console.log("ROLE ACTIONS", req.session.role_actions);
    next();
});

// Routes
app.use('/auth', sessionMiddleware, authRouter);
app.use('/plugins', sessionMiddleware, pluginsRouter);
// app.use('/search', sessionMiddleware, requiresAuth, searchRouter); // TODO: refactor to use new plugin system
app.use('/goodreads', sessionMiddleware, requiresAuth, goodreadsRouter);
app.use('/libraries', sessionMiddleware, requiresAuth, librariesRouter);
app.use('/token', sessionMiddleware, usersVerifyTokenRouter);
app.use('/users', sessionMiddleware, requiresAuth, usersRouter);
app.use('/roles', sessionMiddleware, requiresAuth, rolesRouter);
app.use('/files', sessionMiddleware, requiresAuth, filesRouter);


console.log("META_LIBRARY_DATA_PATH", META_LIBRARY_DATA_PATH);

// Serve static files with CORS headers to prevent ERR_BLOCKED_BY_ORB
const setCorsHeaders = (req, res, next) => {
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
};

app.use('/assets/global', setCorsHeaders, express.static(GLOBAL_LIBRARY_DATA_PATH));
app.use('/assets/user', setCorsHeaders, express.static(USER_LIBRARY_DATA_PATH));
app.use('/assets/meta', setCorsHeaders, express.static(META_LIBRARY_DATA_PATH));
app.use('/assets', setCorsHeaders, express.static(ASSETS_PATH));



async function doAll() {
    //const removeDatabaseFiles = require('./utils/removeDatabase.js');
    //const createUser = require('./utils/users.js');
    //const createDemoData = require('./demo/createDemoData.js');
    //await removeDatabaseFiles();
    
    //const { createTables } = require('./database/tableCreation.js')
    //createTables();
    //await createUser("user", "user");
    //await createDemoData('both', 1);

    const { createRolesAndActions } = require('./database/roleAndActionsCreation.js');
    createRolesAndActions(1, 'Owner');
}

//doAll();



// log to the console any route that is requested
app.use((req, res, next) => {
    console.log(req.url);
    next();
});


// Serve the frontend files
let indexFile = path.join("/home/user/www/bookminder.io/vite/", 'index.html');

// Define a route
app.get('/', (req, res) => {
    if (fs.existsSync(indexFile)) {
        res.sendFile(path.join("/home/user/www/bookminder.io/vite/", 'index.html'));
    } else {
        res.send('Error finding the latests frontend directory!');
    }
    
});


// TODO:  http://localhost:81/files/upload  CATCH ERROR 413 ENTITIY TOO LARGE

// Initialize database on first run
initDatabaseIfNeeded().then(() => {
    startIntervalJobs();

    // Set the server to listen on the defined PORT and HOST
    app.listen(PORT, HOST, () => {
        console.log(`Server running on ${HOST}:${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});


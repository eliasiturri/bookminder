const {db} = require('../database/database.js');
const { createTables } = require('../database/tableCreation.js');
const { createRolesAndActions } = require('../database/roleAndActionsCreation.js');
const createUser = require('./users.js');
const createDemoData = require('../demo/createDemoData.js');
const fs = require('fs');
const path = require('path');

/**
 * Initialize the database if it's empty (first run)
 * Creates tables, default admin user, roles, and actions
 * Optionally creates demo data
 */
async function initDatabaseIfNeeded() {
    try {
        const resetDb = process.env.RESET_DB === 'true';
        const createDemo = process.env.CREATE_DEMO_DATA === 'true';
        
        // If RESET_DB is true, delete the database file and data directories
        if (resetDb) {
            console.log('============================================');
            console.log('RESET_DB=true: Deleting existing database and data directories...');
            console.log('============================================');
            
            const dbPath = process.env.DB_PATH || './';
            const dbName = process.env.DB_NAME || 'db.sqlite3';
            const fullDbPath = path.isAbsolute(dbPath) 
                ? path.join(dbPath, dbName)
                : path.join(__dirname, '..', dbPath, dbName);
            
            console.log(`Attempting to delete: ${fullDbPath}`);
            
            // Close the database connection first
            try {
                db.close();
            } catch (e) {
                console.log('Database already closed or not open');
            }
            
            if (fs.existsSync(fullDbPath)) {
                fs.unlinkSync(fullDbPath);
                console.log(`Deleted: ${fullDbPath}`);
            } else {
                console.log(`File does not exist: ${fullDbPath}`);
            }
            
            // Also delete WAL and SHM files if they exist
            const walPath = `${fullDbPath}-wal`;
            const shmPath = `${fullDbPath}-shm`;
            if (fs.existsSync(walPath)) {
                fs.unlinkSync(walPath);
                console.log(`Deleted: ${walPath}`);
            }
            if (fs.existsSync(shmPath)) {
                fs.unlinkSync(shmPath);
                console.log(`Deleted: ${shmPath}`);
            }

            // Delete data directories (global, user, meta)
            const globalPath = process.env.GLOBAL_LIBRARY_DATA_PATH;
            const userPath = process.env.USER_LIBRARY_DATA_PATH;
            const metaPath = process.env.META_LIBRARY_DATA_PATH;
            const sessionPath = process.env.SESSION_DB_PATH;

            const pathsToClean = [
                { path: globalPath, name: 'Global library data' },
                { path: userPath, name: 'User library data' },
                { path: metaPath, name: 'Meta library data' },
                { path: sessionPath, name: 'Session data' }
            ];

            pathsToClean.forEach(({ path: dirPath, name }) => {
                if (dirPath && fs.existsSync(dirPath)) {
                    try {
                        fs.rmSync(dirPath, { recursive: true, force: true });
                        console.log(`Deleted: ${name} (${dirPath})`);
                        // Recreate empty directory
                        fs.mkdirSync(dirPath, { recursive: true });
                        console.log(`Recreated: ${name} (${dirPath})`);
                    } catch (err) {
                        console.warn(`Failed to delete ${name} (${dirPath}):`, err.message);
                    }
                }
            });

            // Delete demo assets and generated files
            const demoAssetsPath = path.join(__dirname, '..', 'demo', 'assets');
            const demoGeneratedPath = path.join(__dirname, '..', 'demo', 'generated');

            if (fs.existsSync(demoAssetsPath)) {
                try {
                    fs.rmSync(demoAssetsPath, { recursive: true, force: true });
                    fs.mkdirSync(demoAssetsPath, { recursive: true });
                    console.log(`Deleted and recreated: demo/assets`);
                } catch (err) {
                    console.warn(`Failed to delete demo/assets:`, err.message);
                }
            }

            if (fs.existsSync(demoGeneratedPath)) {
                try {
                    fs.rmSync(demoGeneratedPath, { recursive: true, force: true });
                    fs.mkdirSync(demoGeneratedPath, { recursive: true });
                    console.log(`Deleted and recreated: demo/generated`);
                } catch (err) {
                    console.warn(`Failed to delete demo/generated:`, err.message);
                }
            }
            
            console.log('============================================');
            console.log('Database and data directories deleted. Exiting...');
            console.log('IMPORTANT: Set RESET_DB=false in .env to prevent deletion on next restart!');
            console.log('Nodemon will automatically restart the server.');
            console.log('============================================\n');
            
            process.exit(0);
        }
        
        // Check if users table exists and has data
        let tableExists = false;
        let hasUsers = false;

        try {
            const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
            tableExists = true;
            hasUsers = result.count > 0;
        } catch (error) {
            // Table doesn't exist
            tableExists = false;
        }

    if (!tableExists || !hasUsers) {
            console.log('============================================');
            console.log('INITIALIZING DATABASE (First Run)');
            console.log('============================================');

            // Create tables
            console.log('Creating database tables...');
            createTables();
            
            // Get admin credentials from environment or use defaults
            const adminUsername = process.env.ADMIN_USERNAME || 'admin';
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
            
            console.log(`Creating admin user: ${adminUsername}`);
            await createUser(adminUsername, adminPassword);
            
            // Get the created admin user's ID
            const user = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
            const userId = user.id;

            // Ensure demo user exists
            const demoUsername = process.env.DEMO_USERNAME || 'demo';
            const demoPassword = process.env.DEMO_PASSWORD || 'demo';
            const demoExisting = db.prepare('SELECT id FROM users WHERE username = ?').get(demoUsername);
            let demoUserId;
            if (!demoExisting) {
                console.log(`Creating demo user: ${demoUsername}`);
                await createUser(demoUsername, demoPassword);
                demoUserId = db.prepare('SELECT id FROM users WHERE username = ?').get(demoUsername).id;
            } else {
                demoUserId = demoExisting.id;
                console.log(`Demo user already exists: ${demoUsername} (id=${demoUserId})`);
            }

            // Assign roles: admin -> Owner already assigned in createRolesAndActions; demo -> User
            try {
                const userRoleIdRow = db.prepare("SELECT id FROM roles WHERE name = 'User'").get();
                if (userRoleIdRow) {
                    const hasRole = db.prepare('SELECT id FROM users_roles WHERE user_id = ? AND role_id = ?').get(demoUserId, userRoleIdRow.id);
                    if (!hasRole) {
                        db.prepare('INSERT INTO users_roles (user_id, role_id, is_default) VALUES (?, ?, 1)').run(demoUserId, userRoleIdRow.id);
                        console.log(`Assigned 'User' role to ${demoUsername}`);
                    }
                }
            } catch (e) {
                console.log('Could not ensure role for demo user:', e.message || e);
            }
            // Ensure demo user has explicit permission to edit user libraries (so admin menu item appears)
            try {
                const actionRow = db.prepare("SELECT id FROM actions WHERE name = 'can edit user libraries'").get();
                if (actionRow) {
                    const ua = db.prepare('SELECT id FROM users_actions WHERE user_id = ? AND action_id = ?').get(demoUserId, actionRow.id);
                    if (!ua) {
                        db.prepare('INSERT INTO users_actions (user_id, action_id, enabled) VALUES (?, ?, 1)').run(demoUserId, actionRow.id);
                        console.log(`Granted demo user explicit action: can edit user libraries`);
                    }
                }
            } catch (e) {
                console.log('Failed to grant demo user actions:', e.message || e);
            }
            
            // Create roles and actions, assign Owner role to admin
            console.log('Creating roles and actions...');
            console.log('Assigning "Owner" role to admin user...');
            createRolesAndActions(userId, 'Owner');
            
            // Create demo data if requested and none exists
            if (createDemo) {
                try {
                    const libCountRow = db.prepare('SELECT COUNT(*) as count FROM libraries').get();
                    const libCount = libCountRow ? libCountRow.count : 0;
                    if (libCount === 0) {
                        console.log('Creating demo data (libraries and books)...');
                        // Create global libraries once
                        await createDemoData('global', userId);
                        // Create user libraries for admin and demo with different slices
                        await createDemoData('user', userId, { userOffset: 80 });
                        await createDemoData('user', demoUserId, { userOffset: 0, variant: 'demo' });
                        console.log('Demo data created successfully for admin and demo users!');

                        // Ensure global libraries are associated with demo user as well (limit to a subset: first 3 visible)
                        try {
                            const globalLibs = db.prepare("SELECT id FROM libraries WHERE type = 'global' ORDER BY id ASC").all();
                            globalLibs.forEach((gl, idx) => {
                                const exists = db.prepare('SELECT id FROM libraries_users WHERE library_id = ? AND user_id = ?').get(gl.id, demoUserId);
                                const see = idx < 3 ? 1 : 0;
                                if (!exists) {
                                    db.prepare('INSERT INTO libraries_users (library_id, user_id, see_enabled, add_enabled, delete_enabled) VALUES (?, ?, ?, 1, 0)')
                                      .run(gl.id, demoUserId, see);
                                } else {
                                    db.prepare('UPDATE libraries_users SET see_enabled = ? WHERE library_id = ? AND user_id = ?').run(see, gl.id, demoUserId);
                                }
                            });
                        } catch (e) {
                            console.log('Failed to associate global libraries with demo user:', e.message || e);
                        }
                    } else {
                        console.log(`Demo data skipped: libraries already present (count=${libCount}).`);
                    }
                } catch (e) {
                    console.log('Could not determine libraries count, attempting to create demo data anyway...');
                    try {
                        await createDemoData('global', userId);
                        await createDemoData('user', userId, { userOffset: 80 });
                        await createDemoData('user', demoUserId, { userOffset: 0 });
                        console.log('Demo data created successfully for admin and demo users!');
                    } catch (inner) {
                        console.error('Failed to create demo data:', inner);
                    }
                }
            }
            
            console.log('============================================');
            console.log('DATABASE INITIALIZATION COMPLETE');
            console.log(`Admin credentials: ${adminUsername} / ${adminPassword}`);
            console.log(`Demo credentials: ${demoUsername} / ${demoPassword}`);
            console.log(`Admin role: Owner`);
            console.log(`Demo data: ${createDemo ? 'Yes' : 'No'}`);
            console.log('============================================');
            
            return true;
        } else {
            console.log('Database already initialized, skipping initialization.');

            // Ensure demo user exists and has role; optionally seed demo/user libraries
            if (createDemo) {
                try {
                    // ensure demo user exists
                    const demoUsername = process.env.DEMO_USERNAME || 'demo';
                    const demoPassword = process.env.DEMO_PASSWORD || 'demo';
                    let demo = db.prepare('SELECT id FROM users WHERE username = ?').get(demoUsername);
                    if (!demo) {
                        console.log(`Creating demo user: ${demoUsername}`);
                        await createUser(demoUsername, demoPassword);
                        demo = db.prepare('SELECT id FROM users WHERE username = ?').get(demoUsername);
                    }
                    // ensure role mapping
                    try {
                        const userRoleIdRow = db.prepare("SELECT id FROM roles WHERE name = 'User'").get();
                        if (userRoleIdRow) {
                            const hasRole = db.prepare('SELECT id FROM users_roles WHERE user_id = ? AND role_id = ?').get(demo.id, userRoleIdRow.id);
                            if (!hasRole) db.prepare('INSERT INTO users_roles (user_id, role_id, is_default) VALUES (?, ?, 1)').run(demo.id, userRoleIdRow.id);
                        }
                    } catch {}

                    const libCountRow = db.prepare('SELECT COUNT(*) as count FROM libraries').get();
                    const libCount = libCountRow ? libCountRow.count : 0;
                    if (libCount === 0) {
                        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
                        let admin = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername) || db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get();
                        const adminId = admin ? admin.id : 1;
                        console.log('No libraries found and CREATE_DEMO_DATA=true. Creating demo data now...');
                        await createDemoData('global', adminId);
                        await createDemoData('user', adminId, { userOffset: 80 });
                        await createDemoData('user', demo.id, { userOffset: 0, variant: 'demo' });
                        console.log('Demo data created successfully for admin and demo users!');
                    } else {
                        console.log(`Demo data skipped: libraries already present (count=${libCount}).`);
                        // Ensure global libraries associated with demo user
                        try {
                            const globalLibs = db.prepare("SELECT id FROM libraries WHERE type = 'global' ORDER BY id ASC").all();
                            globalLibs.forEach((gl, idx) => {
                                const exists = db.prepare('SELECT id FROM libraries_users WHERE library_id = ? AND user_id = ?').get(gl.id, demo.id);
                                const see = idx < 3 ? 1 : 0;
                                if (!exists) {
                                    db.prepare('INSERT INTO libraries_users (library_id, user_id, see_enabled, add_enabled, delete_enabled) VALUES (?, ?, ?, 1, 0)').run(gl.id, demo.id, see);
                                } else {
                                    db.prepare('UPDATE libraries_users SET see_enabled = ? WHERE library_id = ? AND user_id = ?').run(see, gl.id, demo.id);
                                }
                            });
                        } catch {}
                        // If demo user's data folder is missing, seed user libraries for demo now
                        try {
                            const userBase = process.env.USER_LIBRARY_DATA_PATH || '/opt/data/user';
                            const demoUserDir = path.join(userBase, demoUsername);
                            if (!fs.existsSync(demoUserDir)) {
                                console.log('Demo user library data not found on disk. Creating demo user libraries now...');
                                await createDemoData('user', demo.id, { userOffset: 0, variant: 'demo' });
                                console.log('Demo user libraries created successfully!');
                            }
                        } catch (e) {
                            console.log('Failed to ensure demo user libraries:', e.message || e);
                        }
                    }
                } catch (e) {
                    console.error('Demo data creation check failed:', e.message || e);
                }
            } else {
                console.log('CREATE_DEMO_DATA=false. Demo seeding is disabled.');
            }

            return false;
        }
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

module.exports = { initDatabaseIfNeeded };

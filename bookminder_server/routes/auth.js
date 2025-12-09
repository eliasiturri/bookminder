const express = require('express');
const router = express.Router();
const {db} = require('../database/database.js');

const { requiresAuth } = require('../middleware/middleware.js');

const bcrypt = require('bcrypt');

// TODO: (HTTP) remove in production
// test route that allows us to generate a hash for a plaintext password
router.get('/generate', async function(req, res, next) {
    const saltRounds = 10;
    const plainTextPassword = "password";

    try {
        bcrypt.hash(plainTextPassword, saltRounds, function(err, hash) {
            console.log(`Has for password "${plainTextPassword}": ${hash}`);
            res.send(hash);
        });
    } catch (err) {
        console.log(err);
        res.send(err);
    }
});

// login route
router.post('/login', async function(req, res, next) {

    let username = req.body.username;
    let password = req.body.password;

    if (!username || !password) {
        res.status(401).json({
            message: 'Invalid username or password'
        });
        return;
    }

    try {

            let sql = `
                SELECT 
                    users.id, 
                    users.uuid, 
                    users.password,
                    json_group_object(
                        actions.name, 
                        IIF(users_actions.enabled IS 1, 1, IIF(users_actions.enabled IS 0, 0, COALESCE(roles_actions.enabled, 0)))
                    ) AS actions,
                    json_group_array(DISTINCT roles.name) AS roles
                FROM users 
                LEFT JOIN users_roles ON users_roles.user_id = users.id
                LEFT JOIN roles ON roles.id = users_roles.role_id 
                CROSS JOIN actions
                LEFT JOIN roles_actions 
                    ON roles.id = roles_actions.role_id 
                    AND actions.id = roles_actions.action_id
                LEFT JOIN users_actions ON users_actions.user_id = users.id AND users_actions.action_id = actions.id
                WHERE username = ? AND can_login IS NOT 0
                GROUP BY users.id
            ;`;
            let result = await db.prepare(sql).get(username);
            console.log(result);

            if (result) {
                let hash = result.password;

                let match = await new Promise((resolve, reject) => {
                    bcrypt.compare(password, hash, function(err, result) {
                        if (err) {
                            console.log(err);
                            reject(false);
                        } else {
                            resolve(result);
                        }
                    });
                });

                console.log(match);

                if (match) {
                        console.log("we have a match");

                        try {
                            let insertOrUpdateLastLogin = `
                                INSERT INTO last_logins (user_id, timestamp) VALUES (?, ?)
                                ON CONFLICT(user_id) DO UPDATE SET timestamp = ?;
                            `;

                            let checkEntryExists = `SELECT * FROM last_logins WHERE user_id = ?;`;
                            let insertLastLogin = `INSERT INTO last_logins (user_id, timestamp) VALUES (?, ?);`;
                            let updateLastLogin = `UPDATE last_logins SET timestamp = ? WHERE user_id = ?;`;
                            let userId = parseInt(result.id);
                            let entryExists = await db.prepare(checkEntryExists).get(userId);
                            let timestamp = Date.now();
                            if (entryExists) {
                                db.prepare(updateLastLogin).run(timestamp, userId);
                            } else {
                                db.prepare(insertLastLogin).run(userId, timestamp);
                            }

                        } catch (err) {
                            console.log(err);
                        }

                        result.actions = JSON.parse(result.actions);
                        result.roles = JSON.parse(result.roles);                        
                        // save the session info
                        console.log('Setting session userId:', result.id);
                        req.session.userId = result.id;
                        req.session.username = username;
                        req.session.role_actions = result.actions;
                        console.log('Session before save:', req.session);
                        req.session.save((err) => {
                            if (err) {
                                console.error('Error saving session:', err);
                            } else {
                                console.log('Session saved successfully');
                                console.log('Session after save:', req.session);
                            }
                        });

                        // Dev helper cookie so the frontend can detect session; do not use secure in local http
                        const isDev = process.env.NODE_ENV === 'development';
                        res.cookie('token', username, { sameSite: isDev ? 'lax' : 'none', secure: !isDev });

                        res.json({ role_actions: result.actions, roles: result.roles });
                    } else {
                        res.status(401).json({
                            message: 'Invalid username or password'
                        });
                        return;
                    }
            } else {
                // User not found
                res.status(401).json({
                    message: 'Invalid username or password'
                });
                return;
            }
    } catch (err) {
        console.log(err);
        res.json({
            message: 'Error logging in: ' + err
        });
    }    
});

// reload user roles
router.post('/reload-roles', requiresAuth, async function(req, res, next) {

    try {
            const userId = req.session.userId;

            let sql = `
                SELECT 
                    users.id, 
                    users.uuid, 
                    json_group_object(
                        actions.name, 
                        IIF(users_actions.enabled IS 1, 1, IIF(users_actions.enabled IS 0, 0, COALESCE(roles_actions.enabled, 0)))
                    ) AS actions,
                    json_group_array(DISTINCT roles.name) AS roles
                FROM users 
                LEFT JOIN users_roles ON users_roles.user_id = users.id
                LEFT JOIN roles ON roles.id = users_roles.role_id 
                CROSS JOIN actions
                LEFT JOIN roles_actions 
                    ON roles.id = roles_actions.role_id 
                    AND actions.id = roles_actions.action_id
                LEFT JOIN users_actions ON users_actions.user_id = users.id AND users_actions.action_id = actions.id
                WHERE users.id = ? AND can_login IS NOT 0
                GROUP BY users.id
            ;`;
            let result = await db.prepare(sql).get(userId);
            console.log(result);

            if (result) {
                res.json({ role_actions: result.actions, roles: result.roles });
                return;
            } else {
                res.json({
                    message: 'Error reloading roles'
                });
                return;
            }
    } catch (err) {
        console.log(err);
        res.json({
            message: 'Error logging in: ' + err
        });
    }    
});

// logout route
router.get('/logout/', async function(req, res, next) {
    req.session.destroy();
    res.json('/');
});

// change password route
router.post('/change-password', requiresAuth, async function(req, res, next) {
    const { password } = req.body;
    const userId = req.session.userId;

    if (!password || password.trim().length === 0) {
        res.status(400).json({ error: 'Password cannot be empty' });
        return;
    }

    try {
        const saltRounds = 10;
        const hash = await new Promise((resolve, reject) => {
            bcrypt.hash(password, saltRounds, function(err, hash) {
                if (err) {
                    reject(err);
                } else {
                    resolve(hash);
                }
            });
        });

        let updatePasswordSql = `UPDATE users SET password = ? WHERE id = ?`;
        db.prepare(updatePasswordSql).run(hash, userId);

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.log("Error changing password:", err);
        res.status(500).json({ error: 'Error changing password' });
    }
});

// upload avatar route
router.post('/upload-avatar', requiresAuth, async function(req, res, next) {
    const { avatarBase64 } = req.body;
    const userId = req.session.userId;

    if (!avatarBase64) {
        res.status(400).json({ error: 'No avatar data provided' });
        return;
    }

    try {
        // Add avatar column if it doesn't exist
        try {
            let addColumnSql = `ALTER TABLE users ADD COLUMN avatar TEXT`;
            db.prepare(addColumnSql).run();
        } catch (err) {
            // Column might already exist, ignore error
        }

        let updateAvatarSql = `UPDATE users SET avatar = ? WHERE id = ?`;
        db.prepare(updateAvatarSql).run(avatarBase64, userId);

        res.json({ message: 'Avatar updated successfully', avatar: avatarBase64 });
    } catch (err) {
        console.log("Error uploading avatar:", err);
        res.status(500).json({ error: 'Error uploading avatar' });
    }
});

// get user avatar route
router.get('/avatar', requiresAuth, async function(req, res, next) {
    const userId = req.session.userId;

    try {
        let getAvatarSql = `SELECT avatar FROM users WHERE id = ?`;
        let result = db.prepare(getAvatarSql).get(userId);

        if (result && result.avatar) {
            res.json({ avatar: result.avatar });
        } else {
            res.json({ avatar: null });
        }
    } catch (err) {
        console.log("Error getting avatar:", err);
        res.status(500).json({ error: 'Error getting avatar' });
    }
});

module.exports = router;
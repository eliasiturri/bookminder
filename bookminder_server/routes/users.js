const express = require('express');
const router = express.Router();
const { db, sessionDb } = require('../database/database.js');

const { v4: uuidv4 } = require('uuid');
const { generateRandomString } = require('../utils/random.js');

const bcrypt = require('bcrypt');

const { roleActionGuard } = require('../middleware/middleware.js');

// returns all users
router.get('/', roleActionGuard('can edit users'), async (req, res) => {

    try {
        let sql = `
            SELECT u.username, u.email, u.uuid, MAX(ll.timestamp) AS last_login,
            r.name as role
            FROM users u
            LEFT JOIN users_roles ur ON ur.user_id = u.id 
            LEFT JOIN roles r ON r.id = ur.role_id 
            LEFT JOIN last_logins ll ON u.id = ll.user_id 
            GROUP BY u.id
        `;
        
        let result = db.prepare(sql).all();
        res.json(result);
        
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }

});

// creates a new user given a username and email
router.post('/', roleActionGuard('can edit users'), async (req, res) => {

    // TODO ALL PARAMETER EXTRACTION ELSEWHERE SHOULD BE MOVED TO INSIDE THE TRY BLOCK

    try {
        // gets the parameters from the POST request body
        const { username } = req.body;

        if (!username.trim()) {
            res.status(400).send({ error: 'Missing username or email' });
            return;
        }

        // check if the username is already taken
        let sqlUserId = `SELECT id FROM users WHERE username = ?;`;
        let existingUser = db.prepare(sqlUserId).all(username);

        if (existingUser.length > 0) {
            let message = 'Username is already taken. ';
            res.status(400).send({ error: message});
            return;
        }

        // can_login is set to 0 until the user creates a password
        let insertUserSql = `INSERT INTO users (username, uuid, can_login) VALUES (?, ?, 0);`;
        let uuid = uuidv4();
        db.prepare(insertUserSql).run(username, uuid);

        res.json({ message: 'User created' });

    } catch (err) {
        console.log("Error:", err);
        res.json({ status: 500, error: err });
    }
});




// creates an access token
router.post('/access-url', roleActionGuard('can edit users'), async (req, res) => {

    const { username } = req.body;

    if (!username) {
        res.json({ error: 'Missing username' });
    }

    try {
        let sql = `SELECT id FROM users WHERE username = ?;`;
        let userId = db.prepare(sql).get(username).id;
    
        if (!userId) {
            res.json({ error: 'User not found' });
        }
    
        let token = generateRandomString(128);
    
        let sqlDelete = `DELETE FROM access_urls WHERE user_id = ?`;
        let sqlInsert = `INSERT INTO access_urls (user_id, token, timestamp) VALUES (?, ?, ?);`;
        let sqlUpdate = `UPDATE users SET can_login = 0 WHERE id = ?`;

        let sqlDefaultRole = `SELECT id FROM roles WHERE is_default = 1;`;
        let defaultRole = db.prepare(sqlDefaultRole).get();

        let sqlCheckUserRole = `SELECT * FROM users_roles WHERE user_id = ?;`;
        let userRole = db.prepare(sqlCheckUserRole).get(userId);

        if (!userRole) {
            let sqlInsertUserRole = `INSERT INTO users_roles (user_id, role_id) VALUES (?, ?);`;
            db.prepare(sqlInsertUserRole).run(userId, defaultRole.id);
        } else {
            let sqlUpdateUserRole = `UPDATE users_roles SET role_id = ? WHERE user_id = ?;`;
            db.prepare(sqlUpdateUserRole).run(defaultRole.id, userId);
        }
    
        // atomic transaction
        const transaction = db.transaction( () => {
                const deletes = db.prepare(sqlDelete).run(userId);
                const inserts = db.prepare(sqlInsert).run(userId, token, Date.now());
                const updates = db.prepare(sqlUpdate).run(userId);
            }            
        );
        transaction();

        // TODO: (ENV) use an env variable to set the domain name and path
        let url = `https://demo.bookminder.io/frontend/access-token?token=${token}`;

        res.json({ url: url });        
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }



});


router.post('/reload-session', roleActionGuard('can edit users'), async (req, res) => {
    const { username } = req.body;

    if (!username) {
        res.json({ error: 'Missing username' });
    }

    try {
        let sql = `SELECT sid, sess FROM sessions WHERE sess LIKE '%"username":"' || ? || '"%'`;
        let result = sessionDb.prepare(sql).all(username);

        let roleActionsResultSql = `
                SELECT 
                    users.id, 
                    users.uuid, 
                    json_group_object(
                        actions.name, 
                        COALESCE(roles_actions.enabled, 0)
                    ) AS actions,
                    json_group_array(DISTINCT roles.name) AS roles
                FROM users 
                LEFT JOIN users_roles ON users_roles.user_id = users.id
                LEFT JOIN roles ON roles.id = users_roles.role_id 
                CROSS JOIN actions
                LEFT JOIN roles_actions 
                    ON roles.id = roles_actions.role_id 
                    AND actions.id = roles_actions.action_id
                WHERE username = ? AND can_login IS NOT 0
                GROUP BY users.id
            ;`;
        
        let roleActionsResult = db.prepare(roleActionsResultSql).get(username);
        

        if (roleActionsResult) {
            let parsedRoleActions = JSON.parse(roleActionsResult.actions);
            for (let i = 0; i < result.length; i++) {
                let sid = result[i].sid;
                let sess = result[i].sess;

                let parsedSession = JSON.parse(sess);
                parsedSession.role_actions = parsedRoleActions;

                let jsonSesssion = JSON.stringify(parsedSession);
                // remove any occurrence of \
                jsonSesssion = jsonSesssion.replace(/\\/g, '');

                console.log("jsonSesssion:", jsonSesssion);
                

                let updateSql = `UPDATE sessions SET sess = ? WHERE sid = ?`;
                sessionDb.prepare(updateSql).run(jsonSesssion, sid);
            }
        
            console.log("result:", result);
        
            res.json({ message: 'Session reloaded' });
        } else {
            res.json({ error: 'Could not reload the session' });
        }
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});


router.get('/settings', async (req, res) => {
    /*
    let userId = req.session.userId;

    let sql = `
        SELECT u.username, u.email,
        COALESCE(json_group_object(s.name, us.setting_value), '{}') AS settings,
        COALESCE(json_group_object(s.name, us.setting_fallback_value), '{}') AS fallback_settings
        FROM users AS u
        LEFT JOIN user_settings AS us ON u.id = us.user_id
        LEFT JOIN settings AS s ON s.id = us.setting_id
        WHERE u.id = ?;    
    `;

    try {
        let result = db.prepare(sql).get(userId);
        console.log("result:", result);
        if (!result) {
            console.log('User not found');
            res.status(500).json({ error: 'User not found' });
        }

        result.setting_value = JSON.parse(result.setting_value);
        result.setting_fallback_value = JSON.parse(result.setting_fallback_value);

        res.json(result);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
    */
    res.json({ message: 'Settings' });
});

// any other path in this route will return an error
router.all('*', (req, res, next) => {
    res.status(404).send({ error: 'Invalid URL' });
});

module.exports = router;
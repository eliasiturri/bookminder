const express = require('express');
const router = express.Router();
const {db} = require('../database/database.js');

const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { actionGuard } = require('../utils/guards.js');

const { roleActionGuard } = require('../middleware/middleware.js');

// TODO: (ENV) use an env variable to set the domain name and path
const MAIN_DATA_PATH = require('path').join(__dirname, '../data');

router.get('/names', async (req, res) => {
    let sql = `SELECT id, name FROM roles;`;

    try {

        const { userId } = req.query;



        let result = db.prepare(sql).all();
        res.json(result);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

router.get('/user-role', async (req, res) => {

    try {

        const { username } = req.query;
        
        // get the user role
        let sql = `
            SELECT roles.name AS role_name
            FROM users_roles
            LEFT JOIN roles ON users_roles.role_id = roles.id
            LEFT JOIN users ON users.username = ?
            WHERE users_roles.user_id = users.id;
        `;

        let result = db.prepare(sql).get(username);

        if (!result) {
            res.status(500).json({ error: 'No user role found' });
        }

        res.json(result);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

// list all the roles and actions that can be allowed or denied
router.get('/', roleActionGuard('can edit roles'), async (req, res) => {

    // get the roles
    let sql = `
        SELECT 
            roles.id AS role_id, 
            roles.name AS role_name, 
            roles.is_default AS is_default, 
            json_group_object(
                actions.name, 
                COALESCE(roles_actions.enabled, 0)
            ) AS actions
        FROM 
            roles
        CROSS JOIN actions
        LEFT JOIN roles_actions 
            ON roles.id = roles_actions.role_id 
            AND actions.id = roles_actions.action_id
        GROUP BY 
            roles.id, roles.name, roles.is_default;
    `;
    // suggested values for the actions
    let suggestedActionsSql = `
        SELECT actions.id AS action_id, actions.name AS action_name, actions.is_suggested AS is_suggested 
        FROM actions;
    `;

    try {
        let result = db.prepare(sql).all();
        if (!result) {
            res.status(500).json({ error: 'No roles found' });
        }

        for (let i = 0; i < result.length; i++) {
            let actions = result[i].actions;
            actions = JSON.parse(actions);
            result[i].actions = actions;
        }

        let suggestedActions = db.prepare(suggestedActionsSql).all();

        res.json({ roles: result, suggestedActions: suggestedActions });
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

router.post('/', roleActionGuard('can edit roles'), async (req, res) => {
    
    let actionsSql = `
        SELECT actions.id AS action_id, actions.name AS action_name, 0 AS enabled FROM actions;
    `;

    if (!await actionGuard('can edit roles', req.session.userId, res)) { return; }

    try {
        const { editedRoles, newRoles, deletedRoles } = req.body;

        // atomic transaction
        const transaction = db.transaction(() => {
            // add new roles (and actions)
            for (let i = 0; i < newRoles.length; i++) {
                let newRole = newRoles[i];
                let role_name = newRole.role_name;
                let is_default = newRole.is_default;
                let sql = `
                    INSERT INTO roles (name, is_default) VALUES (?, ?);
                `;
                let insertResult = db.prepare(sql).run(role_name, is_default);
                let insertedRoleId = insertResult.lastInsertRowid;

                let roleActions = newRole.actions;

                let actionsResult = db.prepare(actionsSql).all();
                console.log('actionsResult: ', actionsResult);

                for (let j = 0; j < actionsResult.length; j++) {
                    let action = actionsResult[j];
                    let action_id = action.action_id;
                    let action_name = action.action_name;
                    let enabled = roleActions[action_name] || 0;
                    let sql = `
                        INSERT INTO roles_actions (role_id, action_id, enabled) VALUES (?, ?, ?);
                    `;
                    db.prepare(sql).run(insertedRoleId, action_id, enabled);
                }
            }

            // update roles
            for (let i = 0; i < editedRoles.length; i++) {
                let editedRole = editedRoles[i];
                let role_id = editedRole.role_id;
                let role_name = editedRole.role_name;
                let is_default = editedRole.is_default;
                let sql = `
                    UPDATE roles SET is_default = ?, name = ? WHERE id = ?;
                `;
                db.prepare(sql).run(is_default, role_name, role_id);

                let roleActions = editedRole.actions;


                for (action_name in roleActions) {
                    console.log("action_name: ", action_name);
                    let enabled = roleActions[action_name] || 0;
                    console.log("enabled: ", enabled);

                    let checkExistsSql = `
                        SELECT * FROM roles_actions WHERE role_id = ? AND action_id = (SELECT id FROM actions WHERE name = ?);
                    `;

                    let exists = db.prepare(checkExistsSql).get(role_id, action_name);
                    console.log("exists before: ", exists);

                    if (!exists) {
                        console.log("inserting new role action");
                        let sql = `
                            INSERT INTO roles_actions (role_id, action_id, enabled) VALUES (?, (SELECT id FROM actions WHERE name = ?), ?);
                        `;
                        db.prepare(sql).run(role_id, action_name, enabled);
                    } else {
                        console.log("updating role action");
                        let sql = `
                            UPDATE roles_actions SET enabled = ? WHERE role_id = ? AND action_id = (SELECT id FROM actions WHERE name = ?);
                        `;
                        db.prepare(sql).run(enabled, role_id, action_name);

                        let exists = db.prepare(checkExistsSql).get(role_id, action_name);
                        console.log("exists after: ", exists);                        
                    }


                }
            }

            // delete roles
            for (let i = 0; i < deletedRoles.length; i++) {
                let deletedRole = deletedRoles[i];
                let role_name = deletedRole.role_name;
                let sql = `
                    DELETE FROM roles WHERE name = ?;
                `;
                db.prepare(sql).run(role_name);
            }            
        });
        transaction();    
        res.json({ message: 'Roles updated' });

    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

router.post('/default', roleActionGuard('can edit users'), async (req, res) => {
    
    try {
        const { username, roleName } = req.body;

        // check that the role name exists
        let checkRoleSql = `
            SELECT * FROM roles WHERE name = ?;
        `;
        let role = db.prepare(checkRoleSql).get(roleName);
        if (!role) {
            res.status(500).json({ error: 'Role not found' });
        }

        let userId = db.prepare(`SELECT id FROM users WHERE username = ?;`).get(username).id;

        if (!userId) {
            res.status(500).json({ error: 'User not found' });
        }

        console.log("role: ", role);

        let updateRoleSql = `
            UPDATE users_roles SET role_id = ? WHERE user_id = ?;
        `;
        db.prepare(updateRoleSql).run(role.id, userId);

        res.json({ message: 'Default role updated' });

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
const {db} = require('./database.js');

function createRolesAndActions(userId, userRole) {
    console.log("Creating roles and actions");

    try {
        let roles = ['Owner', 'Admin', 'User'];
        let rolesIsDefault = [0, 1, 0];
        let insertedRolesIds = [];
        let actions = ['can edit roles', 'can edit users', 'can edit global libraries', 'can edit user libraries'];
        let actionsIsSuggested = [1, 1, 1, 1];
        let insertedActionsIds = [];
    
        let sqlRoles = `INSERT INTO roles (name, is_default) VALUES (?, ?)`;
        let sqlActions = `INSERT INTO actions (name, is_suggested) VALUES (?, ?)`;
        let sqlUsersRoles = `INSERT INTO users_roles (user_id, role_id) VALUES (?, ?)`;
        let sqlRolesActions = `INSERT INTO roles_actions (role_id, action_id, enabled) VALUES (?, ?, ?)`;
    
        roles.forEach((role, index) => {
            let result = db.prepare(sqlRoles).run(role, rolesIsDefault[index]);
            insertedRolesIds.push(result.lastInsertRowid);
        });
    
        actions.forEach((action, index) => {
            let result = db.prepare(sqlActions).run(action, actionsIsSuggested[index]);
            insertedActionsIds.push(result.lastInsertRowid);
        });

        insertedRolesIds.forEach((roleId, roleIndex) => {
            insertedActionsIds.forEach(actionId => {
                // Owner gets all permissions, Admin gets all except role editing, User gets none by default
                let enabled = 0;
                if (roles[roleIndex] === 'Owner') {
                    enabled = 1; // Owner gets all permissions
                } else if (roles[roleIndex] === 'Admin') {
                    // Admin gets all permissions except 'can edit roles'
                    const action = actions[insertedActionsIds.indexOf(actionId)];
                    enabled = action === 'can edit roles' ? 0 : 1;
                }
                db.prepare(sqlRolesActions).run(roleId, actionId, enabled);
            });
        });
    
        roles.forEach((role, index) => {
            if (role == userRole) {
                let result = db.prepare(sqlUsersRoles).run(userId, insertedRolesIds[index]);
            }
        });

    } catch (error) {
        console.error(error);
    }
}



module.exports = {
    createRolesAndActions
};
var {db} = require('../database/database.js');

const actionDenyMessage = {
    error: true,
    authorized: false,
    message: 'You are not authorized to perform this action'
};

const actionGuardSql = `
    SELECT roles.id as role_id, users.username AS username, roles.name as role_name,
    json_group_object(actions.name, IIF(users_actions.enabled IS 1, 1, IIF(users_actions.enabled IS 0, 0, roles_actions.enabled))) AS allowed
    FROM roles 
    LEFT JOIN roles_actions ON roles.id = roles_actions.role_id 
    LEFT JOIN actions ON roles_actions.action_id = actions.id
    LEFT JOIN users_roles ON users_roles.role_id = roles.id
    LEFT JOIN users ON users.id = users_roles.user_id
    LEFT JOIN users_actions ON users_actions.user_id = users_roles.user_id AND users_actions.action_id = actions.id
    WHERE users_roles.user_id = ?
    GROUP BY roles.id;
`;

function actionGuard(action, userId, res) {
    return new Promise((resolve, reject) => {
        console.log(`Checking action: ${action} for user: ${userId}`);
        let result = db.prepare(actionGuardSql).all(userId);
        if (!result) {
            res.json(actionDenyMessage);
        }

        for (let i = 0; i < result.length; i++) {
            let allowed = result[i].allowed;
            allowed = JSON.parse(allowed);
            console.log(`allowed (${i}): `, allowed, typeof allowed);
            console.log(`allowed[${action}]: `, allowed[action]);
            if (allowed[action] === 1) {
                resolve(true);
                return;
            }
        }
        console.log("post resolve(true)");
        res.json(actionDenyMessage);
        resolve(false);
    });
}

module.exports = {
    actionGuard: actionGuard
};
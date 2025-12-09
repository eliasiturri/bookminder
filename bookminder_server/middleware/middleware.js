const { allowedPlugins } = require('../database/loki.js');

// just for testing a middleware with a parameter
const testMiddleware = role => { 
    return (req, res, next) => {
        if (role == true) {
            console.log(`role granted`);
            next()
        } else {
            console.log(`role not granted`);
            res.status(401).send('Unauthorized')
        }
    }
};

// route middleware to ensure user is authenticated
const requiresAuth = (req, res, next) => {
    //console.log("req.session", req.session);
    //console.log("req.session.userId", req.session);
    if (req.session.userId) {
        next()
    } else {
        res.status(401).send('Unauthorized');
    }
};

const requiresPluginAuth = (req, res, next) => {
    //console.log("req.headers", req.headers);

    try {
        let authorization = req.headers['authorization'];
        let decodedAuthorization = Buffer.from(authorization, 'base64').toString('utf-8');
        let [publicUuid, token] = decodedAuthorization.split(':');
        let pluginToken = allowedPlugins[publicUuid];
        if (pluginToken === token) {
            next();
        } else {
            res.status(401).send('Unauthorized');
        }
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
}

const requiresLibraryInsertAuth = (httpType) => {
    return (req, res, next) => {

        let libraryType = httpType == 'GET' ? req.query.libraryType : req.body.libraryType;

        if (role == true) {
            console.log(`role granted`);
            next()
        } else {
            console.log(`role not granted`);
            res.status(401).send('Unauthorized')
        }
    }
};

const roleActionGuard = (action) => {
    //console.log("checking action: ", action);
    return (req, res, next) => {
        let userAction = req.session.role_actions[action] || 0;
        if (userAction == 1) {
            next();
        } else {
            res.status(401).send({ error: 'You are not authorized to perform this action' });
        }
    }
}


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

const actionDenyMessage = {
    authorized: false,
    error: 'You are not authorized to perform this action'
};

// route middleware to deny access if the action performed is not allowed
const actionGuard = (action) => {
    return (req, res, next) => {
        try {
            let result = db.prepare(actionGuardSql).all(req.session.userId);
            if (!result) {
                res.json(actionDenyMessage);
            }
    
            for (let i = 0; i < result.length; i++) {
                let allowed = result[i].allowed;
                allowed = JSON.parse(allowed);
                if (allowed[action] === 1) {
                    next()
                    return;
                }
            }
            res.json(actionDenyMessage);
        } catch (err) {
            console.log("Error:", err);
            res.status(500).json({ error: err });
        }
    }
};

module.exports = { requiresAuth, testMiddleware, actionGuard, requiresPluginAuth, roleActionGuard };
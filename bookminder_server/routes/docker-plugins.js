const express = require('express');
const router = express.Router();
const axios = require('axios');

const { pluginsMem, allowedPlugins } = require('../database/loki.js');
const { requiresPluginAuth } = require('../middleware/middleware.js');

const {db} = require('../database/database.js');

router.get('/all', (req, res) => {
    let plugins = pluginsMem.find();
    for (let plugin of plugins) {
        delete plugin.private_uuid;
        
        // Add meta timestamps if not present
        if (!plugin.meta) {
            plugin.meta = {
                created: plugin.meta && plugin.meta.created ? plugin.meta.created : Date.now(),
                updated: plugin.meta && plugin.meta.updated ? plugin.meta.updated : Date.now()
            };
        }
    }
    res.json(plugins);
});

router.get('/get-settings', async (req, res) => {
    let userId = req.session.userId;

    const { publicUuid } = req.query;

    console.log("publicUuid: ", publicUuid, req.query);

    let sql = `
        SELECT u.username, u.email,
        json_group_object(s.name, us.value) AS setting_value,
        json_group_object(s.name, s.fallback_value) AS setting_fallback_value
        FROM users AS u
        LEFT JOIN user_settings AS us ON u.id = us.user_id
        LEFT JOIN settings AS s ON s.id = us.setting_id
        WHERE u.id = ?;    
    `;

    try {
        let result = db.prepare(sql).get(userId);

        if (!result) {
            console.log('User not found');
            res.status(500).json({ error: 'User not found' });
            return;
        }

        let plugin = pluginsMem.findOne({ public_uuid: publicUuid });
        if (!plugin) {
            console.log('Plugin not found');
            res.status(500).json({ error: 'Plugin not found' });
            return;
        }

        console.log("plugin: ", plugin);

        let pluginContainerName = plugin.container_name;
        let pluginContainerPort = plugin.container_port;

        let settingsEntrypoint = plugin.entrypoints.find(entrypoint => entrypoint.type === 'settings');
        if (!settingsEntrypoint) {
            console.log('Settings entrypoint not found');
            res.status(500).json({ error: 'Settings entrypoint not found' });
            return;
        }

        let settingsUrl = `http://${pluginContainerName}:${pluginContainerPort}/get-settings`;

        let settingsResult = await axios.get(settingsUrl, {
            params: {
                username: result.username,
            }
        });


        res.json(settingsResult.data);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ error: err });
    }
});

router.get('/pluginData', (req, res) => {
    console.log("pluginData req.query: ", req.query);
    console.log("session data: ", req.session);

    // get the username frome the session
    let username = req.session.username;

    // get the user_id from the table users
    let sqlUserId = `SELECT id FROM users WHERE username = ?;`;
    let userId = db.prepare(sqlUserId).get(username).id;

    if (!userId) {
        res.json({ error: 'User not found' });
    }

    // get the data from database in table "plugindata" (in the table, plugin_id references the table "plugins"), the data is in the column "data", and return the data
    let pluginId = req.query.pluginId;
    let sql = `SELECT is_encrypted, algorithm, key, iv, data FROM plugindataencrypted AS pdata LEFT JOIN plugins AS p ON pdata.plugin_id = p.id WHERE p.uuid = ? AND user_id = ?;`;
    let result = db.prepare(sql).get(pluginId, userId);
    if (!result) {
        res.json({})
    }
    console.log("pluginData result: ", result);
    res.json(result);
});

router.post('/register', requiresPluginAuth, (req, res) => {
    try {
        //console.log("PLUGIN REGISTER CALLED");
        const { name, 
            description, 
            public_uuid, 
            private_uuid,
            container_port,
            container_name,
            entrypoints,
            last_modified_ts } = req.body;
    
        let pluginData = {
            name: name,
            description: description,
            public_uuid: public_uuid,
            private_uuid: private_uuid,
            container_port: container_port,
            container_name: container_name,
            entrypoints: entrypoints,
            last_modified_ts: last_modified_ts
        }
    
        let allowedPluginSecret = allowedPlugins[public_uuid];
        if (!allowedPluginSecret) {
            res.json({ error: 'Plugin not allowed' });
        }
    
        //console.log("pluginData: ", pluginData);    
    
        let registeredPlugin = pluginsMem.findOne({ public_uuid: public_uuid });
        //console.log("plugin: ", registeredPlugin);
        // if the plugin exists, update the data
        if (registeredPlugin && parseInt(registeredPlugin.last_modified_ts) < parseInt(last_modified_ts)) {
    
            registeredPlugin.name = name;
            registeredPlugin.description = description;
            //registeredPlugin.public_uuid = public_uuid;
            registeredPlugin.private_uuid = private_uuid;
            registeredPlugin.container_port = container_port;
            registeredPlugin.container_name = container_name;
            registeredPlugin.entrypoints = entrypoints;
            registeredPlugin.last_modified_ts = last_modified_ts;
            
            // Update the ping timestamp
            if (!registeredPlugin.meta) {
                registeredPlugin.meta = { created: Date.now() };
            }
            registeredPlugin.meta.updated = Date.now();
    
            pluginsMem.update(registeredPlugin);
        } else if (!registeredPlugin) {
            // if the plugin does not exist, insert the data with meta timestamps
            pluginData.meta = {
                created: Date.now(),
                updated: Date.now()
            };
            pluginsMem.insert(pluginData);
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.json({ error: error });
    }
});

router.post('/pluginData', (req, res) => {
    console.log("pluginData req.body: ", req.body);
    console.log("session data: ", req.session);

    // get the username frome the session
    let username = req.session.username;

    // get the user_id from the table users
    let sqlUserId = `SELECT id FROM users WHERE username = ?;`;
    let userId = db.prepare(sqlUserId).get(username).id;

    if (!userId) {
        res.json({ error: 'User not found' });
    }

    // update the data in the database in table "plugindata" (in the table, plugin_id references the table "plugins"), the data is in the column "data"
    let pluginId = req.body.pluginId;
    let data = req.body.data;
    data = JSON.stringify(data);

    console.log("type of data: ", typeof data);
    console.log('type of pluginId: ', typeof pluginId);

    // check if there is a row with data in the table plugindata
    let sql = `SELECT * FROM plugindata WHERE plugin_id = (SELECT id FROM plugins WHERE uuid = ?) AND user_id = ?;;`;
    let result = db.prepare(sql).all(pluginId, userId);
    console.log("result: ", result);

    // if the row exists, update the data
    if (result.length > 0) {
        sql = `UPDATE plugindata SET data = ? WHERE plugin_id = (SELECT id FROM plugins WHERE uuid = ?) AND user_id = ?;;`;
        db.prepare(sql).run(data, pluginId, userId);
    } else {
        // if the row does not exist, insert the data
        sql = `INSERT INTO plugindata (plugin_id, data, is_encrypted) VALUES ((SELECT id FROM plugins WHERE uuid = ?), ?, 0);`;
        db.prepare(sql).run(pluginId, data);
    }
    res.json({ success: true });
});

const pluginPost = async (publicUuid, data) => {
    try {

        let allowedPlugin = allowedPlugins[publicUuid];
        let registeredPlugin = pluginsMem.findOne({ uuid: publicUuid });

        if (!allowedPlugin || !registeredPlugin) {
            return { error: 'Plugin not found' };
        }

        const { container_port, container_name, entrypoints } = allowedPlugin;
        const { baseUrl, endpointUrl, payload } = data;

        // we check if the endpoint url is in the entrypoints
        if (!entrypoints.includes(endpointUrl)) {
            return { error: 'Endpoint not allowed' };
        }

        let basicAuthBase64 = Buffer.from(`${container_name}:${registeredPlugin.secret}`).toString('base64');
        let headers = {
            authorization: `Basic ${basicAuthBase64}`
        };
        

        // we build the url
        let url = `http://${baseUrl}:${container_port}/${endpointUrl}`;
        const response = await axios.post(url, payload, { headers });
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

const pluginGet = async (publicUuid, data) => {
    try {

        let allowedPlugin = allowedPlugins[publicUuid];
        let registeredPlugin = pluginsMem.findOne({ uuid: publicUuid });

        if (!allowedPlugin || !registeredPlugin) {
            return { error: 'Plugin not found' };
        }

        const { container_port, container_name, entrypoints } = allowedPlugin;
        const { baseUrl, endpointUrl, payload } = data;

        // we check if the endpoint url is in the entrypoints
        if (!entrypoints.includes(endpointUrl)) {
            return { error: 'Endpoint not allowed' };
        }

        let basicAuthBase64 = Buffer.from(`${container_name}:${registeredPlugin.secret}`).toString('base64');
        let headers = {
            authorization: `Basic ${basicAuthBase64}`
        };
        

        // we build the url
        let url = `http://${baseUrl}:${container_port}/${endpointUrl}`;
        const response = await axios.get(url, { headers }, { params: payload });
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

module.exports = router;
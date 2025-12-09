const express = require('express');
const router = express.Router();
const {db} = require('../database/database.js');

const axios = require('axios');

// TODO: (PLUGINS) refactor all this

router.get('/', async (req, res) => {
    const { plugin, query, page } = req.query;

    if (!plugin || !query) {
        return res.status(400).send('GET. Missing plugin or query parameter');
    }

    let pluginObj = mainPlugins.find(p => p.name === plugin);
    console.log(pluginObj);

    let url = !page ? `http://${pluginObj.url}:${pluginObj.port}/search?query=${query}` : `http://${pluginObj.url}:${pluginObj.port}/search?query=${query}&page=${page}`;

    axios.get(url)
        .then(response => {
            res.send(response.data);
        })
        .catch(error => {
            res.send('Error making the request:', error);
        });

    // Process the request and send a response
    //res.send(`Searching for ${query} using plugin ${plugin}`);
});

router.post('/', async (req, res) => {
    console.log(req.body);
    // get the parameters from the post request "params"
    const { plugin, params } = req.body;
    console.log(plugin, params);

    if (!plugin || !params) {
        return res.status(400).send('POST. Missing plugin or parameters');
    }

    let pluginObj = mainPlugins.find(p => p.name === plugin);
    console.log(pluginObj);


    if (pluginObj.method == "GET") {
        let url = `http://${pluginObj.url}:${pluginObj.port}/search?params=${params}`;

        axios.get(url)
            .then(response => {
                res.send(response.data);
            })
            .catch(error => {
                res.send('Error making the request:', error);
            });
    } else if (pluginObj.method == "POST") {
        let url = `http://${pluginObj.url}:${pluginObj.port}/search`;

        axios.post(url, { params: params })
            .then(response => {
                res.send(response.data);
            })
            .catch(error => {
                res.send('Error making the request:', error);
            });
    }

    // Process the request and send a response
    //res.send(`Searching for ${query} using plugin ${plugin}`);
});

router.get('*', (req, res) => {
    res.status(404).send('Not found');
});
router.post('*', (req, res) => {
    res.status(404).send('Not found');
});

module.exports = router;
const loki = require('lokijs');
const lokiDb = new loki('docker-plugins.loki');

const { ALLOWED_PLUGINS } = require('../utils/env.js');


var pluginsMem = lokiDb.addCollection('plugins', { 
    unique: ['public_uuid'],
    indices: ['public_uuid']
});

var allowedPlugins = ALLOWED_PLUGINS;

module.exports = {
    pluginsMem,
    allowedPlugins
};
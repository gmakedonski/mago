'use strict';

var path = require('path'),
    migrator = require(path.resolve('./custom_functions/advanced_settings_migrator.js'));

module.exports = {
    up: (queryInterface, Sequelize) => {
        return migrator.migrate(queryInterface, {
            operation: 'add',
            path: '.',
            name: "ezdrm",
            value: {
                "description": "Integration configuration for EZDRM. Parameters username and password are credentials of your account at EZDRM",
                "username": "",
                "password": ""
            }
        }).catch(function(err) {

        });
    },

    down: (queryInterface, Sequelize) => {
        return migrator.migrate(queryInterface, {
            operation: 'remove',
            path: '.',
            name: "ezdrm",
        });
    }
};

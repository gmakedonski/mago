'use strict';

var path = require('path'),
    migrator = require(path.resolve('./custom_functions/advanced_settings_migrator.js'));

module.exports = {
  up: (queryInterface, Sequelize) => {
    return migrator.migrate(queryInterface, {
      operation: 'add',
      path: '.',
      name: "upgrade_policy",
      value: {
        "description": "Configuration for device upgrade process",
        "availability_interval": [[3, 0], [6, 0]],
        "availability_denominator": 1
      }
    }).catch(function(err) {
      
    });
  },

  down: (queryInterface, Sequelize) => {
    return migrator.migrate(queryInterface, {
      operation: 'remove',
      path: '.',
      name: "upgrade_policy",
    });
  }
};

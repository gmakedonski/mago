'use strict';
var winston = require('winston');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('channels', 'catchup_mode', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    }).catch(function(err) {
      winston.error(err);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('channels', 'catchup_mode');
  }
};

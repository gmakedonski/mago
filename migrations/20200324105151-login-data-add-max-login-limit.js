'use strict';

var winston = require('winston');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('login_data', 'max_login_limit', {
      type: Sequelize.INTEGER(11),
      allowNull: false,
      defaultValue: 2
    }).catch(function(err) {
      winston.error(err);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('login_data', 'max_login_limit');
  }
};

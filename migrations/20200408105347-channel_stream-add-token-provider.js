'use strict';

var winston = require('winston');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('channel_stream', 'token_provider', {
      type: Sequelize.STRING(10),
      allowNull: true,
      after: 'token_url'
    }).catch(function (err) {
      winston.error(err);
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('channel_stream', 'token_provider');
  }
};

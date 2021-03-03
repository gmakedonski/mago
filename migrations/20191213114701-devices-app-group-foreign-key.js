'use strict';

var winston = require('winston');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query("ALTER TABLE devices ADD CONSTRAINT FOREIGN KEY(appid) REFERENCES app_group(id)")
      .catch(function(err) {
        winston.error(err);
      });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query("ALTER TABLE devices DROP devices_ibfk_3")
    .catch(function(err) {
      winston.error(err);
    });
  }
};

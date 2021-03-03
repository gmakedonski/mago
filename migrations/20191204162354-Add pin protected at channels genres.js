'use strict';
const winston = require('winston');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('genre', 'pin_protected', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      after: "is_available",
      defaultValue: false
    }).catch(function (err) {
      winston.error("Error adding column pin_protected to genre ", err);
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('genre', 'pin_protected')
      .catch(function (err) {
        winston.error('Removing column pin_protected to genre failed with error message: ', err);
      });
  }
};

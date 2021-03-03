'use strict';

var winston = require('winston');

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.query("UPDATE customer_data SET country = TRIM(country)")
            .catch(function(err) {
                winston.error(err);
            });
    },

    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.query("UPDATE customer_data SET country = TRIM(country)")
            .catch(function(err) {
                winston.error(err);
            });
    }
};

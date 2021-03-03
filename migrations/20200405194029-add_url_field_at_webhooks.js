'use strict';

var winston = require('winston');

module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.addColumn('webhooks', 'alternative_url', {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: ''
            }).catch(function (err) {
                winston.error(err);
            }),
        ])
    },

    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.removeColumn('webhooks', 'alternative_url'),
        ]).catch(function(err) {
            winston.error(err)
        })
    }
};
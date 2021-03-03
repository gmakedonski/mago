'use strict';

var winston = require('winston');

module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.addColumn('users', 'firstname', {
                type: Sequelize.STRING(64),
                allowNull: false,
                defaultValue : ''
            }).catch(function (err) {
                winston.error(err);
            }),
            queryInterface.addColumn('users', 'lastname', {
                type: Sequelize.STRING(64),
                allowNull: false,
                defaultValue : ''
            }).catch(function (err) {
                winston.error(err);
            }),
        ])
    },

    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.removeColumn('users', 'firstname'),
            queryInterface.removeColumn('users', 'lastname'),
        ]).catch(function(err) {
            winston.error(err)
        })
    }
};

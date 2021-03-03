'use strict';

var winston = require('winston');

module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.addColumn('vod_resume', 'percentage_position', {
                type: Sequelize.DECIMAL(5,2),
                allowNull: false,
                defaultValue: 0
            }).catch(function (err) {
                winston.error(err);
            }),
        ])
    },

    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.removeColumn('vod_resume', 'percentage_position'),
        ]).catch(function(err) {
            winston.error(err)
        })
    }
};
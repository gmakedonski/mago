'use strict';

var winston = require('winston');

module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.addColumn('vod_resume', 'vod_type', {
                type: Sequelize.STRING(255),
                allowNull: false,
                defaultValue: 'film',
            }).catch(function (err) {
                winston.error(err);
            })
        ])
    },

    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.removeColumn('vod_resume', 'vod_type'),
        ]).catch(function(err) {
            winston.error(err)
        })
    }
};


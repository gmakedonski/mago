
'use strict';

var winston = require('winston');

module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.addColumn('epg_data', 'livestream', {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false
            }).catch(function (err) {
                winston.error(err);
            }),
            queryInterface.addColumn('epg_data', 'genre', {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue : ''
            }).catch(function (err) {
                winston.error(err);
            }),
            queryInterface.addColumn('epg_data', 'audio', {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue : ''
            }).catch(function (err) {
                winston.error(err);
            }),
            queryInterface.addColumn('epg_data', 'rating_score', {
                type: Sequelize.INTEGER(11),
                allowNull: true
            }).catch(function (err) {
                winston.error(err);
            }),
            queryInterface.addColumn('epg_data', 'parental_control', {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false
            }).catch(function (err) {
                winston.error(err);
            }),
            queryInterface.addColumn('epg_data', 'content_rating', {
                type: Sequelize.STRING,
                allowNull: true
            }).catch(function (err) {
                winston.error(err);
            }),
            queryInterface.addColumn('epg_data', 'banner_url', {
                type: Sequelize.STRING,
                allowNull: true
            }).catch(function (err) {
                winston.error(err);
            }),
        ])
    },

    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.removeColumn('epg_data', 'livestream'),
            queryInterface.removeColumn('epg_data', 'genre'),
            queryInterface.removeColumn('epg_data', 'audio'),
            queryInterface.removeColumn('epg_data', 'rating_score'),
            queryInterface.removeColumn('epg_data', 'parental_control'),
            queryInterface.removeColumn('epg_data', 'content_rating'),
            queryInterface.removeColumn('epg_data', 'banner_url')
        ]).catch(function(err) {
            winston.error(err)
        })
    }
};

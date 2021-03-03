'use strict';
var winston = require('winston');

module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.addColumn('vod_resume', 'favorite', {
            type: Sequelize.INTEGER(11),
            defaultValue: 0,
            allowNull: true
        }).catch(function (err) {
            winston.error('Adding column vod_resume.favorite failed with error message: ', err.message);
        });
    },

    down: function (queryInterface, Sequelize) {
        return queryInterface.removeColumn('vod_resume', 'favorite').then(function (success) {
        }).catch(function (err) {
            winston.error('Removing column vod_resume.vod_resume failed with error message: ', err.message);
        });
    }
};


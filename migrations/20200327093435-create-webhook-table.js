'use strict';
var winston = require('winston');

module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.createTable(
            'webhooks',
            {
                id: {
                    type: Sequelize.INTEGER(11),
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true,
                    unique: true
                },
                company_id: {
                    type: Sequelize.INTEGER(11),
                    allowNull: false,
                    references: {model: 'settings', key: 'id'}
                },
                url: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                enable: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false
                },
                events: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                createdAt: {
                    type: Sequelize.DATE
                },
                updatedAt: {
                    type: Sequelize.DATE
                }
            }).catch(function(err) {winston.error('Creating table commands failed with error message: ',err.message);});
    },

    down: function (queryInterface, Sequelize) {
        return queryInterface.dropTable ('webhooks')
            .catch(function(err) {winston.error('Deleting table commands failed with error message: ',err.message);});
    }
};
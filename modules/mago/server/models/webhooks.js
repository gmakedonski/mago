"use strict";

module.exports = function(sequelize, DataTypes) {
    var advancedSettings = sequelize.define('webhooks', {
        id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        company_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
            defaultValue: 1,
            unique: true
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        enable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        events: {
            type: DataTypes.TEXT,
            allowNull: true,
            get: function () {
                try {
                    return JSON.parse(this.getDataValue('events'));
                } catch (e) {
                    return null;
                }
            },
            set: function (value) {
                return this.setDataValue('events', JSON.stringify(value));
            }
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'webhooks',
        associate: function(models) {
            advancedSettings.belongsTo(models.settings, {foreignKey: 'company_id'});
        }
    });
    return advancedSettings;
};
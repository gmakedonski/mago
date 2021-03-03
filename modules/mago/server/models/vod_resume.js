"use strict";

module.exports = function(sequelize, DataTypes) {
    var vod_resume = sequelize.define('vod_resume', {
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
            defaultValue: 1
        },
        login_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        vod_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        resume_position: { //range should be [0-100]%
            type: DataTypes.INTEGER(11),
            allowNull: false,
            defaultValue: 0
        },
        reaction: { //value set should be [-1, 0, 1]
            type: DataTypes.INTEGER(11),
            allowNull: false,
            defaultValue: 0
        },
        seen_details: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: 0
        },
        device_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        favorite: { //value set should be [0, 1]
            type: DataTypes.INTEGER(11),
            allowNull: true,
            defaultValue: 0
        },
        vod_type: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'film'
        },
        percentage_position: { //value set should be [0.00, 100.00]
            type: DataTypes.DECIMAL(5,2),
            allowNull: true,
            defaultValue: 0
        }
    }, {
        tableName: 'vod_resume',
        associate: function(models) {
            if (models.login_data){
                vod_resume.belongsTo(models.login_data, {foreignKey: 'login_id'});
            }
            if (models.vod){
                vod_resume.belongsTo(models.vod, {foreignKey: 'vod_id'});
            }
            vod_resume.belongsTo(models.settings, {foreignKey: 'company_id'});
        }
    });
    return vod_resume;
};
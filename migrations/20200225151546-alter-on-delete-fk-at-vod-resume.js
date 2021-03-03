'use strict';

var winston = require('winston');
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.query("Alter table vod_resume drop foreign key vod_resume_ibfk_2")
            .then(function () {
                return queryInterface.sequelize.query("alter table vod_resume add foreign key (vod_id) references vod(id) on DELETE CASCADE on UPDATE CASCADE")
                    .catch(function (error) {
                        winston.error(error)
                    })
            }).catch(function (error) {
                winston.error(error)
            })
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(function(t) {
            return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS=0', {transaction: t})
                .then(function() {
                    return Promise.all([
                        queryInterface.sequelize.query("alter table vod_resume add foreign key (vod_id) references vod(id) on DELETE CASCADE on UPDATE CASCADE")
                            .catch(function(err) {winston.error(err)})
                    ]);
                })
        })
            .then(function() {
                queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS=1')
            })
            .catch(function(err) {winston.error(err)})
    }
};
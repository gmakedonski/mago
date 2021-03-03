'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.query("alter table vod_resume modify percentage_position int(11) not null;");
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.query("alter table vod_resume modify percentage_position int(11) not null;");
    }
};
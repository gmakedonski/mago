'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.sequelize.query("alter table epg_data modify title varchar(100) null;");
  },
  down: (queryInterface, Sequelize) => {
      return queryInterface.sequelize.query("alter table epg_data modify title varchar(45) null;");
  }
};

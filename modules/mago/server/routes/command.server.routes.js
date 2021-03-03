'use strict';

const path = require('path'),
  policy = require('../policies/mago.server.policy'),
  commands = require(path.resolve('./modules/mago/server/controllers/command.server.controller'));


module.exports = function (app) {

  app.route('/api/commands')
    .all(policy.Authenticate)
    .get(commands.list)
    .post(commands.create);

  app.route('/api/remote/login')
    .all(policy.Authenticate)
    .post(commands.remote_login);

};

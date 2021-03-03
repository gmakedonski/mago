'use strict'

var policy = require('../policies/mago.server.policy'),
    programContentCtl = require('../controllers/program_content.server.controler');

module.exports = function(app) {
    app.route('/api/program_content')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .get(programContentCtl.list)
        .post(programContentCtl.create);

    app.route('/api/program_content/:id')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .all(programContentCtl.dataByID)
        .get(programContentCtl.read)
        .put(programContentCtl.update)
        .delete(programContentCtl.delete);
}
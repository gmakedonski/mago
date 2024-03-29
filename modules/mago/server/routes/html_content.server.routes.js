'use strict';

var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    policy = require('../policies/mago.server.policy'),
    htmlContent = require(path.resolve('./modules/mago/server/controllers/html_content.server.controller'));

module.exports = function(app) {
    /* ===== device menus ===== */
    app.route('/api/htmlContent')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .get(htmlContent.list)
        .post(htmlContent.create);

    app.route('/api/htmlContent/:htmlContentId')
        .all(policy.Authenticate)
        .all(policy.isAllowed)
        .all(htmlContent.dataByID)
        .get(htmlContent.read)
        .put(htmlContent.update)
        .delete(htmlContent.delete);

    app.route('/api/htmlContentApp/:contentID')
        .all(htmlContent.htmlcontent_to_app)
        // .all(policy.Authenticate)
        //.all(policy.isAllowed)
        .get(htmlContent.read);

    app.route('/api/htmlContentApp')
        // .all(policy.Authenticate)
        //.all(policy.isAllowed)
        .get(htmlContent.htmlcontent_name_to_app);



};

'use strict';
/**
 * Module dependencies.
 */
var path = require('path'),
    config = require(path.resolve('./config/config')),
    policy = require(path.resolve('./modules/mago/server/policies/mago.server.policy')),
    chargebeeFunction = require(path.resolve('./modules/chargebee/server/controllers/chargebee.server.controller.js'));


module.exports = function(app) {

    app.route('/apiv2/chargebee/subsription_created')
        .all(policy.isApiKeyAllowed)
        .post(chargebeeFunction.chargebee_subscription_created)

}
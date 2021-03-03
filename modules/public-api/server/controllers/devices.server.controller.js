'use strict'

var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    sequelize = require('sequelize'),
    winston = require('winston');

/**
 * @api {post} /api/public/devices/:username Update Devices
 * @apiVersion 0.2.0
 * @apiName UpdateDevices
 * @apiGroup Devices
 * @apiParam (Path parameter) {String} username Username of the user to be updated
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiSuccess (200) {Object[]} data Response
 * @apiSuccess {Number} data.device_active Device active or not
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
 */


exports.updateDevices = function (req, res) {
    if (req.params.username) {
        if (req.body.username) {
            delete req.body.username;
        }
        db.login_data.findOne({
            where: {username: req.params.username}
        }).then(function (login_data) {
            if (!login_data) {
                res.status(404).send({error: {code: 404, message: 'User not found'}});
                return;
            }
            db.devices.update({device_active: 0}, {where: {login_data_id: login_data.id, company_id: req.token.company_id}})
                .then(function (result) {
                    res.send({data: {message: 'Devices Active updated to 0'}});
                }).catch(function (error) {
                winston.error('Update Devices  failed with error: ', error);
                res.status(500).send({error: {code: 500, message: 'Internal error'}})
            });
        }).catch(function (error) {
            winston.error('Database action failed with error: ', error);
            res.status(500).send({error: {code: 500, message: 'Internal error'}});
        })
    } else {
        res.status(400).send({error: {code: 400, message: 'Parameter username missing'}})
    }
}

/**
 * @api {put} /api/public/devices/:username Update Devices
 * @apiVersion 0.2.0
 * @apiName UpdateDevices
 * @apiGroup Devices
 * @apiParam (Path parameter) {String} username Username of the user to be updated
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiSuccess (200) {Object[]} data Response
 * @apiSuccess {Number} data.device_active Device active or not
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
 */


exports.updateDevices = function (req, res) {
    if (req.params.username) {
        if (req.body.username) {
            delete req.body.username;
        }
        db.login_data.findOne({
            where: {username: req.params.username}
        }).then(function (login_data) {
            if (!login_data) {
                res.status(404).send({error: {code: 404, message: 'User not found'}});
                return;
            }
            db.devices.update({device_active: 0}, {where: {login_data_id: login_data.id, company_id: req.token.company_id}})
                .then(function (result) {
                    res.send({data: {message: 'Devices Active updated to 0'}});
                }).catch(function (error) {
                winston.error('Update Devices  failed with error: ', error);
                res.status(500).send({error: {code: 500, message: 'Internal error'}})
            });
        }).catch(function (error) {
            winston.error('Database action failed with error: ', error);
            res.status(500).send({error: {code: 500, message: 'Internal error'}});
        })
    } else {
        res.status(400).send({error: {code: 400, message: 'Parameter username missing'}})
    }
}

/**
 * @api {get} /api/public/userDevices/:username Get Devices
 * @apiVersion 0.2.0
 * @apiName GetDevices
 * @apiGroup Devices
 * @apiParam (Path parameter) {String} username Username of the user to be updated
 * @apiParam (Query parameters) {String} apikey Authorization key as query parameter
 * @apiSuccess (200) {Object[]} data Response
 * @apiSuccess {Number} data.id Device id
 * @apiSuccess {Number} data.company_id Company id
 * @apiSuccess {String} data.username Username of user
 * @apiSuccess {Number} data.login_data_id User id
 * @apiSuccess {Number} data.googleappid Google App id
 * @apiSuccess {Number} data.device_id Device id
 * @apiSuccess {Number} data.login_data_id User id
 * @apiSuccess {Date} data.updatedAt Updated date of the device
 * @apiSuccess {Date} data.createdAt Created date of the device
 * @apiError (40x) {Object} error Error-Response
 * @apiError {Number} error.code Code
 * @apiError {String} error.message Message description of error
 */

exports.getUserDevices = function (req, res) {
    if (req.params.username) {
        if (req.body.username) {
            delete req.body.username;
        }
        db.login_data.findOne({
            where: {username: req.params.username}
        }).then(function (login_data) {
            if (!login_data) {
                res.status(404).send({error: {code: 404, message: 'User not found'}});
                return;
            }
            db.devices.findAll({
                include: [
                    {
                        model: db.login_data,
                        attributes: [],
                        required: true
                    }
                ],
                where: {login_data_id: login_data.id, company_id: req.token.company_id},
                order: [
                    ['updatedAt', 'DESC'],
                    ['device_active' ,'DESC']
                ],
                raw: true
            }).then(function (results) {
                if (!results) {
                    res.status(204).send({data: []});
                    return;
                }
                res.json({data: results});
            }).catch(function (err) {
                winston.error('Getting devices list failed with error: ', err);
                res.status(500).send({error: {code: 500, message: 'Internal error'}});
            });
        }).catch(function (error) {
            winston.error('Database action failed with error: ', error);
            res.status(500).send({error: {code: 500, message: 'Internal error'}});
        })

    } else {
        res.status(400).send({error: {code: 400, message: 'Parameter username missing'}})
    }

}
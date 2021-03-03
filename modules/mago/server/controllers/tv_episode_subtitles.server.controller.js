'use strict';

/**
 * Module dependencies.
 */
const path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    winston = require('winston'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    DBModel = db.tv_episode_subtitles,
    fs = require('fs'),
    Joi = require("joi");
const { Op } = require('sequelize');

/**
 * Create
 */
exports.create = function(req, res) {

    req.body.company_id = req.token.company_id; //save record for this company

    DBModel.create(req.body).then(function(result) {
        if (!result) {
            return res.status(400).send({message: 'fail create data'});
        } else {

            return res.jsonp(result);
        }
    }).catch(function(err) {
        winston.error("Error at creating tv episode subtitles, error: ", err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

/**
 * Show current
 */
exports.read = function(req, res) {
    if(req.tv_episodeSubtitle.company_id === req.token.company_id) res.json(req.tv_episodeSubtitle);
    else return res.status(404).send({message: 'No data with that identifier has been found'});
};

/**
 * Update
 */
exports.update = function(req, res) {
    var updateData = req.tv_episodeSubtitle;

    var updateData = req.tv_episodeSubtitle;
    if(updateData.subtitle_url != req.body.subtitle_url) {
        var deletefile = path.resolve('./public'+updateData.subtitle_url);
    }

    if(req.tv_episodeSubtitle.company_id === req.token.company_id){
        updateData.update(req.body).then(function(result) {
            if(deletefile) {
                fs.unlink(deletefile, function (err) {
                    //todo: return ome warning
                });
            }
            res.json(result);
        }).catch(function(err) {
            winston.error("Error at updating  tv episode subtitles, error: ", err);
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        });
    }
    else{
        res.status(404).send({message: 'User not authorized to access these data'});
    }
};

/**
 * Delete
 */
exports.delete = function(req, res) {
    var deleteData = req.tv_episodeSubtitle;

    DBModel.findByPk(deleteData.id).then(function(result) {
        if (result) {
            if (result && (result.company_id === req.token.company_id)) {
                result.destroy().then(function() {
                    return res.json(result);
                }).catch(function(err) {
                    winston.error("Error at deleting tv episode subtitles, error: ", err);
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                });
                return null;
            }
            else{
                return res.status(400).send({message: 'Unable to find the Data'});
            }
        } else {
            return res.status(400).send({
                message: 'Unable to find the Data'
            });
        }
        return null;
    }).catch(function(err) {
        winston.error("Error at deleting tv_episode subtitles, error: ",err);
        return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
        });
    });

};

/**
 * List
 */
exports.list = function(req, res) {

    var query = req.query;
    var offset_start = parseInt(query._start);
    var records_limit = query._end - query._start;
    var qwhere = {};
    if(query.tv_episode_id) qwhere.tv_episode_id = query.tv_episode_id;

    if (query.q) {
        let filters = []
        filters.push(
            { tv_episode_id: { [Op.like]: `%${query.q}%` } },
            { title: { [Op.like]: `%${query.q}%` } }
        );
        qwhere = { [Op.or]: filters };
    }

    qwhere.company_id = req.token.company_id;

    DBModel.findAndCountAll({
        where: qwhere,
        offset: offset_start,
        limit: records_limit,
        include: [db.tv_episode]
    }).then(function(results) {
        if (!results) {
            return res.status(404).send({
                message: 'No data found'
            });
        } else {

            res.setHeader("X-Total-Count", results.count);
            res.json(results.rows);
        }
    }).catch(function(err) {
        winston.error("Error at listing tv episode subtitles, error: ", err);
        res.jsonp(err);
    });
};

/**
 * middleware
 */
exports.dataByID = function(req, res, next) {

    const getID = Joi.number().integer().required();
    const {error, value} = getID.validate(req.params.tv_episode_subtitle_id);

    if (error) {
        return res.status(400).send({
            message: 'Data is invalid'
        });
    }

    DBModel.findOne({
        where: {
            id: value
        },
        include: [{model: db.tv_episode}]
    }).then(function(result) {
        if (!result) {
            return res.status(404).send({
                message: 'No data with that identifier has been found'
            });
        } else {
            req.tv_episodeSubtitle = result;
            next();
            return null
        }
    }).catch(function(err) {
        winston.error("Error at fetching dataById, error: ", err);
        return res.status(500).send({
            message: 'Error at getting  tv episode subtitle data'
        });
    });

};

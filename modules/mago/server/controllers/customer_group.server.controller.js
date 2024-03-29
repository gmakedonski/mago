'use strict';

/**
 * Module dependencies.
 */
const path = require('path'),
    errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
    winston = require('winston'),
    db = require(path.resolve('./config/lib/sequelize')).models,
    DBModel = db.customer_group,
    Joi = require("joi"),
    escape = require(path.resolve('./custom_functions/escape'));
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
    winston.error("Creating customer group failed with error: ", err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });
};

/**
 * Show current
 */
exports.read = function(req, res) {
  if(req.customerGroup.company_id === req.token.company_id) res.json(req.customerGroup);
  else return res.status(404).send({message: 'No data with that identifier has been found'});
};

/**
 * Update
 */
exports.update = function(req, res) {
  var updateData = req.customerGroup;

  if(updateData.company_id === req.token.company_id){
    updateData.update(req.body).then(function(result) {
      res.json(result);
    }).catch(function(err) {
      winston.error("Updating customer group failed with error: ", err);
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
  var deleteData = req.customerGroup;

  DBModel.findByPk(deleteData.id).then(function(result) {
    if (result) {
      if (result && (result.company_id === req.token.company_id)) {
        result.destroy().then(function() {
          return res.json(result);
        }).catch(function(err) {
          winston.error("Deleting customer failed with error: ", err);
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        });
      }
      else{
        return res.status(400).send({message: 'Unable to find the Data'});
      }
    } else {
      return res.status(400).send({
        message: 'Unable to find the Data'
      });
    }
  }).catch(function(err) {
    winston.error("Finding customer data failed with error: ", err);
    return res.status(400).send({
      message: errorHandler.getErrorMessage(err)
    });
  });

};

/**
 * List
 */
exports.list = function(req, res) {

  var qwhere = {},
      final_where = {},
      query = req.query;

  if(query.q) {
    qwhere = {
      [Op.or]: { description: { [Op.like]: `%${query.q}%` } }
    }
  }

  //start building where
  final_where.where = qwhere;
  if(parseInt(query. _end) !== -1){
    if(parseInt(query._start)) final_where.offset = parseInt(query._start);
    if(parseInt(query._end)) final_where.limit = parseInt(query._end)-parseInt(query._start);
  }

  if(query._orderBy) final_where.order = [[escape.col(query._orderBy), escape.orderDir(query._orderDir)]];

  final_where.include = [];

  final_where.where.company_id = req.token.company_id; //return only records for this company

  DBModel.findAndCountAll(

      final_where

  ).then(function(results) {
    if (!results) {
      return res.status(404).send({
        message: 'No data found'
      });
    } else {

      res.setHeader("X-Total-Count", results.count);
      res.json(results.rows);
    }
  }).catch(function(err) {
    winston.error("Gettinf customer list failed with error: ", err);
    res.jsonp(err);
  });
};

/**
 * middleware
 */
exports.dataByID = function (req, res, next) {

    const getID = Joi.number().integer().required();
    const {error, value} = getID.validate(req.params.customerGroupId);

    if (error) {
        return res.status(400).send({
            message: 'Data is invalid'
        });
    }

    DBModel.findOne({
        where: {
            id: value
        }
    }).then(function (result) {
        if (!result) {
            return res.status(404).send({
                message: 'No data with that identifier has been found'
            });
        } else {
            req.customerGroup = result;
            next();
            return null;
        }
    }).catch(function (err) {
        winston.error("Getting customer data failed with error: ", err);
        return res.status(500).send({
            message: 'Error at getting customer_group data'
        });
    });

};

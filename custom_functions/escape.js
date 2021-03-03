'use strict'
var sqlString = require('sqlstring');

const orderDir = ['ASC', 'DESC'];

exports.col = function(col) {
    return sqlString.escapeId(col);
}

exports.orderDir = function (dir) {
    dir = dir.toUpperCase();
    if (orderDir.indexOf(dir) == -1) {
        dir = 'ASC';
    }

    return dir;
}

exports.value = sqlString.escape;
exports.format = sqlString.format;


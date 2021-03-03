'use strict'

var path = require('path'),
    apicache = require('apicache'),
    redis = require(path.resolve('./config/lib/redis'));

var cacheInstance = null;

module.exports.init = function() {
    cacheInstance = apicache.options({
        enabled: true,
        defaultDuration: 3600000,
        redisClient: redis.client,
        debug: false
    });
}

module.exports.middleware = function(duration) {
    return cacheInstance.middleware(duration);
}
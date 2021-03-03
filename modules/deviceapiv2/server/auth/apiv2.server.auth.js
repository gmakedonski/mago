'use strict';

const CryptoJS = require("crypto-js"),
  crypto = require("crypto"),
  querystring = require('querystring'),
  path = require('path'),
  db = require(path.resolve('./config/lib/sequelize')),
  models = db.models,
  authenticationHandler = require(path.resolve('./modules/deviceapiv2/server/controllers/authentication.server.controller.js')),
  redis = require(path.resolve('./config/lib/redis')),
  response = require(path.resolve("./config/responses.js")),
  winston = require("winston"),
  tldjs = require('tldjs');

const mobileAppIDs = ['2', '3'];
const appIDs = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Verify auth token middleware
 */
function verifyToken(req, res, next) {
    let companyId = req.headers.company_id ? req.headers.company_id : 1;

    if (!req.app.locals.backendsettings[companyId]) {
        response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
        return;
    }

    let authParams = decodeAuth(req);

    if (!authParams) {
        response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
        return;
    }

    authParams.companyId = companyId;

    //Check plaintext auth
    if(authParams.authInBody && isplaintext(authParams.rawAuth, req.plaintext_allowed)){
        if(req.plaintext_allowed){
            let authObj = parse_plain_auth(authParams.rawAuth);
            if (!authObj) {
                response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'PLAINTEXT_TOKEN', 'no-store');
                return ;
            }

            set_screensize(authObj);
            authParams.auth = authObj;
            req.auth_obj = authObj;
            next();
        }
        else{
            response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'PLAINTEXT_TOKEN', 'no-store');
        }

        return;
    }

    //Decrypt auth async
    return decryptAuth(authParams.rawAuth, req.app.locals.backendsettings[companyId].new_encryption_key)
    .then(function(auth) {
        let authObj = querystring.parse(auth,";","=");

        //check if auth is missing params
        if (!missing_params(authObj)) {
            if(req.body.hdmi === 'true' && mobileAppIDs.indexOf(authObj.appid) !== -1) {
                response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_INSTALLATION', 'no-store'); //hdmi cannot be active for mobile devices
                return;
            }

            if (!valid_appid(authObj)) {
                response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_APPID', 'no-store');
                return;
            }

            set_screensize(authObj);

            authParams.auth = authObj;
            req.auth_obj = authObj;
            next();
        }
        else if (req.app.locals.backendsettings[companyId].key_transition == true) {
            //try to decrypt auth with old key
            return decryptAuth(authParams.rawAuth, req.app.locals.backendsettings[companyId].old_encryption_key)
            .then(function(auth) {
                let authObj = querystring.parse(auth,";","=");
                if (missing_params(authObj)) {
                    response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
                    return;
                }

                if(req.body.hdmi === 'true' && mobileAppIDs.indexOf(authObj.appid) !== -1) {
                    response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_INSTALLATION', 'no-store'); //hdmi cannot be active for mobile devices
                    return;
                }

                if (!valid_appid(authObj)) {
                    response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_APPID', 'no-store');
                    return;
                }

                set_screensize(authObj);
                authParams.auth = authObj;
                req.auth_obj = authObj;
                next();
            }).catch(function(err) {
                response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
            });
        }
        else {
            response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
        }
    }).catch(function(err) {
        response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
    });
}

/**
 * Verify authorization in database
 */
function verifyUserAccount(req, res, next) {
    let params = req.authParams;
    let auth = params.auth;

    if(req.empty_cred){
        req.auth_obj = auth;
        next();
    }
    else{
        //reading client data
        models.login_data.findOne({
            where: {username: auth.username, company_id: params.companyId}
        }).then(function (result) {
            if(result) {
                if(result.account_lock) {
                    response.send_res(req, res, [], 703, -1, 'ACCOUNT_LOCK_DESCRIPTION', 'ACCOUNT_LOCK_DATA', 'no-store');
                    return;
                }

                //the user is a normal client account. check user rights to make requests with his credentials
                if(auth.username !== 'guest') {
                    authenticationHandler.authenticateAsync(auth.password, result.salt, result.password, function(authenticated) {
                        if (authenticated === false) {
                            //Requests may come after login with account kit.
                            authenticationHandler.encryptPasswordAsync(result.username, result.salt, function(hash) {
                                if (hash !== auth.password.replace(/ /g, "+")) {
                                    response.send_res(req, res, [], 704, -1, 'WRONG_PASSWORD_DESCRIPTION', 'WRONG_PASSWORD_DATA', 'no-store');
                                    return
                                }

                                //Account kit user
                                req.thisuser = result;
                                next();
                            })
                            return
                        }

                        //Normal user was authenticated
                        req.thisuser = result;
                        next();
                    });
                }
                //login as guest is enabled and the user is guest. allow request to be processed
                else if(req.app.locals.backendsettings[params.companyId].allow_guest_login === true && auth.username === 'guest'){
                    req.thisuser = result;
                    next();
                }
                //the user is a guest account but guest login is disabled. return error message
                else {
                    response.send_res(req, res, [], 702, -1, 'GUEST_LOGIN_DISABLED_DESCRIPTION', 'GUEST_LOGIN_DISABLED_DATA', 'no-store');
                }
            }
            else response.send_res(req, res, [], 702, -1, 'USER_NOT_FOUND_DESCRIPTION', 'USER_NOT_FOUND_DATA', 'no-store');
        }).catch(function(error) {
            winston.error("Searching for the user account failed with error: ", error);
            response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
        });
    }
}

function decodeAuthMiddleware(req, res, next) {
    let authParams = decodeAuth(req);
    if (!authParams) {
        response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
        return;
    }

    next();
}

function auth_encrytp(plainText, key) {
    var C = CryptoJS;
    plainText = C.enc.Utf8.parse(plainText);
    key = C.enc.Utf8.parse(key);
    var aes = C.algo.AES.createEncryptor(key, {
        mode: C.mode.CBC,
        padding: C.pad.Pkcs7,
        iv: key
    });
    var encrypted = aes.finalize(plainText);
    return C.enc.Base64.stringify(encrypted);
}

function auth_decrypt(encryptedText, key) {
    var C = CryptoJS;
    //encryptedText = encryptedText.replace(/(\r\n|\n|\r)/gm, "");
    encryptedText = encryptedText.replace(/\\n|\\r|\n|\r/g, "");

    encryptedText = C.enc.Base64.parse(encryptedText);
    key = C.enc.Utf8.parse(key);
    var aes = C.algo.AES.createDecryptor(key, {
        mode: C.mode.CBC,
        padding: C.pad.Pkcs7,
        iv: key
    });
    var decrypted = aes.finalize(encryptedText);

    try {
        return C.enc.Utf8.stringify(decrypted);
    }
    catch(err) {
        return "error";
    }
}

function auth_decrypt1(token_string, key) {
    var C = CryptoJS;
    token_string = token_string.replace(/(,\+)/g, ',').replace(/\\r|\\n|\n|\r/g, ''); //remove all occurrences of '+' characters before each token component, remove newlines and carriage returns
    var token_object = querystring.parse(token_string,",","="); //convert token string into token object. library
    var test = token_object.auth.replace(/ /g, "+"); //handle library bug that replaces all '+' characters with spaces

    test = C.enc.Base64.parse(test);
    key = C.enc.Utf8.parse(key);
    var aes = C.algo.AES.createDecryptor(key, {
        mode: C.mode.CBC,
        padding: C.pad.Pkcs7,
        iv: key
    });
    var decrypted = aes.finalize(test);
    try {
        return C.enc.Utf8.stringify(decrypted);
    }
    catch(err) {
        return "error";
    }
}


function auth_veryfyhash(password,salt,hash) {
    var b = Buffer.from(salt, 'base64');
    var iterations = 1000;
    var clength = 24;

    const key = crypto.pbkdf2Sync(password, b, iterations, clength, 'sha1');

    return hash == winston.info(key.toString('base64'));
}

exports.plainAuth = function(req, res, next) {
    req.plaintext_allowed = true;
    req.body.language = req.get("language") || "eng";
    next();
}

exports.emptyCredentials = function(req, res, next) {
    req.empty_cred = true;
    next();
}

exports.acessOnlyFrom = function (req, res, next, urls) {
    const {getDomain} = tldjs;
    const currentUrl = req.get("host");

    const getSubDomain = getDomain(currentUrl);
    if ((urls.indexOf(currentUrl) !== -1) || (urls.indexOf(getSubDomain) !== -1)) {
        next();
    } else {
        response.send_res(req, res, [], 888, -1, 'REQUEST_FAILED', 'FORBIDDEN_DATA', 'no-store');
    }
};

exports.oneTimeAccessToken = function(req, res, next) {
    let authParams = decodeAuth(req);

    if(!authParams) {
        response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
        return;
    }

    let companyId = req.headers.companyId ? req.headers.company_id : 1;
    let redisKey = companyId + ':one_time_access_tokens:' + authParams.rawAuth;

    redis.client.get(redisKey, function(err, accessToken) {
        if (err) {
            response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
            return;
        }

        if (accessToken) {
            response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
            return;
        }

        req.isOneTimeToken = true;
        next();
    })
}

exports.oneTimeAccessTokenDRM = function (req, res, next) {
  let companyId = req.query.coid;
  let token = req.query.token;
  let redisKey = companyId + ':one_time_access_tokens:' + token;

  redis.client.get(redisKey, function (err, accessToken) {
    if (err) {
      return response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
    }

    // if exist don't allow other request with same token
    if (accessToken) {
      return response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
    }
    redis.client.set(redisKey, '1', 'EX', 300); //Expire in 5 minutes
    next();
  })
}

exports.checkBlacklistedApp = function(req, res, next) {
    let companyId = req.headers.company_id ? req.headers.company_id : 1;
    //let clientAppConfig = req.app.locals.advanced_settings[companyId].client_app;
    
    let appVersion = req.headers.appversion;
    if (!appVersion) {
        let authParams = decodeAuth(req);
        appVersion = authParams.appversion
    }

    // if (clientAppConfig.blacklist.indexOf(appVersion) != -1) {
    //     response.send_res(req, res, [], 888, -1, 'APP_VERSION_DEPRECREATED_DESCRIPTION', 'APP_VERSION_DEPRECREATED', 'no-store');
    //     return;
    // }

    next();
}

/**
 * @apiDefine header_auth
 * @apiHeader {String[]} auth Encoded client authentification token. Sample structure, after decoding:
 *
 * {api_version=22, appversion=1.1.4.2, screensize=480x800, appid=2, devicebrand=+SM-G361F+Build/LMY48B, language=eng, ntype=1, app_name=MAGOWARE, device_timezone=2, os=Linux U Android+5.1.1, auth=8yDhVenHT3Mp0O2QCLJFhCUfT73WR1mE2QRc1ZE7J22cRfmskdTmhCk9ssGWhoIBpIzoTEOLIqwl47NaUwLoLZjH1i2WRYaiioIRMqhRvH2FsSuf1YG/FoT9fEw4CrxF, hdmi=false, firmwareversion=LMY48B.G361FXXU1APB1}
 *
 */

/**
 * @apiDefine body_auth
 * @apiParam {String[]} auth Encrypted client authentification token. Sample structure, after decrypting:
 *
 *  username=chernoalpha;password=klmn;boxid=63a7240ers2a745f;appid=2;timestamp=1529422891012
 *
 */
function isAllowed(req, res, next) {
    let COMPANY_ID = req.get('company_id') || 1;
    if(req.body.isFromCompanyList) {
        COMPANY_ID = req.body.company_id;
    }

    if(req.body.auth){  //serach for auth
        var auth = decodeURIComponent(req.body.auth);
    }
    else if(req.headers.auth){ //
        var auth = decodeURIComponent(req.headers.auth);
    }
    else {
        var auth = decodeURIComponent(req.params.auth);
    }

    //

    if(req.headers.auth){

        auth = auth.replace("{","");
        auth = auth.replace("}","");

        //if language is not a body parameter, read it from header. It is used in API responses
        if(!req.body.language){
            if(querystring.parse(auth,",","=")[' language']) req.body.language = querystring.parse(auth,",","=")[' language']; //android apps add an extra space in the parameter names
            else if (querystring.parse(auth,",","=")['language']) req.body.language = querystring.parse(auth,",","=")['language']; //ios apps do not add an extra space in the parameter names
            else req.body.language = 'eng'; //the language parameter is missing, use english as default language
        }

        if(missing_params(querystring.parse(auth_decrypt1(auth,req.app.locals.backendsettings[COMPANY_ID].new_encryption_key),";","=")) === false){
            var auth_obj = querystring.parse(auth_decrypt1(auth,req.app.locals.backendsettings[COMPANY_ID].new_encryption_key),";","=");
        }
        else if(missing_params(querystring.parse(auth_decrypt1(auth,req.app.locals.backendsettings[COMPANY_ID].old_encryption_key),";","=")) === false && req.app.locals.backendsettings[COMPANY_ID].key_transition === true){
            var auth_obj = querystring.parse(auth_decrypt1(auth,req.app.locals.backendsettings[COMPANY_ID].old_encryption_key),";","=");
        }
        else {
            response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
        }
    }
    else{
        if(isplaintext(auth, req.plaintext_allowed)){
            if(req.plaintext_allowed){
                var auth_obj = parse_plain_auth(auth); //nese lejohet plaintext, ndaje dhe parsoje
            }
            else{
                response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'PLAINTEXT_TOKEN', 'no-store');
            }
        }
        else{
            if(missing_params(querystring.parse(auth_decrypt(auth,req.app.locals.backendsettings[COMPANY_ID].new_encryption_key),";","=")) === false){
                var auth_obj = querystring.parse(auth_decrypt(auth,req.app.locals.backendsettings[COMPANY_ID].new_encryption_key),";","=");
            }
            else if(missing_params(querystring.parse(auth_decrypt(auth,req.app.locals.backendsettings[COMPANY_ID].old_encryption_key),";","=")) === false && req.app.locals.backendsettings[COMPANY_ID].key_transition === true){
                var auth_obj = querystring.parse(auth_decrypt(auth,req.app.locals.backendsettings[COMPANY_ID].old_encryption_key),";","=");
            }
            else {
                response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
            }
        }
    }

    if(auth_obj){
        //Add timezone to auth object
        var timezone = querystring.parse(auth,",","=")[' device_timezone']; //android apps add an extra space in the parameter name
        if(!timezone) {
            timezone = querystring.parse(auth,",","=")['device_timezone']
            if (!timezone) {
                timezone = '0'
            }
        }
        timezone = timezone.replace(/ /g, '')
        auth_obj.device_timezone = timezone;

        if((req.body.hdmi === 'true') && (['2', '3'].indexOf(auth_obj.appid) !== -1)){
            response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_INSTALLATION', 'no-store'); //hdmi cannot be active for mobile devices
        }
        else if(valid_appid(auth_obj) === true){
            set_screensize(auth_obj);

            if(req.empty_cred){
                req.auth_obj = auth_obj;
                next();
            }
            else{
                //reading client data
                models.login_data.findOne({
                    where: {username: auth_obj.username, company_id: COMPANY_ID}
                }).then(function (result) {
                    if(result) {
                        //the user is a normal client account. check user rights to make requests with his credentials
                        if(auth_obj.username !== 'guest'){

                            //requests may come after login with account kit.
                            var hashed_once = authenticationHandler.encryptPassword(result.username, result.salt); //encrypted username
                            var identic_hashed_once = ( (hashed_once === auth_obj.password.replace(/ /g, "+"))  ) ? true : false; //login with account kit: password from app matches the encrypted username
                            var identic_pass = authenticationHandler.authenticate(auth_obj.password, result.salt, result.password); //standard login: encrypted password from app matches the encrypted password in the database

                            if(result.account_lock) {
                                response.send_res(req, res, [], 703, -1, 'ACCOUNT_LOCK_DESCRIPTION', 'ACCOUNT_LOCK_DATA', 'no-store');
                            }
                            else if(!identic_hashed_once && !identic_pass) { //check for requests from account kit or from standard login
                                response.send_res(req, res, [], 704, -1, 'WRONG_PASSWORD_DESCRIPTION', 'WRONG_PASSWORD_DATA', 'no-store');
                            }
                            //todo: for requests with account kit, email confirmation ought to be ignored. for other requests it should be considered
                            /*else if( (result.resetPasswordExpires !== null ) && (result.resetPasswordExpires.length > 9 && result.resetPasswordExpires !== '0') ){
                             response.send_res(req, res, [], 704, -1, 'EMAIL_NOT_CONFIRMED', 'EMAIL_NOT_CONFIRMED_DESC', 'no-store');
                             }*/
                            else {
                                req.thisuser = result;
                                req.auth_obj = auth_obj;
                                next();
                                return null; //returns promise
                            }
                        }
                        //login as guest is enabled and the user is guest. allow request to be processed
                        else if( (auth_obj.username === 'guest') && (req.app.locals.backendsettings[COMPANY_ID].allow_guest_login === true) ){
                            req.thisuser = result;
                            req.auth_obj = auth_obj;
                            next();
                            return null; //returns promise
                        }
                        //the user is a guest account but guest login is disabled. return error message
                        else response.send_res(req, res, [], 702, -1, 'GUEST_LOGIN_DISABLED_DESCRIPTION', 'GUEST_LOGIN_DISABLED_DATA', 'no-store');
                    }
                    else response.send_res(req, res, [], 702, -1, 'USER_NOT_FOUND_DESCRIPTION', 'USER_NOT_FOUND_DATA', 'no-store');
                }).catch(function(error) {
                    winston.error("Searching for the user account failed with error: ", error);
                    response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
                });
            }
        }
        else {
            response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_APPID', 'no-store');
        }

    }
};

function isAllowedAsync(req, res, next) {
    let companyId = req.headers.company_id || 1;

    if (req.body.isFromCompanyList) {
        companyId = req.body.company_id;
    }

    if (!req.app.locals.backendsettings[companyId]) {
        response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
        return;
    }

    //Retrieve encoded auth from body, auth header or params
    let authParams = decodeAuth(req);

    if (!authParams) {
        //Auth was not sent neither in plain text nor encrypted
        response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
        return;
    }

    authParams.companyId = companyId;

    if (!req.body.language) {
        if (authParams[' language']) {
            //Android adds an space to in the parameter names
            req.body.language = authParams[' language'];
        }
        else if (authParams['language']) {
            req.body.language = authParams['language'];
        }
        else {
            req.body.language = 'eng'
        }
    }

    if (authParams.authInBody) {
        //Check plaintext auth
        if(isplaintext(authParams.rawAuth, req.plaintext_allowed)){
            if(req.plaintext_allowed){
                //call verifyAuth
                let authObj = parse_plain_auth(authParams.rawAuth);
                if (!authObj) {
                    response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'PLAINTEXT_TOKEN', 'no-store');
                    return ;
                }

                authObj.companyId = companyId;
                verifyAuth(req, res, next, authObj, authObj);
            }
            else{
                response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'PLAINTEXT_TOKEN', 'no-store');
            }

            return;
        }
    }

    //Decrypt auth async
    return decryptAuth(authParams.rawAuth, req.app.locals.backendsettings[companyId].new_encryption_key)
      .then(function(auth) {
          let authObj = querystring.parse(auth,";","=");
          authParams.token = authObj;

          //check if auth is missing params
          if (!missing_params(authObj)) {
              //call verifyAuth
              verifyAuth(req, res, next, authObj, authParams);
          }
          else if (req.app.locals.backendsettings[companyId].key_transition == true) {
              //try to decrypt auth with old key
              return decryptAuth(authParams.rawAuth, req.app.locals.backendsettings[companyId].old_encryption_key)
                .then(function(auth) {
                    let authObj = querystring.parse(auth,";","=");
                    authParams.token = authObj;
                    if (missing_params(authObj)) {
                        response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
                        return;
                    }

                    //call verifyAuth
                    verifyAuth(req, res, next, authObj, authParams);
                }).catch(function(err) {
                    response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
                });
          }
          else {
              response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
          }
      }).catch(function(err) {
          response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
      });
};

//Verifies token and load parameters from auth
function verifyAuth(req, res, next, auth, params) {
    if(req.body.hdmi === 'true' && mobileAppIDs.indexOf(auth.appid) !== -1) {
        response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_INSTALLATION', 'no-store'); //hdmi cannot be active for mobile devices
    } else if (valid_appid(auth) === true) {
        if (req.isOneTimeToken && params.rawAuth) {
            let redisKey = params.companyId + ':one_time_access_tokens:' + params.rawAuth;
            redis.client.set(redisKey, '1', 'EX', 1800); //Expire in 2 minutes
        }

        set_screensize(auth);

        if (req.empty_cred) {
            req.auth_obj = auth;
            next();
        } else {
            //reading client data
            models.login_data.findOne({
                where: {username: auth.username, company_id: params.companyId}
            }).then(function (result) {
                if (result) {
                    if (result.account_lock) {
                        response.send_res(req, res, [], 703, -1, 'ACCOUNT_LOCK_DESCRIPTION', 'ACCOUNT_LOCK_DATA', 'no-store');
                        return;
                    }

                    if (result.verified === false) {
                        response.send_res(req, res, [], 704, -1, 'EMAIL_NOT_CONFIRMED', 'EMAIL_NOT_CONFIRMED_DESC', 'no-store');
                        return;
                    }


                    //the user is a normal client account. check user rights to make requests with his credentials
                    if (auth.username !== 'guest') {
                        authenticationHandler.authenticateAsync(auth.password, result.salt, result.password, function (authenticated) {
                            if (authenticated === false) {
                                //Requests may come after login with account kit.
                                authenticationHandler.encryptPasswordAsync(result.username, result.salt, function (hash) {
                                    if (hash !== auth.password.replace(/ /g, "+")) {
                                        response.send_res(req, res, [], 704, -1, 'WRONG_PASSWORD_DESCRIPTION', 'WRONG_PASSWORD_DATA', 'no-store');
                                        return
                                    }

                                    //Account kit user
                                    req.thisuser = result;
                                    req.auth_obj = auth;
                                    next();
                                })
                                return
                            }
                            //Normal user was authenticated
                            req.thisuser = result;
                            req.auth_obj = auth;
                            next();
                        });
                    }
                    //login as guest is enabled and the user is guest. allow request to be processed
                    else if (req.app.locals.backendsettings[params.companyId].allow_guest_login === true && auth.username === 'guest') {
                        req.thisuser = result;
                        req.auth_obj = auth;
                        next();
                    }
                    //the user is a guest account but guest login is disabled. return error message
                    else {
                        response.send_res(req, res, [], 702, -1, 'GUEST_LOGIN_DISABLED_DESCRIPTION', 'GUEST_LOGIN_DISABLED_DATA', 'no-store');
                    }
                }
                else response.send_res(req, res, [], 702, -1, 'USER_NOT_FOUND_DESCRIPTION', 'USER_NOT_FOUND_DATA', 'no-store');
            }).catch(function(error) {
                winston.error("Searching for the user account failed with error: ", error);
                response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'DATABASE_ERROR_DATA', 'no-store');
            });
        }
    }
    else {
        response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_APPID', 'no-store');
    }
}

function decodeAuth(req) {
    if (req.authParams) {
        return req.authParams;
    }

    let authParams = null;

    try {
        if (req.headers.auth) {
            let authEncoded = decodeURIComponent(req.headers.auth);
            authEncoded = authEncoded.replace(/[{}]/g, '');

            //Parse auth parameters to object
            authParams = querystring.parse(authEncoded, ",", "=");
            if (authParams[' auth']) {
                authParams = removeLeadingKeySpaces(authParams);
                authParams.rawAuth = authParams['auth'];
            }
            else if (authParams['auth']) {
                authParams.rawAuth = authParams['auth']
            }
            else {
                return null;
            }
        }
        else if (req.body.auth) {
            let rawAuth = decodeURIComponent(req.body.auth);
            authParams = {
                rawAuth: rawAuth
            };

            Object.assign(authParams, req.body);
            authParams.authInBody = true;
        }
        else {
            return null;
        }
    }
    catch(e) {
        return null;
    }

    authParams.rawAuth = authParams.rawAuth.replace(/(,\+)/g, ',').replace(/\\r|\\n|\n|\r/g, ''); //remove all occurrences of '+' characters before each token component, remove newlines and carriage returns
    authParams.rawAuth = authParams.rawAuth.replace(/ /g, "+")

    //Load required parameters to body
    if (!req.body.language) {
        if (authParams['language']) {
            req.body.language = authParams['language'];
        }
        else {
            req.body.language = 'eng'
        }
    }
    req.authParams = authParams;

    return req.authParams;
}

function removeLeadingKeySpaces(obj) {
    let newObj = {};
    let keys = Object.keys(obj);

    keys.forEach(function(key){
        let newKey = key.trimLeft();
        newObj[newKey] = obj[key];
    });

    return newObj;
}

function decryptAuth(auth, key) {
    return new Promise(function(resolve, reject) {
        let iv = Buffer.alloc(key.length, key);

        decryptAsync(key, iv, auth, function(err, plain) {
            if (err) {
                reject(err);
                return;
            }
            resolve(plain);
        })
    })
}

// crypto - native Node.js APIs
function decryptAsync(key, iv, cipherText, callback) {
    try {
        key = Buffer.from(key);
        cipherText = Buffer.from(cipherText, 'base64');

        const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
        let decrypted = decipher.update(cipherText).toString('utf8');
        decrypted += decipher.final('utf8');
        callback(undefined, decrypted);
    } catch (error) {
        return callback(error);
    }
}

function expiryToken(req, res, next) {
    /*if((Math.abs(Date.now() - req.authParams.auth.timestamp)) > 120000) {
        response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TIMESTAMP', 'no-store');
        return;
    }*/

    if (req.isOneTimeToken && req.authParams.rawAuth) {
        let redisKey = req.authParams.companyId + ':one_time_access_tokens:' + req.authParams.rawAuth;
        redis.client.set(redisKey, '1', 'EX', 1800); //Expire in 2 minutes
    }

    next();
}

function missing_params(auth_obj){
    if(auth_obj.username == undefined || auth_obj.password == undefined || auth_obj.appid == undefined || auth_obj.boxid == undefined || auth_obj.timestamp == undefined) return true;
    else return false;
}

function valid_appid(auth_obj){
    if(appIDs.indexOf(auth_obj.appid) === -1) return false;
    else return true;
}
function set_screensize(auth_obj){
    if(mobileAppIDs.indexOf(auth_obj.appid) !== -1) {
        auth_obj.screensize = 2;
    }
    else {
        auth_obj.screensize = 1;
    }
}
function isplaintext(auth, plaintext_allowed){
    var auth_obj = parse_plain_auth(auth);
    if(auth_obj.username && auth_obj.password && auth_obj.appid && auth_obj.boxid && auth_obj.timestamp){
        return true;
    }
    else if(auth_obj.hasOwnProperty('username') && auth_obj.hasOwnProperty('password') && auth_obj.appid && auth_obj.boxid && auth_obj.timestamp && plaintext_allowed){
        return true;
    }
    else{
        return false;
    }
}

function parse_plain_auth(auth){
    var final_auth = {};
    var auth_array = auth.split(";");
    for(var i=0; i<auth_array.length; i++){
        let dl = auth_array[i].indexOf('=');
        let key = auth_array[i].substring(0, dl);
        var value = auth_array[i].substring(dl + 1, auth_array[i].length);
        final_auth[key] = value;
    }
    return final_auth;
}

//======================================================================================================================


//verifies if token/auth is valid
exports.isAuthTokenValid = function(req, res, next) {
    //IF COMPANY ID IS MISSING, THEN ASSIGN THE DEFAULT ONE: company_id = 1
    let COMPANY_ID = req.get('company_id') || 1;

    if(req.body.auth){  //serach for auth parameter on post data
        //auth is in header, as an object with all parameters
        var auth = decodeURIComponent(req.body.auth);
    }
    else if(req.headers.auth){ //search for auth paramter in headers
        var auth = decodeURIComponent(req.headers.auth);
        //some ios version was adding extra "{}"
        auth = auth.replace("{","");
        auth = auth.replace("}","");
        auth = auth.replace(/(,\+)/g, ',').replace(/\\r|\\n|\n|\r/g, ''); //remove all occurrences of '+' characters before each token component, remove newlines and carriage returns
        let tmp_object = querystring.parse(auth,",","="); //convert token string into token object. library
        if(tmp_object.auth) {
            auth = tmp_object.auth.replace(/ /g, "+"); //handle library bug that replaces all '+' characters with spaces
        }
    }
    else if(req.params.auth) { //search for auth paremter in query parameters
        var auth = decodeURIComponent(req.params.auth);
    }
    else {
        //auth parameter not found
        response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
        return;
    }

    //verify and extract auth object
    if(isplaintext(auth, req.plaintext_allowed)){
        //auth object is plain text
        var auth_obj = querystring.parse(auth,";","=");
    }
    else {
        //auth object is encrypted, key is unknown, try with company_id = 1
        var auth_obj = querystring.parse(auth_decrypt(auth,req.app.locals.backendsettings[COMPANY_ID].new_encryption_key),";","="); //todo: fix static company_id
        //try old key
        if(missing_params(auth_obj)){
            auth_obj = querystring.parse(auth_decrypt(auth,req.app.locals.backendsettings[COMPANY_ID].old_encryption_key),";","="); //todo: fix static company_id
        }
    }

    //if auth_obj is missing any of the five parameters, then token could not be decrypted.
    if(missing_params(auth_obj)){
        response.send_res(req, res, [], 889, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_TOKEN', 'no-store');
    }
    else {
        //controls if mobile app is using HDMI
        if((req.body.hdmi === 'true') && (['2', '3'].indexOf(auth_obj.appid) !== -1)){
            response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_INSTALLATION', 'no-store'); //hdmi cannot be active for mobile devices
        }
        //controls if appid is a valid number
        else if(valid_appid(auth_obj) === true){
            set_screensize(auth_obj);
            req.auth_obj = auth_obj;
            next();
            return null; //returns promise
        }
        else {
            response.send_res(req, res, [], 888, -1, 'BAD_TOKEN_DESCRIPTION', 'INVALID_APPID', 'no-store');
        }
    }
};


exports.decryptAuth = decryptAuth;
//Old isAllowed
//exports.isAllowed = isAllowed;
exports.isAllowed = isAllowedAsync;
exports.expiryToken = expiryToken;
exports.decodeAuth = decodeAuthMiddleware;
exports.verifyToken = verifyToken;
exports.verifyUserAccount = verifyUserAccount;

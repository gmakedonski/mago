'use strict';
var path = require('path'),
    db = require(path.resolve('./config/lib/sequelize')),
    response = require(path.resolve("./config/responses.js")),
    winston = require(path.resolve('./config/lib/winston')),
    crypto = require('crypto'),
    CryptoJS  = require('crypto-js'),
    models = db.models;



/**
 * @returns returns a random salt
 */
function makesalt(){
    return crypto.randomBytes(16).toString('base64');
}

/**
 * @param {String} password The plaintext password
 * @param {string} salt The salt
 * @returns returns encrypted value of the plaintext password, with the given salt
 */
function encryptPassword(password, salt) {
     if (!password || !salt)
     return '';
     salt = Buffer.from(salt, 'base64');
     return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha1').toString('base64'); //at least 640000 times is suggested, will see later
}

//compares db password with the password that the client sends, by encryting it with the db salt
function authenticate(plainTextPassword, salt, dbPassword) {
    if(encryptPassword(plainTextPassword, salt) === dbPassword){
        return true;
    }
    else{
        return false;
    }
}

//used by customer_app/changepassword for the ios application
function pass_decrypt(encryptedText, key) {
    var C = CryptoJS;
    encryptedText = encryptedText.replace(/(\r\n|\n|\r)/gm, "");
    //encryptedText = encryptedText.replace(/\\n|\\r|\n|\r/g, "");

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
};

function encryptPasswordAsync(password, salt, callback) {
    if(!password || ! salt) {
        callback('');
        return;
    }

    salt = Buffer.from(salt, 'base64');
    crypto.pbkdf2(password, salt, 10000, 64, 'sha1', function(err, derivedKey) {
        if (err) {
            callback('');
            return;
        }

        callback(derivedKey.toString('base64'))
    });
}

function authenticateAsync(password, salt, hashedPassword, callback) {
    encryptPasswordAsync(password, salt, function(hash) {
        if (hash === hashedPassword) {
            callback(true);
        } else {
            callback(false);
        }
    });
}
module.exports = {
    makesalt: makesalt,
    encryptPassword: encryptPassword,
    authenticate: authenticate,
    decryptPassword: pass_decrypt,
    encryptPasswordAsync: encryptPasswordAsync,
    authenticateAsync: authenticateAsync
}
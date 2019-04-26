// const fs = require('fs');
const fs = require('fs');
const fsPromises = require('fs').promises;
const readline = require('readline');
const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-sub-lister.json';

let GoogleService = function() {
}

// GoogleService.prototype.init = function(callback) {
GoogleService.prototype.login = function() {
    // Load client secrets from a local file.
    /* fs.readFile('client_secret.json', (err, content) => {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the YouTube API.
        // authorize(JSON.parse(content), getChannel);
        this.authorize(JSON.parse(content), callback);
    }); */
    return fsPromises.readFile('client_secret.json')
        .then(content => {
            // Authorize a client with the loaded credentials, then call the YouTube API.
            // authorize(JSON.parse(content), getChannel);
            return this.authorize(JSON.parse(content));
        })
        .catch(err => {
            console.log('Error loading client secret file: ' + err);
        });
};

/**
* Create an OAuth2 client with the given credentials, and then execute the
* given callback function.
*
* @param {Object} credentials The authorization client credentials.
* @param {function} callback The callback to call with the authorized client.
*/
// GoogleService.prototype.authorize = function(credentials, callback) {
GoogleService.prototype.authorize = function(credentials) {
    var clientSecret = credentials.web.client_secret;
    var clientId = credentials.web.client_id;
    var redirectUrl = credentials.web.redirect_uris[0];
    var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    
    // Check if we have previously stored a token.
    /* fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            this.getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            this.auth = oauth2Client;
            callback();
        }
    }); */
    return fsPromises.readFile(TOKEN_PATH)
        .then(token => {
            oauth2Client.credentials = JSON.parse(token);
            return oauth2Client;
        })
        .catch(() => {
            return this.getNewToken(oauth2Client);
        });
}

/**
* Get and store new token after prompting for user authorization, and then
* execute the given callback with the authorized OAuth2 client.
*
* @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
* @param {getEventsCallback} callback The callback to call with the authorized
*     client.
*/
// GoogleService.prototype.getNewToken = function(oauth2Client, callback) {
GoogleService.prototype.getNewToken = function(oauth2Client) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });

    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    /* rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oauth2Client.getToken(code, (err, token) => {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            this.storeToken(token);
            auth = oauth2Client;
            callback();
        });
    }); */

    return new Promise((resolve) => {
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            (new Promise((resolve, reject) => {
                oauth2Client.getToken(code, (err, token) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(token);
                });
            }))
            .then(token => {
                oauth2Client.credentials = token;
                this.storeToken(token);
                resolve(oauth2Client);
            }).catch(err => {
                console.log('Error while trying to retrieve access token', err);
            });
            
        });
    });
}

/**
* Store token to disk be used in later program executions.
*
* @param {Object} token The token to store to disk.
*/
GoogleService.prototype.storeToken = function(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }

    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) throw err;
        console.log('Token stored to ' + TOKEN_PATH);
    });
};

module.exports = new GoogleService();
var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'youtube-nodejs-quickstart.json';

var service = google.youtube('v3');
var auth, 
    subscriptions = null,
    channels = [],
    videos = [];

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the YouTube API.
    // authorize(JSON.parse(content), getChannel);
    authorize(JSON.parse(content), getSubscriptions);
});

/**
* Create an OAuth2 client with the given credentials, and then execute the
* given callback function.
*
* @param {Object} credentials The authorization client credentials.
* @param {function} callback The callback to call with the authorized client.
*/
function authorize(credentials, callback) {
    var clientSecret = credentials.web.client_secret;
    var clientId = credentials.web.client_id;
    var redirectUrl = credentials.web.redirect_uris[0];
    var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            auth = oauth2Client;
            callback();
        }
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
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            auth = oauth2Client;
            callback();
        });
    });
}

/**
* Store token to disk be used in later program executions.
*
* @param {Object} token The token to store to disk.
*/
function storeToken(token) {
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
    console.log('Token stored to ' + TOKEN_PATH);
}

/**
* Lists the names and IDs of up to 10 files.
*
* @param {google.auth.OAuth2} auth An authorized OAuth2 client.
*/
function getChannel(pageToken) {
    var service = google.youtube('v3');
    service.channels.list({
        auth: auth,
        part: 'snippet,contentDetails,statistics',
        forUsername: 'GoogleDevelopers'
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var channels = response.data.items;
        if (channels.length == 0) {
            console.log('No channel found.');
        } else {
            console.log('This channel\'s ID is %s. Its title is \'%s\', and ' +
            'it has %s views.',
            channels[0].id,
            channels[0].snippet.title,
            channels[0].statistics.viewCount);
        }
    });
}

function getSubscriptions(pageToken) {
    return service.subscriptions.list({
        auth: auth,
        // "part": "snippet,contentDetails",
        part: "snippet",
        "maxResults": 50,
        "pageToken": pageToken,
        "mine": true
    })
    .then(response => {
        if(!subscriptions)
            subscriptions = response.data.items;
        else
            subscriptions = subscriptions.concat(response.data.items);

        if(response.data.nextPageToken)
            getSubscriptions(response.data.nextPageToken);
        else {
            console.log('Amount of subscriptions is: %s.', subscriptions.length);

            getChannelsInfo();
        }
    })
    .catch(error => {
        console.error(error);
        console.log('The API returned an error: ' + error);
    });
}

function getChannelsInfo() {
    let promises = [];
    subscriptions.forEach(({snippet}) => {
        // console.log('Loading info for channel: ' + snippet.title);
        promises.push(getChannelInfo(snippet.resourceId.channelId));
    });
    Promise.all(promises)
        .then(function() {
            console.log("Done loading channels' info");
            getPlaylistsItems();
        })
        .catch(function(err) {
            console.error("Execute error", err); 
        });
}

function getChannelInfo(channelId) {
    return service.channels.list({
        auth: auth,
        // "part": "snippet,contentDetails,statistics",
        "part": "contentDetails",
        "id": channelId
    })
    .then(function(response) {
        channels.push(response.data.items[0]);
    })
    .catch(function(err) { 
        console.error("Execute error", err); 
    });
}

function getPlaylistsItems() {
    let promises = [];
    channels.forEach((channel) => {
        promises.push(getPlaylistItems(channel.contentDetails.relatedPlaylists.uploads));
    });
    Promise.all(promises)
        .then(function() {
            console.log("Done loading videos' info");
            sortVideos();

            console.log(videos.slice(0,4));
        })
        .catch(function(err) {
            console.error("Execute error", err); 
        });
}

function getPlaylistItems(playlistId) {
    return service.playlistItems.list({
        auth: auth,
        // "part": "snippet,contentDetails",
        "part": "snippet",
        "maxResults": 25,
        playlistId
    })
    .then(function(response) {
        videos = videos.concat(response.data.items);
    })
    .catch(function(err) { 
        console.error("Execute error", err); 
    });
}

function sortVideos() {
    videos.sort((a,b) => {
        let aDate = a.snippet.publishedAt;
        let bDate = b.snippet.publishedAt;
        if(aDate > bDate)
            return -1;
        else if(aDate < bDate)
            return 1;

        return 0;
    });
}

/*var http = require("http");

//create a server object:
http
    .createServer(function(req, res) {
        switch(req.url) {
            case '/': {
                res.end('<h1>Teste</h1>');
                break;
            }
            default:
                res.statusCode = 404;
        }

        res.end(); //end the response
    })
    .listen(80); //the server object listens on port 8080*/

/* async function runSample() {
    const res = await blogger.blogs.get(params);
    console.log(`The blog url is ${res.data.url}`);
}
runSample().catch(console.error); */
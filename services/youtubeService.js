const {google} = require('googleapis');

let YoutubeService = function() {
    this.service = google.youtube('v3');

    this.auth = null;
    this.subscriptions = null;
    this.channels = [];
    this.videos = [];
};

YoutubeService.prototype.setAuth = function(auth) {
    this.auth = auth;
};

YoutubeService.prototype.getSubscriptions = function(pageToken) {
    return this.service.subscriptions.list({
        auth: this.auth,
        // "part": "snippet,contentDetails",
        part: "snippet",
        "maxResults": 50,
        "pageToken": pageToken,
        "mine": true
    })
    .then(response => {
        if(!this.subscriptions)
            this.subscriptions = response.data.items;
        else
            this.subscriptions = this.subscriptions.concat(response.data.items);

        if(response.data.nextPageToken)
            this.getSubscriptions(response.data.nextPageToken);
        else {
            console.log('Amount of subscriptions is: %s.', this.subscriptions.length);

            this.getChannelsInfo();
        }
    })
    .catch(error => {
        console.error(error);
        console.log('The API returned an error: ' + error);
    });
};

YoutubeService.prototype.getChannelsInfo = function() {
    let promises = [];
    this.subscriptions.forEach(({snippet}) => {
        // console.log('Loading info for channel: ' + snippet.title);
        promises.push(this.getChannelInfo(snippet.resourceId.channelId));
    });

    Promise.all(promises)
        .then(() => {
            console.log("Done loading channels' info");
            this.getPlaylistsItems();
        })
        .catch((err) => {
            console.error("Execute error", err); 
        });
};

YoutubeService.prototype.getChannelInfo = function(channelId) {
    return this.service.channels.list({
        auth: this.auth,
        // "part": "snippet,contentDetails,statistics",
        "part": "contentDetails",
        "id": channelId
    })
    .then((response) => {
        this.channels.push(response.data.items[0]);
    })
    .catch((err) => { 
        console.error("Execute error", err); 
    });
};

YoutubeService.prototype.getPlaylistsItems = function() {
    let promises = [];
    this.channels.forEach((channel) => {
        promises.push(this.getPlaylistItems(channel.contentDetails.relatedPlaylists.uploads));
    });

    Promise.all(promises)
        .then(() => {
            console.log("Done loading videos' info");
            this.sortVideos();

            console.log(this.videos.slice(0,4));
        })
        .catch((err) => {
            console.error("Execute error", err); 
        });
};

YoutubeService.prototype.getPlaylistItems = function(playlistId) {
    return this.service.playlistItems.list({
        auth: this.auth,
        // "part": "snippet,contentDetails",
        "part": "snippet",
        "maxResults": 25,
        playlistId
    })
    .then((response) => {
        this.videos = this.videos.concat(response.data.items);
    })
    .catch((err) => { 
        console.error("Execute error", err); 
    });
};

YoutubeService.prototype.sortVideos = function() {
    this.videos.sort((a,b) => {
        let aDate = a.snippet.publishedAt;
        let bDate = b.snippet.publishedAt;
        if(aDate > bDate)
            return -1;
        else if(aDate < bDate)
            return 1;

        return 0;
    });
};

module.exports = new YoutubeService();
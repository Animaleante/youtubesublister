const {google} = require('googleapis');

let YoutubeService = function() {
    this.service = google.youtube('v3');

    this.auth = null;
    this.sqlService = null;

    this.subscriptions = null;
    this.channels = [];
    this.videos = [];
};

YoutubeService.prototype.setAuth = function(auth) {
    this.auth = auth;
};

YoutubeService.prototype.setDbService = function(sqlService) {
    this.sqlService = sqlService;
};

YoutubeService.prototype.getSubscriptions = function(pageToken) {
    return this.service.subscriptions.list({
        auth: this.auth,
        'maxResults': 50,
        'mine': true,
        pageToken,
        // 'part': 'snippet,contentDetails',
        'part': 'snippet'
    })
    .then(response => {
        if (!this.subscriptions) this.subscriptions = response.data.items;
        else this.subscriptions = this.subscriptions.concat(response.data.items);

        if (response.data.nextPageToken) this.getSubscriptions(response.data.nextPageToken);
        else {
            console.log('Amount of subscriptions is: %s.', this.subscriptions.length);

            this.sqlService.insertMultSubscriptions(this.subscriptions);
            this.getChannelsInfo();
        }
    })
    .catch(error => {
        console.error(error);
        console.error('The API returned an error: ' + error);
    });
};

YoutubeService.prototype.getChannelsInfo = function() {
    let promises = [];

    this.subscriptions.forEach((subscription) => {
        promises.push(this.getChannelInfo(subscription.snippet.resourceId.channelId));
    });

    Promise.all(promises)
        .then(() => {
            console.log('Done loading channels\' info');
            this.getPlaylistsItems();
        })
        .catch((err) => {
            console.error('Execute error', err); 
        });
};

YoutubeService.prototype.getChannelInfo = function(channelId) {
    return this.service.channels.list({
        auth: this.auth,
        'id': channelId,
        // 'part': 'snippet,contentDetails,statistics',
        'part': 'snippet,contentDetails'
    })
    .then((response) => {
        this.channels.push(response.data.items[0]);
        this.sqlService.insertChannel(response.data.items[0]);
    })
    .catch((err) => { 
        console.error('Execute error', err); 
    });
};

YoutubeService.prototype.getPlaylistsItems = function() {
    let promises = [];

    this.channels.forEach((channel) => {
        promises.push(this.getPlaylistItems(channel.contentDetails.relatedPlaylists.uploads));
    });

    Promise.all(promises)
        .then(() => {
            console.log('Done loading videos\' info');
            this.sortVideos();

            this.videos.forEach((video) => {
                this.sqlService.insertVideo(video);
            });

            // console.log(this.videos.slice(0, 4));
        })
        .catch((err) => {
            console.error('Execute error', err); 
        });
};

YoutubeService.prototype.getPlaylistItems = function(playlistId) {
    return this.service.playlistItems.list({
        auth: this.auth,
        'maxResults': 25,
        // 'part': 'snippet,contentDetails',
        'part': 'snippet',
        playlistId
    })
    .then((response) => {
        this.videos = this.videos.concat(response.data.items);
    })
    .catch((err) => { 
        console.error('Execute error', err); 
    });
};

YoutubeService.prototype.sortVideos = function() {
    this.videos.sort((a, b) => {
        let aDate = a.snippet.publishedAt;
        let bDate = b.snippet.publishedAt;

        if (aDate > bDate) return -1;
        else if (aDate < bDate) return 1;

        return 0;
    });
};

module.exports = new YoutubeService();
const sqlite3 = require('sqlite3').verbose();

let SQliteService = function() {
    this.dbPath = null;
};

SQliteService.prototype.init = function(path = null) {
    this.dbPath = path;
    let db = this.getDB();

    this.createTables(db);
        
    db.close();
};

SQliteService.prototype.getInMemoryDB = function() {
    return new sqlite3.Database(':memory:', (err) => {
        if (err) return console.error(err.message);

        // console.log('Connected to the in-memory SQlite database');
    });
};

SQliteService.prototype.getFileDB = function(path) {
    return new sqlite3.Database(path, (err) => {
        if (err) return console.error(err.message);

        // console.log('Connected to the in-memory SQlite database');
    });
};

SQliteService.prototype.getDB = function() {
    if (this.dbPath) return this.getFileDB(this.dbPath);
    return this.getInMemoryDB();
};

SQliteService.prototype.createTables = function(db) {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS channels (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                slug TEXT,
                upload_playlist TEXT NOT NULL,
                published_at TEXT NOT NULL,
                thumb_default TEXT NOT NULL,
                thumb_medium TEXT NOT NULL,
                thumb_high TEXT NOT NULL
        )`)
          .run(`CREATE TABLE IF NOT EXISTS subscriptions (
                id TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                FOREIGN KEY (channel_id) REFERENCES channels (id)
                ON DELETE CASCADE ON UPDATE NO ACTION
        )`)
          .run(`CREATE TABLE IF NOT EXISTS videos (
                id TEXT PRIMARY KEY,
                channel_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                published_at TEXT NOT NULL,
                thumb_default TEXT NOT NULL,
                thumb_medium TEXT NOT NULL,
                thumb_high TEXT NOT NULL,
                thumb_standard TEXT,
                thumb_maxres TEXT,
                FOREIGN KEY (channel_id) REFERENCES channels (id)
                ON DELETE CASCADE ON UPDATE NO ACTION
        )`);
    });
};

SQliteService.prototype.insertMultSubscriptions = function(subscriptionsInfo) {
    let db = this.getDB();
    let placeholders = subscriptionsInfo.map(() => '(?,?)').join(',');
    let subscriptions = subscriptionsInfo.map((subscription) => [
        subscription.id,
        subscription.snippet.resourceId.channelId
    ]);

    db.serialize(() => {
        db.run('DELETE FROM subscriptions')
          .run(`INSERT INTO subscriptions 
                (id, channel_id)
                VALUES ${placeholders}`, [].concat.apply([], subscriptions));
    });
    db.close();
};

SQliteService.prototype.insertSubscription = function(subscriptionInfo) {
    let db = this.getDB();

    db.run(`INSERT INTO subscriptions 
        (id, channel_id)
        VALUES (?,?)`, [
            subscriptionInfo.id,
            subscriptionInfo.snippet.resourceId.channelId
        ], (err) => {
            if (err) {
                console.error(err);
                console.log(subscriptionInfo);
            }
        });

    db.close();
};

SQliteService.prototype.insertChannel = function(channelInfo) {
    let db = this.getDB();

    db.run(
        `INSERT INTO channels 
        (id, title, description, slug, published_at, upload_playlist, thumb_default, thumb_medium, thumb_high)
        VALUES (?,?,?,?,?,?,?,?,?)`, [
            channelInfo.id,
            channelInfo.snippet.title,
            channelInfo.snippet.description,
            channelInfo.snippet.customUrl,
            channelInfo.snippet.publishedAt,
            channelInfo.contentDetails.relatedPlaylists.uploads,
            channelInfo.snippet.thumbnails.default.url,
            channelInfo.snippet.thumbnails.medium.url,
            channelInfo.snippet.thumbnails.high.url
        ], 
        (err) => {
            if (err) {
                console.error(err);
                console.log(channelInfo);
            }
        }
    );

    db.close();
};

SQliteService.prototype.insertVideo = function(videoInfo) {
    let db = this.getDB();

    try {
        db.run(`INSERT INTO videos 
        (id, channel_id, title, description, published_at, thumb_default, thumb_medium, thumb_high, thumb_standard, thumb_maxres) 
        VALUES (?,?,?,?,?,?,?,?,?,?)`, [
            videoInfo.snippet.resourceId.videoId,
            videoInfo.snippet.channelId,
            videoInfo.snippet.title,
            videoInfo.snippet.description,
            videoInfo.snippet.publishedAt,
            videoInfo.snippet.thumbnails.default.url,
            videoInfo.snippet.thumbnails.medium.url,
            videoInfo.snippet.thumbnails.high.url,
            videoInfo.snippet.thumbnails.standard
                ? videoInfo.snippet.thumbnails.standard.url 
                : null,
            videoInfo.snippet.thumbnails.maxres 
                ? videoInfo.snippet.thumbnails.maxres.url 
                : null
        ], (err) => {
            if (err) {
                console.error(err);
                console.log(videoInfo);
            }
        });

        db.close();
    } catch (err) {
        console.error(err);
        console.log(videoInfo);
    }
};

module.exports = new SQliteService();
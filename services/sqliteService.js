const sqlite3 = require('sqlite3').verbose();

let SQliteService = function() {
    // this.db = this.getInMemoryDB();
    this.db = this.getFileDB('./db/test.db');
    
    this.db.serialize(() => {
        this.db.run('CREATE TABLE lorem (info TEXT)');
        
        let stmt = this.db.prepare('INSERT INTO lorem VALUES (?)');

        for (let i = 0; i < 10; i++) {
            stmt.run('Ipsum ' + i);
        }
        stmt.finalize();
        
        this.db.each('SELECT rowid AS id, info FROM lorem', (err, row) => {
            console.log(row.id + ': ' + row.info);
        });
    });
    
    this.db.close((err) => {
        if (err) console.error(err.message);
        
        console.log('Closed the database connection');
    });
};

SQliteService.prototype.getInMemoryDB = function() {
    return new sqlite3.Database(':memory:', (err) => {
        if (err) return console.error(err.message);

        console.log('Connected to the in-memory SQlite database');
    });
};

SQliteService.prototype.getFileDB = function(path) {
    return new sqlite3.Database(path, (err) => {
        if (err) return console.error(err.message);

        console.log('Connected to the in-memory SQlite database');
    });
};

module.exports = new SQliteService();
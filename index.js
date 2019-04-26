const gService = require('./services/googleService');
const ytService = require('./services/youtubeService');
const sqlService = require('./services/sqliteService');

sqlService.init('./db/test.db');

gService.login().then(auth => {
    ytService.setAuth(auth);
    ytService.setDbService(sqlService);
    ytService.getSubscriptions();        
});


/*
async function runSample() {
    const res = await blogger.blogs.get(params);
    console.log(`The blog url is ${res.data.url}`);
}
runSample().catch(console.error);*/
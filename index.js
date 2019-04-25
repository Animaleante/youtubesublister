const gService = require('./services/googleService');
const ytService = require('./services/youtubeService');

gService.login().then(auth => {
    ytService.setAuth(auth);
    ytService.getSubscriptions();        
});

/*async function runSample() {
    const res = await blogger.blogs.get(params);
    console.log(`The blog url is ${res.data.url}`);
}
runSample().catch(console.error);*/

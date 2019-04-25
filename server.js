var http = require("http");

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
    .listen(80); //the server object listens on port 8080
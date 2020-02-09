var restify = require('restify');
var errors  = require('restify-errors');
var path = require('path');

var server_name = 'web_server';
var server_version = '1.0.0';
let querystring = require('querystring');


const server = restify.createServer({name: server_name, version: server_version});
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.urlEncodedBodyParser({ mapParams : false }));
server.use(restify.plugins.bodyParser({ mapParams: true }));
server.use(restify.plugins.acceptParser(server.acceptable));

function renderError(error) { return new errors.InternalError(error); }
function renderMessage(msg) { return {'message': msg}; }
function handleError(next, error) {
    console.error(error);
    if (error instanceof ReferenceError) {
        return next(new errors.BadRequestError(error.message));
    }
    return next(renderError(error.message));
}


let dropConnectionCount = 0;
let timeoutCount = 0;
let get_info = 0;

server.post('/ding',
            function (req, res, next) {
                res.send(renderMessage('dong'));
            });

server.post('/clear_errors',
            function (req, res, next) {
                dropConnectionCount = 0;
                next();
            });

server.get('/get_stats',
            function (req, res, next) {
                res.send({
                    dropConnectionCount: dropConnectionCount,
                    timeoutCount: timeoutCount,
                    get_info: get_info
                });
            });

server.post('/drop_connection',
            function (req, res, next) {
                dropConnectionCount++;
                res.socket.destroy();
            });

server.post('/timeout',
            function (req, res, next) {
                timeoutCount++;
                res.socket.destroy();
            });

server.get('/get_info',
            function (req, res, next) {
                get_info++;
                res.send("info");
            });


server.post('/post_info_params_json',
            function (req, res, next) {
                if(JSON.parse(req.body).json_1) {
                    res.send("ok");
                } else {
                    handleError(next, "invalid json");
                }
            });

server.post('/post_info_params_form',
            function (req, res, next) {
                if(querystring.parse(req.body).form_1) {
                    res.send("ok");
                } else {
                    handleError(next, "invalid form");
                }
            });



console.log('WEB Server starting')
var WEBServer = {
    start: function(port) {
        server.listen(port, '127.0.0.1', function () {
            console.log('%s listening at %s' , server.name, server.url);
        });
    },
    stop() {
        console.log('WEB Server stopping.')
        server.close();
    }
}

module.exports = WEBServer;

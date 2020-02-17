var restify = require('restify');
var errors  = require('restify-errors');
var path = require('path');
var fs = require("fs");

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

/**
 *
 * POST COMMENTS
 */

let DataError = require('./DataError.js');

let BlogData = require('./blogData.js');

function catchErrors(callback) {
  return async function errorHandler(req, res, next) {
    try {
      await callback(req, res, next)
    } catch (err) {
//        console.error(err);
        if(err instanceof DataError) {
            res.status(err.status);
            res.send({"error": err.message});
        } else {
            next(new errors.InternalServerError(err));
        }
    }
  }
}


server.get('/posts', catchErrors(async (req, res, next) => {
    res.send(BlogData.allPosts());
}));

server.post('/posts', catchErrors(async (req, res, next) => {
    res.send({id: BlogData.addPost(JSON.parse(req.body))});
}));
server.put('/posts/:id', catchErrors(async (req, res, next) => {
    BlogData.updatePost(req.params.id, JSON.parse(req.body));
    res.status(204);
    res.send(renderMessage('ok'));
}));

server.get('/posts/:id', catchErrors(async (req, res, next) => {
    res.send(BlogData.getPost(req.params.id));
}));
server.del('/posts/:id', catchErrors(async (req, res, next) => {
    res.send(BlogData.deletePost(req.params.id));
}));

server.post('/posts/:postId/comments', catchErrors(async (req, res, next) => {
    res.send({id: BlogData.addComment(req.params.postId, JSON.parse(req.body))});
}));
server.put('/posts/:postId/comments/:commentId', catchErrors(async (req, res, next) => {
    BlogData.updateComment(req.params.postId, req.params.commentId, JSON.parse(req.body));
    res.status(204);
    res.send(renderMessage('ok'));
}));
server.get('/posts/:postId/comments/:commentId', catchErrors(async (req, res, next) => {
    res.send(BlogData.getComment(req.params.postId, req.params.commentId));
}));
server.del('/posts/:postId/comments/:commentId', catchErrors(async (req, res, next) => {
    res.send(BlogData.deleteComment(req.params.postId, req.params.commentId));
}));



server.get('/', restify.plugins.serveStatic({
  directory: __dirname,
  default: 'index.html'
}));

server.get('/NetworkClient.js', restify.plugins.serveStatic({
  directory: path.join(__dirname, '../../', 'lib'),
  default: 'NetworkClient.js'
}));

server.get('/modules/*', restify.plugins.serveStatic({
  directory: path.join(__dirname, '../', 'networkModules'),
  appendRequestPath: false
}));

var WEBServer = {
    start: function(port) {
        console.log('WEB Server starting')
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

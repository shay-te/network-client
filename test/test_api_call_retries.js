global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

let expect = require('chai').expect;
let assert = require('chai').assert;
let NetworkClient = require("../lib/NetworkClient.js");
let HttpMethod = NetworkClient.HttpMethod;
let ContentType = NetworkClient.ContentType;

let port = 8901;
let server = require('./utils/server.js');
server.start(port);

require("./networkModules/networkPost.js");

describe("Validate all requests are returning", function() {
    it("Run all requests types promise", function() {
        NetworkClient.post.all()
            .then(function(all) {validateAll(all)})
            .catch(failCallback);
    });
});

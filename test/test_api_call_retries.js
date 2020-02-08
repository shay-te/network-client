global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

let expect = require('chai').expect;
let assert = require('chai').assert;

let port = 8901;
let server = require('./utils/server.js');
server.start(port);
var Helpers = require('./utils/helpers.js');

var NetworkClient = require("../lib/NetworkClient.js");
var HttpMethod = NetworkClient.HttpMethod;
var ContentType = NetworkClient.ContentType;
var Network = new NetworkClient();

Network.registerModule("test", require("./networkModules/networkTest.js"), port);

var failCallback = function(err) {
    console.error(err);
    assert.fail("network error!");
}

describe("Validate retries", function() {
    it("Run all requests types promise", async function() {
        let backOffFactor = 100;
        await Network.test.ding();

        let startTime = Date.now();
        try {
            await Network.test.drop_connection(10, backOffFactor);
            assert.fail("network error!");
        } catch(ex) {}
        let endTime = Date.now();
        expect(endTime-startTime).to.be.above(900);

        try {
            await Network.test.timeout();
            assert.fail("network error!");
        } catch(ex) {}

        let storeExpiration = 1000;
        let info = await Network.test.get_info(backOffFactor, storeExpiration);
        assert.equal(info, "info");

        for(var i = 0 ; i < 10 ; i++) {
            info = await Network.test.get_info(backOffFactor, storeExpiration);
            assert.equal(info, "info");
        }
        await Helpers.sleep(1000);
        info = await Network.test.get_info(backOffFactor, storeExpiration);
        assert.equal(info, "info");
        let stats = await Network.test.get_stats();

        assert.equal(stats.dropConnectionCount, 10);
        assert.equal(stats.timeoutCount, 1);
        assert.equal(stats.get_info, 2);
        // 1. TEST json

        server.stop();
    });
});



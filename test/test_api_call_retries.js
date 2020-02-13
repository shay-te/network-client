global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

let expect = require('chai').expect;
let assert = require('chai').assert;

let Helpers = require('./utils/helpers.js');

let failCallback = function(err) {
    console.error(err);
    assert.fail("network error!");
}

describe("Validate options", function() {
    let Network;
    let server;
    before(function(done) {
        let port = 8901;
        server = require('./utils/server.js');
        server.start(port);

        let NetworkClient = require("../lib/NetworkClient.js");
        Network = new NetworkClient({baseURL: "http://127.0.0.1:" + port + "/"});
        Network.registerModule("test", require("./networkModules/networkTest.js"), port);
        done();
    });

    after(function(done) {
        server.stop();
        done()
    });

    it("Validate basic request", async function() {
        await Network.test.ding();
    });

    it("Drop connection retries", async function() {
        this.timeout(3000);
        let backOffFactor = 100;
        let startTime = Date.now();
        try {
            await Network.test.drop_connection(10, backOffFactor);
            assert.fail("network error!");
        } catch(ex) {}
        let endTime = Date.now();
        expect(endTime-startTime).to.be.above(900);
    });

    it("Timeout retries", async function() {
        let backOffFactor = 100;
        let startTime = Date.now();
        try {
            await Network.test.timeout(10, backOffFactor);
            assert.fail("network error!");
        } catch(ex) {}
        let endTime = Date.now();
        expect(endTime-startTime).to.be.above(900);
    });

    it("Store expiration", async function() {
        let storeExpiration = 1000;
        let info = await Network.test.get_info(storeExpiration);
        assert.equal(info, "info");

        for(let i = 0 ; i < 10 ; i++) {
            info = await Network.test.get_info(storeExpiration);
            assert.equal(info, "info");
        }
        await Helpers.sleep(1000);
        info = await Network.test.get_info(storeExpiration);
        assert.equal(info, "info");
    });

    it("send json/form", async function() {
        let form_res = await Network.test.post_info_params_form();
        assert.equal(form_res, "ok");
        let json_res = await Network.test.post_info_params_json();
        assert.equal(json_res, "ok");
    });

    it("All tests stats", async function() {
        let stats = await Network.test.get_stats();
        assert.equal(stats.dropConnectionCount, 10);
        assert.equal(stats.timeoutCount, 10);
        assert.equal(stats.get_info, 2);

        // 1. register single method
        // 3. docs
        // 4. upload example

    });
});



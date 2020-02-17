global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

let expect = require('chai').expect;
let assert = require('chai').assert;

let Helpers = require('./utils/helpers.js');

let failCallback = function(err) {
    console.error(err);
    console.trace();
    assert.fail("network error!");
}

describe("Validate options", function() {
    let Network;
    let server;
    before(function() {
        let port = 8901;
        server = require('./web/server.js');
        server.start(port);

        let NetworkClient = require("../lib/NetworkClient.js");
        Network = new NetworkClient({baseURL: "http://127.0.0.1:" + port + "/", debug: true, json: true});
        Network.addRequestHeader("Content-Type", "application/json");

        Network.registerModule("test", require("./networkModules/networkTest.js"), port);
    });

    after(function() {
        server.stop();
    });

    it("1 Validate basic request", async function() {
        await Network.test.ding();
    });

    it("2 Drop connection retries", async function() {
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

    it("3 Timeout retries", async function() {
        let backOffFactor = 100;
        let startTime = Date.now();
        try {
            await Network.test.timeout(10, backOffFactor);
            assert.fail("network error!");
        } catch(ex) {}
        let endTime = Date.now();
        expect(endTime-startTime).to.be.above(900);
    });

    it("4 Store expiration", async function() {
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


    it("5 All tests stats", async function() {
        let stats = await Network.test.get_stats();
        assert.equal(stats.dropConnectionCount, 10);
        assert.equal(stats.timeoutCount, 10);
        assert.equal(stats.get_info, 2);

        // 1. register single method
        // 3. docs
        // 4. upload example

    });

    it("5 send json/form", async function() {
        let json_res = await Network.test.post_info_params_json();
        assert.equal(json_res, "ok");


        Network.removeRequestHeader("Content-Type");
        let form_res = await Network.test.post_info_params_form();
        assert.equal(form_res, "ok");
    });

});



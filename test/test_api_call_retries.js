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
        assert.equal(info.data, "info");
        assert.equal(info.status, 200);

        for(let i = 0 ; i < 10 ; i++) {
            info = await Network.test.get_info(storeExpiration);
            assert.equal(info.data, "info");
            assert.equal(info.status, undefined);
        }
        await Helpers.sleep(1000);
        info = await Network.test.get_info(storeExpiration);
        assert.equal(info.data, "info");
        assert.equal(info.status, 200);
    });


    it("5 All tests stats", async function() {
        let stats = await Network.test.get_stats();
        assert.equal(stats.data.dropConnectionCount, 10);
        assert.equal(stats.data.timeoutCount, 10);
        assert.equal(stats.data.get_info, 2);
    });

    it("5 send json/form", async function() {
        let json_res = await Network.test.post_info_params_json();
        assert.equal(json_res.data, "ok");
        assert.equal(json_res.status, 200);


        Network.removeRequestHeader("Content-Type");
        let form_res = await Network.test.post_info_params_form();
        assert.equal(form_res.data, "ok");
        assert.equal(form_res.status, 200);
    });

});



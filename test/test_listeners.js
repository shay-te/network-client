let assert = require('chai').assert;
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

let Helpers = require('./utils/helpers.js');




describe('Validate listeners are called', function() {
    let Network;
    let server;

    let validatePostAll = function(method, url, data, options) {
        assert.equal(method, Network.HttpMethod.GET);
        assert.equal(url, "http://127.0.0.1:8901/posts");
        assert.deepEqual(data, {});
        assert.equal(options['store'], false);
        assert.equal(options['storeExpiration'], 0);
    }

    let validatePostGet = function(method, url, data, options) {
        assert.equal(method, Network.HttpMethod.GET);
        assert.equal(/^http:\/\/127.0.0.1:8901\/posts\/\d+$/.test(url), true);
        assert.deepEqual(data, {});
        assert.equal(options['store'], false);
        assert.equal(options['storeExpiration'], 0);
    }

    let validatePostGetStore = function(method, url, data, options) {
        assert.equal(method, Network.HttpMethod.GET);
        assert.equal(/^http:\/\/127.0.0.1:8901\/posts\/\d+$/.test(url), true);
        assert.deepEqual(data, {});
        assert.equal(options['store'], true);
        assert.equal(options['storeExpiration'], 0);
    }
    before(async function() {
        let port = 8901;
        server = require('./web/server.js');
        server.start(port);

        let NetworkClient = require("../lib/NetworkClient.js");

        Network = new NetworkClient({baseURL: "http://127.0.0.1:" + port + "/", json: true, debug: true});
        Network.addRequestHeader("Content-Type", "application/json");

        Network.registerModule("posts", require("./networkModules/networkPost.js"));
        Network.registerModule("comments", require("./networkModules/networkComment.js"));

        for(var i = 0 ; i < 10 ; i++) {
            await Network.posts.create("some title " + i, "some content " + i);
        }
    });


    after(function(done) {
        server.stop();
        done();
    });

    it('1 simple GET request', async function() {
        //WAIT FOR OTHER TEST EVENTS TO CLEAR
        let waitEventsAreClearTime = 500;
        this.timeout(waitEventsAreClearTime + 2000); // Don't fail test for timeout
        await Helpers.sleep(waitEventsAreClearTime);

        let networkStartCalled = 0, networkEndCalled = 0, networkErrorCalled = 0, networkStorageCalled = 0;

        assert.throws(function() {Network.addNetworkListener({});}, "");
        let networkListener = new Network.NetworkListener({
            networkStart: function(method, url, data, options) {
                validatePostAll(method, url, data, options);
                networkStartCalled++;
            },
            networkEnd: function(method, url, data, options) {
                validatePostAll(method, url, data, options);
                networkEndCalled++;
            },
            networkError: function(method, url, data, options) {
                validatePostAll(method, url, data, options);
                networkErrorCalled++;
            },
            networkStorage: function(method, url, data, options) {
                networkStorageCalled++;
            }
        });
        Network.addNetworkListener(networkListener);
        await Network.posts.all();

        assert.equal(networkStartCalled, 1);
        assert.equal(networkEndCalled, 1);
        assert.equal(networkErrorCalled, 0);
        assert.equal(networkStorageCalled, 0);
        Network.removeNetworkListener(networkListener);
    });

    it('2 Partial network event methods', async function() {
        //WAIT FOR OTHER TEST EVENTS TO CLEAR
        let waitEventsAreClearTime = 500;
        this.timeout(waitEventsAreClearTime + 2000); // Don't fail test for timeout
        await Helpers.sleep(waitEventsAreClearTime);

        let networkStartCalled = 0, networkEndCalled = 0, networkErrorCalled = 0, networkStorageCalled = 0;

        /**
         * Test callback networkStart only
         **/
        let networkListenerPartial = new Network.NetworkListener({
            networkStart: function(method, url, data, options) {
                validatePostGet(method, url, data, options);
                networkStartCalled++;
            }
        });
        Network.addNetworkListener(networkListenerPartial);
        await Network.posts.get(5)
        assert.equal(networkStartCalled, 1);
        assert.equal(networkEndCalled, 0);
        assert.equal(networkErrorCalled, 0);
        assert.equal(networkStorageCalled, 0);

        Network.removeNetworkListener(networkListenerPartial);
    });

    it('3 Listener for storage', async function() {
        /**
         * Test storage
         **/
        let networkStartCalled = 0, networkEndCalled = 0, networkErrorCalled = 0, networkStorageCalled = 0;

        //Creating "NetworkListener" only with "networkStorage" method.
        let networkListenerPartial2 = new Network.NetworkListener({
            networkStart: function(method, url, data, options) {
                validatePostGetStore(method, url, data, options);
                networkStartCalled++;
            },
            networkEnd: function(method, url, data, options) {
                validatePostGetStore(method, url, data, options);
                networkEndCalled++;
            },
            networkStorage: function(method, url, data, options) {
                validatePostGetStore(method, url, data, options);
                networkStorageCalled++;
            }
        });
        Network.addNetworkListener(networkListenerPartial2);
        await Network.posts.getPostStore(6); // First call will fetch from network
        await Network.posts.getPostStore(6);
        await Network.posts.getPostStore(6);
        await Network.posts.getPostStore(6);
        await Network.posts.getPostStore(7); // Different post id also cache
        await Network.posts.getPostStore(7);


        assert.equal(networkStartCalled, 2);
        assert.equal(networkEndCalled, 2);
        assert.equal(networkErrorCalled, 0);
        assert.equal(networkStorageCalled, 4);
    });
});
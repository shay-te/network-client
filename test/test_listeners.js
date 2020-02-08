let assert = require('chai').assert;
global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var Helpers = require('./utils/helpers.js');
var NetworkClient = require("../lib/NetworkClient.js");

var Network = new NetworkClient();
var ContentType = NetworkClient.ContentType;

Network.registerModule("posts", require("./networkModules/networkPost.js"));
Network.registerModule("comments", require("./networkModules/networkComment.js"));



let validatePostAll = function(method, url, data, options) {
    assert.equal(method, Network.HttpMethod.GET);
    assert.equal(url, "https://jsonplaceholder.typicode.com/posts");
    assert.deepEqual(data, {});
    assert.equal(options['store'], false);
    assert.equal(options['storeExpiration:'], undefined);
}

let validatePostGet = function(method, url, data, options) {
    assert.equal(method, Network.HttpMethod.GET);
    assert.equal(url, "https://jsonplaceholder.typicode.com/posts/1");
    assert.deepEqual(data, {});
    assert.equal(options['store'], false);
    assert.equal(options['storeExpiration:'], undefined);
}


describe('Validate listeners are called', function() {

    it('should return -1 when the value is not present', async function() {
        //WAIT FOR OTHER TEST EVENTS TO CLEAR
        let waitEventsAreClearTime = 2000;
        this.timeout(waitEventsAreClearTime + 4000); // Don't fail test for timeout
        await Helpers.sleep(waitEventsAreClearTime);

        let networkStartCalled = 0;
        let networkEndCalled = 0;
        let networkErrorCalled = 0;

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
        });
        Network.addNetworkListener(networkListener);
        await Network.posts.all()
        assert.equal(networkStartCalled, 1);
        assert.equal(networkEndCalled, 1);
        assert.equal(networkErrorCalled, 0);
        Network.removeNetworkListener(networkListener);

        //Creating "NetworkListener" only with "networkStart" method.
        let networkListenerPartial = new Network.NetworkListener({
            networkStart: function(method, url, data, options) {
                validatePostGet(method, url, data, options);
                networkStartCalled++;
            }
        });
        Network.addNetworkListener(networkListenerPartial);
        await Network.posts.get(1)
        assert.equal(networkStartCalled, 2);
        assert.equal(networkEndCalled, 1);
        assert.equal(networkErrorCalled, 0);
    });

});
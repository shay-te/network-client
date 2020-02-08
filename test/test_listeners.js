let assert = require('chai').assert;

let NetworkClient = require('../lib/NetworkClient.js')

require('./networkModules/networkPost.js');

let HttpMethod = NetworkClient.HttpMethod;
let ContentType = NetworkClient.ContentType;

global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


let validatePostAll = function(method, url, data, options) {
    assert.equal(method, HttpMethod.GET);
    assert.equal(url, "https://jsonplaceholder.typicode.com/posts");
    assert.deepEqual(data, {});
    assert.equal(options['store'], false);
    assert.equal(options['storeExpiration:'], undefined);
}

let validatePostGet = function(method, url, data, options) {
    assert.equal(method, HttpMethod.GET);
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
        let promise = new Promise(function(resolve, reject) {
            setTimeout(function() {resolve("done!");}, waitEventsAreClearTime);
        });
        await promise;

        let networkStartCalled = 0;
        let networkEndCalled = 0;
        let networkErrorCalled = 0;

        assert.throws(function() {NetworkClient.addNetworkListener({});}, "");

        let networkListener = new NetworkClient.NetworkListener({
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
        NetworkClient.addNetworkListener(networkListener);
        await NetworkClient.post.all()
        assert.equal(networkStartCalled, 1);
        assert.equal(networkEndCalled, 1);
        assert.equal(networkErrorCalled, 0);
        NetworkClient.removeNetworkListener(networkListener);

        //Creating "NetworkListener" only with "networkStart" method.
        let networkListenerPartial = new NetworkClient.NetworkListener({
            networkStart: function(method, url, data, options) {
                validatePostGet(method, url, data, options);
                networkStartCalled++;
            }
        });
        NetworkClient.addNetworkListener(networkListenerPartial);
        await NetworkClient.post.get(1)
        assert.equal(networkStartCalled, 2);
        assert.equal(networkEndCalled, 1);
        assert.equal(networkErrorCalled, 0);
    });

});
var assert = require('chai').assert;

var NetworkClient = require('../lib/NetworkClient.js')


global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


var HttpMethod = NetworkClient.HttpMethod;
var ContentType = NetworkClient.ContentType;
//
describe('Validate listeners are called', function() {

    it('should return -1 when the value is not present', async function() {
        //WAIT FOR OTHER TEST EVENTS TO CLEAR
        let waitEventsAreClearTime = 2000;
        this.timeout(waitEventsAreClearTime + 4000); // Don't fail test for timeout
        var promise = new Promise(function(resolve, reject) {
            setTimeout(function() {resolve("done!");}, waitEventsAreClearTime);
        });
        await promise;

        var networkStartCalled = 0;
        var networkEndCalled = 0;
        var networkErrorCalled = 0;

        assert.throws(function() {NetworkClient.addNetworkListener({});}, "");

        var networkListener = new NetworkClient.NetworkListener({
            networkStart: function(requestData) {networkStartCalled++; },
            networkEnd: function(requestData) { networkEndCalled++; },
            networkError: function(requestData) { networkErrorCalled++; },
        });
        NetworkClient.addNetworkListener(networkListener);
        await NetworkClient.post.all()
        assert.equal(networkStartCalled, 1);
        assert.equal(networkEndCalled, 1);
        assert.equal(networkErrorCalled, 0);
        NetworkClient.removeNetworkListener(networkListener);

        //Creating "NetworkListener" only with "networkStart" method.
        var networkListenerPartial = new NetworkClient.NetworkListener({
            networkStart: function(requestData) {networkStartCalled++; }
        });
        NetworkClient.addNetworkListener(networkListenerPartial);
        await NetworkClient.post.all()
        assert.equal(networkStartCalled, 2);
        assert.equal(networkEndCalled, 1);
        assert.equal(networkErrorCalled, 0);
    });
});
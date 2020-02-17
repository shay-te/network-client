global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

let expect = require('chai').expect;
let assert = require('chai').assert;

process.env.NODE_ENV = 'test'
var NetworkClient = require("../lib/NetworkClient.js");
let port = 8901;
Network = new NetworkClient({baseURL: "http://127.0.0.1:" + port + "/", json: true, debug: true});
Network.addRequestHeader("Content-Type", "application/json");


describe("Validate storage work properly", function() {
    it("Validate build storage key", function() {
        // Test with different order of keys, creates ordered parameters in the url
        assert.equal(Network._build_store_key(Network.HttpMethod.PUT, "i_am_the_s   url", {"username": "shastalka", "password": "swhastword"}), "put-i_am_the_surl-password=swhastword&username=shastalka");
        assert.equal(Network._build_store_key(Network.HttpMethod.PUT, "/x                                      /\\asdakjsdaf;lkasdf\\"), "put-/x/#asdakjsdaf;lkasdf#-{}");
        expect(function() {Network._build_store_key();}).to.throw(TypeError);
        expect(function() {Network._build_store_key("", "");}).to.throw(TypeError);
        expect(function() {Network._build_store_key("ss", "");}).to.throw(TypeError);
        expect(function() {Network._build_store_key("", "ss");}).to.throw(TypeError);
    });

    it("Validate toStorage exceptions", function() {
        let method = Network.HttpMethod.POST;
        let url = 'i_am_url//';
        let data =  {x:'xyz'};
        let storeData = {"who": "me"};
        expect(function() {Network._toStorage(method, url, data, storeData, -4)}).to.throw(TypeError);
        expect(function() {Network._toStorage(method, url, data, storeData, "-5")}).to.throw(TypeError);
        expect(function() {Network._toStorage(method, url, data, storeData, "ok")}).to.throw(TypeError);
        expect(function() {Network._toStorage(method, url, data, storeData, "")}).to.throw(TypeError);
        expect(function() {Network._toStorage(method, url, data, storeData, '')}).to.throw(TypeError);
        expect(function() {Network._toStorage(method, url, data, storeData, '1e')}).to.throw(TypeError);
    });

    it("Run store and SIMPLE TEST", function() {
        let method = Network.HttpMethod.GET;
        let url = 'some_url';
        let requestData =  {x:'y'};
        let key = Network._build_store_key(method, url, requestData)
        let storeData = {"who": "me"};
        Network._toStorage(method, url, requestData, storeData, 0);

        let fetchData = Network._fromStorage(method, url, requestData);
        assert.deepEqual(fetchData, storeData);
    });

    it("Run store and fetch EXPIRE: TIMEOUT (storeExpiration = 100)", function() {
        let method = Network.HttpMethod.PUT;
        let url = "i_am_the_url_1";
        let requestData = {"username": "shastalka", "!@#)*$#%@_(*": "yonty smonty"}
        let storeData = {"will": "timeout"};

        let key = Network._build_store_key(method, url, requestData);
        Network._toStorage(method, url, requestData, storeData, 100);

        this.timeout(2000);
        setTimeout(function () {
            let fetchData = Network._fromStorage(method, url, requestData);
            assert.equal(fetchData, undefined);
        }, 200);
    });

    it("Run store and fetch EXPIRE: RELOAD (storeExpiration = 0)", function() {
        let method = Network.HttpMethod.PUT;
        let url = "i_am_the_url_2";
        let requestData = {"spom keyl lkasdf   ": "shastalkaa", "password": "yonty smonty"}
        let storeData = {"will": "timeout"};

        let key = Network._build_store_key(method, url, requestData);
        Network._toStorage(method, url, requestData, storeData, 0);

        this.timeout(200);
        setTimeout(function () {
            let fetchData = Network._fromStorage(method, url, requestData);
            assert.deepEqual(fetchData, storeData);
            Network._reset_creation_type();
            fetchData = Network._fromStorage(method, url, requestData);
            assert.equal(fetchData, undefined);
        }, 100);
    });

    it("Run store and EXPIRE: NEVER (storeExpiration = undefined)", function() {
        let method = Network.HttpMethod.DELETE;
        let url = "i_am_the_url";
        let requestData = {"username": "shastalka", "password": "yonty smonty"}
        let storeData = {"will": "timeout"};

        Network._toStorage(method, url, requestData, storeData, undefined);

        this.timeout(400);
        setTimeout(function () {
            let fetchData = Network._fromStorage(method, url, requestData);
            assert.deepEqual(fetchData, storeData);

            Network._reset_creation_type();

            fetchData = Network._fromStorage(method, url, requestData);
            assert.deepEqual(fetchData, storeData);

        }, 300);
    });

});

global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

let expect = require('chai').expect;
let assert = require('chai').assert;
let NetworkClient = require("../lib/NetworkClient.js");
let HttpMethod = NetworkClient.HttpMethod;
let ContentType = NetworkClient.ContentType;

describe("Validate storage work properly", function() {
    it("Validate build storage key", function() {
        assert.equal(NetworkClient._build_store_key(HttpMethod.PUT, "i_am_the_s   url", {"username": "shastalka", "password": "swhastword"}), "put-i_am_the_surl-username=shastalka&password=swhastword");
        assert.equal(NetworkClient._build_store_key(HttpMethod.PUT, "/x                                      /\\asdakjsdaf;lkasdf\\"), "put-/x/#asdakjsdaf;lkasdf#-{}");
        expect(function() {NetworkClient._build_store_key();}).to.throw(TypeError);
        expect(function() {NetworkClient._build_store_key("", "");}).to.throw(TypeError);
        expect(function() {NetworkClient._build_store_key("ss", "");}).to.throw(TypeError);
        expect(function() {NetworkClient._build_store_key("", "ss");}).to.throw(TypeError);
    });

    it("Validate toStorage exceptions", function() {
        let method = HttpMethod.POST;
        let url = 'i_am_url//';
        let data =  {x:'xyz'};
        let storeData = {"who": "me"};
        expect(function() {NetworkClient._toStorage(method, url, data, storeData, -4)}).to.throw(TypeError);
        expect(function() {NetworkClient._toStorage(method, url, data, storeData, "-5")}).to.throw(TypeError);
        expect(function() {NetworkClient._toStorage(method, url, data, storeData, "ok")}).to.throw(TypeError);
        expect(function() {NetworkClient._toStorage(method, url, data, storeData, "")}).to.throw(TypeError);
        expect(function() {NetworkClient._toStorage(method, url, data, storeData, '')}).to.throw(TypeError);
        expect(function() {NetworkClient._toStorage(method, url, data, storeData, '1e')}).to.throw(TypeError);
    });

    it("Run store and SIMPLE TEST", function() {
        let method = HttpMethod.GET;
        let url = 'some_url';
        let requestData =  {x:'y'};

        let key = NetworkClient._build_store_key(method, url, requestData)
        let storeData = {"who": "me"};
        NetworkClient._toStorage(method, url, requestData, storeData, 0);

        let fetchData = NetworkClient._fromStorage(method, url, requestData);
        assert.deepEqual(fetchData, storeData);
    });

    it("Run store and fetch EXPIRE: TIMEOUT (storeExpiration = 100)", function() {
        let method = HttpMethod.PUT;
        let url = "i_am_the_url_1";
        let requestData = {"username": "shastalka", "!@#)*$#%@_(*": "yonty smonty"}
        let storeData = {"will": "timeout"};

        let key = NetworkClient._build_store_key(method, url, requestData);
        NetworkClient._toStorage(method, url, requestData, storeData, 100);

        this.timeout(2000);
        setTimeout(function () {
            let fetchData = NetworkClient._fromStorage(method, url, requestData);
            assert.equal(fetchData, undefined);
        }, 200);
    });

    it("Run store and fetch EXPIRE: RELOAD (storeExpiration = 0)", function() {
        let method = HttpMethod.PUT;
        let url = "i_am_the_url_2";
        let requestData = {"spom keyl lkasdf   ": "shastalkaa", "password": "yonty smonty"}
        let storeData = {"will": "timeout"};

        let key = NetworkClient._build_store_key(method, url, requestData);
        NetworkClient._toStorage(method, url, requestData, storeData, 0);

        this.timeout(200);
        setTimeout(function () {
            let fetchData = NetworkClient._fromStorage(method, url, requestData);
            assert.deepEqual(fetchData, storeData);

            NetworkClient._creation_time = NetworkClient._now();

            fetchData = NetworkClient._fromStorage(method, url, requestData);
            assert.equal(fetchData, undefined);
        }, 100);
    });

    it("Run store and EXPIRE: NEVER (storeExpiration = undefined)", function() {
        let method = HttpMethod.DELETE;
        let url = "i_am_the_url";
        let requestData = {"username": "shastalka", "password": "yonty smonty"}
        let storeData = {"will": "timeout"};

        let key = NetworkClient._build_store_key(method, url, requestData);

        NetworkClient._toStorage(method, url, requestData, storeData, undefined);

        this.timeout(400);
        setTimeout(function () {
            let fetchData = NetworkClient._fromStorage(method, url, requestData);
            assert.deepEqual(fetchData, storeData);

            NetworkClient._creation_time = NetworkClient._now();

            fetchData = NetworkClient._fromStorage(method, url, requestData);
            assert.deepEqual(fetchData, storeData);

        }, 210);
    });

});

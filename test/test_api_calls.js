global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

let expect = require('chai').expect;
let assert = require('chai').assert;



let failCallback = function(err) {
    console.error(err);
    console.trace();
    assert.fail("network error!");
    throw err;
}

let validateAll = function(all) {
    assert.notEqual(all, undefined);
    assert.equal(typeof(all), "object");
    expect(all.length).to.be.above(1);
}

let validateCreate = function(post) {
    assert.notEqual(post, undefined);
    assert.equal(typeof(post), "object");
}

let validateGet = function(post) {
    assert.notEqual(post, undefined);
    assert.equal(typeof(post), "object");
    assert.notEqual(post.title, undefined);
    assert.notEqual(post.content, undefined);
}


describe("Validate all requests are returning", function() {
    let Network;
    let server;
    before(function() {
        let port = 8901;
        server = require('./web/server.js');
        server.start(port);

        let NetworkClient = require("../lib/NetworkClient.js");
        Network = new NetworkClient({baseURL: "http://127.0.0.1:" + port + "/", json: true, debug: true});
        Network.addRequestHeader("Content-Type", "application/json");

        Network.registerModule("posts", require("./networkModules/networkPost.js"));
        Network.registerModule("comments", require("./networkModules/networkComment.js"));
    });

    after(function(done) {
        server.stop();
        done()
    });

    it("1 Run all requests types promise", async function() {
        for(var i = 0 ; i < 5 ; i++) {
            let post = await Network.posts.create("post title" ,"post body");
            validateCreate(post)
        }

        Network.posts.all()
            .then(function(all) {validateAll(all.data)})
            .catch(failCallback);

        Network.posts.get(1)
            .then(function(post){validateGet(post.data);})
            .catch(failCallback);

        let updateTitle = "one title1";
        let updateContent = "one body1";
        await Network.posts.update(1, {"title": updateTitle, "content": updateContent});
        let post = await Network.posts.get(1);
        assert.equal(post.data.title, updateTitle);
        assert.equal(post.data.content, updateContent);
        assert.equal(post.status, 200);

        await Network.posts.del(1);

        try {
            await Network.posts.get(1);
            assert.fail("Should not be exists");
        }catch(e) {}
    });

    it("2 Run all requests types callback", function(done) {
        Network.posts.createCB("post title" ,"post body",
            function(post){
                validateCreate(post)
                Network.posts.allCB(
                    function(all) {
                        validateAll(all)
                        Network.posts.getCB(2,
                            function(post){
                                validateGet(post);

                                    Network.posts.updateCB(2, {"title": "one title", "body": "one body"},
                                        function(){
                                            Network.posts.deleteCB(2,
                                                function(post){
                                                    done();
                                                },
                                                failCallback);
                                        },
                                        failCallback);
                            },
                            failCallback);
                    },
                    failCallback);
            },
            failCallback);
    });
});

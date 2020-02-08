global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var expect = require('chai').expect;
var assert = require('chai').assert;

var NetworkClient = require("../lib/NetworkClient.js");
var Network = new NetworkClient();
Network.registerModule("posts", require("./networkModules/networkPost.js"));
Network.registerModule("comments", require("./networkModules/networkComment.js"));


var failCallback = function(err) {
    console.error(err);
    assert.fail("network error!");
}


var validateAll = function(all) {
    assert.notEqual(all, undefined);
    assert.equal(typeof(all), "object");
    expect(all.length).to.be.above(1);
}

var validateCreateUpdate = function(post) {
    postId = post["id"];
    assert.notEqual(post, undefined);
    assert.equal(typeof(post), "object");
}

var validateGet = function(post) {
    assert.notEqual(post, undefined);
    assert.equal(typeof(post), "object");
    assert.equal(post.id, 1);
    assert.notEqual(post.title, undefined);
    assert.notEqual(post.body, undefined);
}

var validateDelete = function(post) {
    assert.notEqual(post, undefined);
}

describe("Validate all requests are returning", function() {
    it("Run all requests types promise", function() {
        Network.posts.all()
            .then(function(all) {validateAll(all)})
            .catch(failCallback);

        Network.posts.create(1, "post title" ,"post body")
            .then(function(post){validateCreateUpdate(post)})
            .catch(failCallback);

        Network.posts.get(1)
            .then(function(post){validateGet(post);})
            .catch(failCallback);

        Network.posts.update(1, {"title": "one title", "body": "one body"})
            .then(function(post){validateCreateUpdate(post)})
            .catch(failCallback);

        Network.posts.delete(1)
            .then(function(post){validateDelete(post);})
            .catch(failCallback);
    });

    it("Run all requests types callback", function() {
        Network.posts.allCB(
            function(all) {validateAll(all)},
            failCallback);

        Network.posts.createCB(1, "post title" ,"post body",
            function(post){validateCreateUpdate(post)},
            failCallback);

        Network.posts.getCB(1,
            function(post){validateGet(post);},
            failCallback);

        Network.posts.updateCB(1, {"title": "one title", "body": "one body"},
            function(post){validateCreateUpdate(post)},
            failCallback);

        Network.posts.deleteCB(1,
            function(post){validateDelete(post);},
            failCallback);
    });
});

#!/usr/bin/env node


global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;



var network = require('network-client');
var HttpMethod = network.HttpMethod;
var ContentType = network.contentType;

var assert = require('assert');


var NetworkPosts = function(network) {
    return {
        allCallbacks: function(success, error) {
            network.get("https://jsonplaceholder.typicode.com/posts", {}, ContentType.APPLICATION_JSON, undefined, success, error);
        },

        all: function() {
            return network.get_promise("https://jsonplaceholder.typicode.com/posts", {}, ContentType.APPLICATION_JSON, undefined);
        },

        create: function(title, body, userId) {
            var data =  {title: title, body: body, userId: userId};
            return network.post_promise("https://jsonplaceholder.typicode.com/posts", data, ContentType.APPLICATION_JSON, undefined);
        }
    };
};

network.registerModule('posts', NetworkPosts);

network.posts.allCallbacks(
    function(all) {
        assert.notEqual(all, undefined, 'all cannot be null');
        console.log('allCallbacks success, all :' + all);
    }, function(err) {
        assert.fail('network error!')
        console.log("allCallbacks error");
    }
);




network.posts.all()
    .then(function(all) {
        assert.notEqual(all, undefined, 'all cannot be null');
        console.log("Promise success");
    })
    .catch(function(err) {
        assert.fail('network error!')
    }
);

var post = {
    title: 'foo',
    body: 'bar',
    userId: 1
};

network.posts.create(post)
    .then(function(post){
        assert.notEqual(post, undefined, 'post cannot be null');
        console.log('Promise create success');
    })
    .catch(function(err) {
        assert.fail('network error!')
    });

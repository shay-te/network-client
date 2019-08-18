#!/usr/bin/env node

global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var network = require('network-client');
var HttpMethod = network.HttpMethod;
var ContentType = network.contentType;

var assert = require('assert');


var NetworkPosts = function(network) {

    return {
        allCallbacks: function(success, error) {
            var url = "https://jsonplaceholder.typicode.com/posts";
            network.send(HttpMethod.GET, url, {}, ContentType.APPLICATION_JSON, success, error);
        },

        all: function() {
            var url = "https://jsonplaceholder.typicode.com/posts";
            return network.sendPromise(HttpMethod.GET, url, {}, ContentType.APPLICATION_JSON);
        },

        create: function(title, body, userId) {
            var url = "https://jsonplaceholder.typicode.com/posts";
            var post =  {title: title,
                        body: body,
                        userId: userId};
            return network.sendPromise(HttpMethod.POST, url, post, ContentType.APPLICATION_JSON);
        }

    };

};

network.registerModule('posts', NetworkPosts);

network.posts.allCallbacks(
    function(all) {
        assert.notEqual(all, undefined, 'all cannot be null');
        console.log('allCallbacks success');
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
        console.log("Promise error");
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
        console.log('Promise create error');
    });

#!/usr/bin/env node


global.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var network = require('network-client');
var HttpMethod = network.HttpMethod;
var ContentType = network.contentType;


var NetworkCandidates = function(network) {

    return {
        doSimpleGet: function(success, error) {
            var url = '/api/module_1';
            network.send(HttpMethod.GET, url, undefined, ContentType.APPLICATION_JSON, success, error);
        },

        doSimpleGetPromise: function() {
            var url = '/api/module_1';
            return network.sendPromise(HttpMethod.GET, url, undefined, ContentType.APPLICATION_JSON);
        },


        doCreateWithParams: function(launcherTypeId, success, error) {
            var url = '/api/module_1';
            network.send(HttpMethod.GET, url, {launcherTypeId:launcherTypeId}, ContentType.APPLICATION_JSON, success, error);
        },

        doRemove: function(launcherId, success, error) {
            network.send(HttpMethod.DELETE, "/api/launcher/" + launcherId , ContentType.APPLICATION_JSON, undefined, success, error);
        },

    };

};


network.registerModule('candidate', NetworkCandidates);

network.candidate.doSimpleGet(function() {
    console.log('succress');
    }, function(e) {
    console.log("ERROR");
    console.log(e)
    }
);




network.candidate.doSimpleGetPromise()
    .then(function() {console.log("Promise success");})
    .catch(function() {console.log("Promise error");})





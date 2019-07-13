#!/usr/bin/env node

var network = require('network-client');
var HttpMethod = network.HttpMethod;


var NetworkCandidates = {
    doSimpleGet: function(success, error) {
        var url = '/api/module_1';
		this.network.send(HttpMethod.GET, url, undefined, success, error);
    },

	goCreateWithParams: function(launcherTypeId, success, error) {
	    var url = '/api/module_1';
		this.network.send(HttpMethod.GET, url, undefined, success, error);

		this.network.sendForm(HttpMethod.POST, "/api/launcher", {launcherTypeId:launcherTypeId}, success, error);
	},

	removeLauncher: function(launcherId, success, error) {
		this.network.send(HttpMethod.DELETE, "/api/launcher/" + launcherId , undefined, success, error);
	},

	getLaunchers: function(success, error) {
		this.network.send(HttpMethod.GET, "/api/launcher/all", undefined, success, error);
	},

	updateLauncher: function(launcherProps, success, error) {
	    this.network.send(HttpMethod.PUT, "/api/launcher", launcherProps, success, error);
	}
};





network.registerModule(NetworkModule('candidate', NetworkCandidates));









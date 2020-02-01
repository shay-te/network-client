var Network = require('../../lib/NetworkClient.js')

Network.registerModule('post', function(network) {
    function buildUrl(postId) {
        var  url = "https://jsonplaceholder.typicode.com/posts";
        if(postId) { url = url + "/" + postId; }
        return url;
    }

    return {
        all: function() {
            return network.get_promise(buildUrl(), {});
        },

        create: function(userId, title, body) {
            var data =  {userId: userId, title: title, body: body};
            return network.post_promise(buildUrl(), data);
        },

        get: function(postId) {
            return network.get_promise(buildUrl(postId), {});
        },

        update: function(postId, data) {
            return network.put_promise(buildUrl(postId), data);
        },

        "delete": function(postId, data) {
            return network.del_promise(buildUrl(postId), data);
        },

        allCB: function(success, error) {
            network.get_promise(buildUrl(), {}, {}, success, error);
        },

        createCB: function(userId, title, body, success, error) {
            var data =  {userId: userId, title: title, body: body};
            network.post_promise(buildUrl(), data, {}, success, error);
        },

        getCB: function(postId, success, error) {
            network.get_promise(buildUrl(postId), {}, {}, success, error);
        },

        updateCB: function(postId, data, success, error) {
            network.put_promise(buildUrl(postId), data, {}, success, error);
        },

        deleteCB: function(postId, data, success, error) {
            return network.del(buildUrl(postId), data, success, error);
        }

    };
});

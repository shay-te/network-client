var networkPosts = function(network) {

    function buildUrl(postId) {
        var  url = "posts";
        if(postId) { url = url + "/" + postId; }
        return url;
    }

    return {
        all: function() {
            return network.get_promise(buildUrl(), {});
        },

        create: function(title, content) {
            var data =  {title: title, content: content};
            return network.post_promise(buildUrl(), data);
        },

        get: function(postId) {
            return network.get_promise(buildUrl(postId), {});
        },

        update: function(postId, data) {
            return network.put_promise(buildUrl(postId), data);
        },

        del: function(postId, data) {
            return network.del_promise(buildUrl(postId), data);
        },

        getPostStore: function(postId) {
            return network.get_promise(buildUrl(postId), {}, {store: true});
        },

        allCB: function(success, error) {
            network.get(buildUrl(), {}, {}, success, error);
        },

        createCB: function(title, content, success, error) {
            var data =  {title: title, content: content};
            network.post(buildUrl(), data, {}, success, error);
        },

        getCB: function(postId, success, error) {
            network.get(buildUrl(postId), {}, {}, success, error);
        },

        getCDStore: function(postId, success, error) {
            network.get(buildUrl(postId), {}, {'store': true}, success, error);
        },

        updateCB: function(postId, data, success, error) {
            network.put(buildUrl(postId), data, {}, success, error);
        },

        deleteCB: function(postId, success, error) {
            return network.del(buildUrl(postId), {}, {}, success, error);
        },

        getUse: function(postId) {
            return network.use_promise("POST", buildUrl(postId));
        },
    };
};

if(typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
    module.exports = networkPosts;
}
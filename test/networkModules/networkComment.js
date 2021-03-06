var networkComments = function(network) {

    function buildUrl(postId, commentId) {
        var  url = "posts" + postId;
        if(commentId) { url = url + "/comments/" + commentId; }
        return url;
    }

    return {
        allCallbacks: function(postId, success, error) {
            return network.get(buildUrl(postId), {}, {}, success, error);
        },

        all: function(postId) {
            return network.get_promise(buildUrl(postId));
        },

        create: function(postId, name, email, body) {
            var data =  {name: name, email: email, body: body};
            return network.post_promise(buildUrl(postId), data);
        },

        get: function(postId, commentId) {
            return network.get(buildUrl(postId, commentId));
        },

        update: function(postId, commentId, data) {
            return network.put(buildUrl(postId, commentId), data);
        }
    };
};

if(typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
    module.exports = networkComments;
}

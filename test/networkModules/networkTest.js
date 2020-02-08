module.exports = function(network, port) {
    function buildUrl(path) {
        var  url = "http://127.0.0.1:" + port;
        if(path) { url = url + "/" + path; }
        return url;
    }
    return {
        ding: function() {
            return network.post_promise(buildUrl('ding'));
        },
        clear_errors: function() {
            return network.post_promise(buildUrl('clear_errors'));
        },
        get_stats: function() {
            return network.get_promise(buildUrl('get_stats'));
        },
        drop_connection: function(retries, backOffFactor) {
            return network.post_promise(buildUrl('drop_connection'), {}, {retries: retries, backOffFactor: backOffFactor});
        },
        timeout: function() {
            return network.post_promise(buildUrl('timeout'));
        },
        get_info: function(storeExpiration) {
            return network.get_promise(buildUrl('get_info'), {}, {store: true, storeExpiration: storeExpiration})
        }
    };
};

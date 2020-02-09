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
        timeout: function(retries, backOffFactor) {
            return network.post_promise(buildUrl('timeout'), {}, {retries: retries, backOffFactor: backOffFactor});
        },
        get_info: function(storeExpiration) {
            return network.get_promise(buildUrl('get_info'), {}, {store: true, storeExpiration: storeExpiration});
        },
        post_info_params_json: function() {
            return network.post_promise(buildUrl('post_info_params_json'), {'json_1': 'x1', 'json_2': 'xx1'}, {json: true});
        },
        post_info_params_form: function() {
            return network.post_promise(buildUrl('post_info_params_form'), {'form_1': 'y1', 'form_2': 'yy1'});
        },

    };
};

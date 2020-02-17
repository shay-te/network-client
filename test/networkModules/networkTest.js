var networkTest = function(network, port) {
    return {
        ding: function() {
            return network.post_promise("ding");
        },
        clear_errors: function() {
            return network.post_promise("clear_errors");
        },
        get_stats: function() {
            return network.get_promise("get_stats");
        },
        drop_connection: function(retries, backOffFactor) {
            return network.post_promise("drop_connection", {}, {retries: retries, backOffFactor: backOffFactor});
        },
        timeout: function(retries, backOffFactor) {
            return network.post_promise("timeout", {}, {retries: retries, backOffFactor: backOffFactor});
        },
        get_info: function(storeExpiration) {
            return network.get_promise("get_info", {}, {store: true, storeExpiration: storeExpiration});
        },
        post_info_params_json: function() {
            return network.post_promise("post_info_params_json", {"json_1": "x1", "json_2": "xx1"}, {json: true});
        },
        post_info_params_form: function() {
            return network.post_promise("post_info_params_form", {"form_1": "y1", "form_2": "yy1"}, {json: false});
        },

    };
};

if(typeof process !== "undefined" && process.versions != null && process.versions.node != null) {
    module.exports = networkTest;
}
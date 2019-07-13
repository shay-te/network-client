var APPLICATION_JSON = "application/json";
var X_WWW_FORM_URLENCODED = "application/x-www-form-urlencoded";

var Network = {
    eventListeners: [],
	_lastXmlHttp: undefined,
	_xmlHttpVersions: [ "MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp" ],
	HttpMethod: {
	    "GET":"GET",
	    "POST":"POST",
	    "PUT":"PUT",
	    "DELETE":"DELETE"
	},


	/**
	 * Network
	 **/
	send: function(method, url, data, success, error) {
	    this._send(method, url, data, APPLICATION_JSON, success, error);
	},

	sendForm: function(method, url, data, success, error) {
	    this._send(method, url, data,X_WWW_FORM_URLENCODED , success, error);
	},

    _send: function(method, url, data, contentType, success, error) {
		return this._ajax({
			method: method || "GET",
			url : url || "",
			data : data || {},
			contentType: contentType,
			success : success || function(){},
			error : error || function(){}
		});
    },

	_fetchXHR: function() {
	    var xhr;
        if (typeof XMLHttpRequest !== 'undefined') {
            xhr = new XMLHttpRequest();
        } else {
            if(this.lastXmlHttp) {
                xhr = new ActiveXObject(this._lastXmlHttp);
            } else {
                for (var i = 0, len = this._xmlHttpVersions.length; i < len; i++) {
                    try {
                        xhr = new ActiveXObject(this._xmlHttpVersions[i]);
                        this._lastXmlHttp = this._xmlHttpVersions[i];
                        break;
                    } catch (e) {}
                }
            }
        }

        return xhr;
	},

	_ajax : function(options) {

	    this.fireEventNetworkStart(options);

		var xhr = this._fetchXHR();

		function ensureReadiness() {
			if (xhr.readyState < 4) { return; }
			if (xhr.readyState === 4) {
				var isSuccess = xhr.status >= 200 && xhr.status < 300 || xhr.status == 304;
				if(isSuccess) {
					var result = xhr.response;
					if(result && xhr.getResponseHeader('content-type').trim().toLowerCase() == "application/json") {
						result = JSON.parse(result);
					}

					this.fireEventNetworkEnd(options);
					options.success(result);
				} else {
				    this.fireEventNetworkError(options);
					options.error(xhr);
				}
			}
		};

		xhr.onreadystatechange = ensureReadiness.bind(this);

		var hasData = options.data != undefined;
		var sendData = undefined;

		xhr.open(options.method, options.url, true);

		if(hasData) {
			xhr.setRequestHeader("Content-type", options.contentType);
			if(options.contentType === X_WWW_FORM_URLENCODED) {
                sendData = Object.keys(options.data).map(function(k) {
                    return encodeURIComponent(k) + '=' + (options.data[k] != undefined ? encodeURIComponent(options.data[k]) : "");
                }).join('&');
                sendData.replace(/%20/g, '+');
			} else {
			    sendData = JSON.stringify(options.data);
			}
		}

		xhr.send((hasData && sendData) ||  null);
	},

	/**
	 * Module support
	 **/

	registerModule: function(module_name, module) {
	    if(!module instanceof NetworkModule) {
	        throw new Error('registerModule module is not an instance of NetworkModule;
	    }

		module.network_obj = this;
        module.name = module_name;

		Object.defineProperties(obj, {
            module.name: { get: function () { return this[module.name]; } },
        });
	},


	/**
	 * Events support
	 **/

    fireEventNetworkStart: function(options) {
        this.__fireEventByKey('networkStart', options);
    },

    fireEventNetworkEnd: function(options) {
        this.__fireEventByKey("networkEnd", options);
    },

    fireEventNetworkError: function(options) {
        this.__fireEventByKey("networkError", options);
    },

    __fireEventByKey: function(eventKey, options) {
        for(var i = 0 ; i < this.eventListeners.length ; i++) {
            if( this.eventListeners[i][eventKey] && typeof this.eventListeners[i][eventKey] === "function" ) {
                this.eventListeners[i][eventKey](options);
            }
        }
    },

	addEventListener: function(eventListener) {
	    this.eventListeners.push(eventListener);
	}
};

module.exports = Network;

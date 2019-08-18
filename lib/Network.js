
var Network = {
    _eventListeners: [],
	_lastXmlHttp: undefined,
	_xmlHttpVersions: [ "MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp" ],
		HttpMethod: {
	    "GET":"GET",
	    "POST":"POST",
	    "PUT":"PUT",
	    "DELETE":"DELETE"
	},
	_modules: {},
    _module_validation : new RegExp(!/[^a-zA-Z0-9_]/),

    contentType: {
        'APPLICATION_JSON' : 'application/json',
        'X_WWW_FORM_URLENCODED' : 'application/x-www-form-urlencoded'
    },

	/**
	 * Network
	 **/
	send: function(method, url, data, contentType, success, error) {
	    this._send(method, url, data, contentType, success, error);
	},

	sendPromise : function(method, url, data, contentType) {

        var res, rej;
        var promise = new Promise(function(resolve, reject) {
            res = resolve;
            rej = reject;
        });

        var success = function(data) {res(data);};
        var error = function(data) {rej(data);};

	    this._send(method, url, data, contentType, success, error);

	    return promise;
	},

  _send: function(method, url, data, contentType, success, error) {
        contentType

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
            if(!this.lastXmlHttp) {
                for (var i = 0, len = this._xmlHttpVersions.length; i < len; i++) {
                    try {
                        xhr = new ActiveXObject(this._xmlHttpVersions[i]);
                        this._lastXmlHttp = this._xmlHttpVersions[i];
                        break;
                    } catch (e) {}
                }
            }
            xhr = new ActiveXObject(this._lastXmlHttp);
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
          			var result = xhr.responseText || xhr.response;
          			if(result && xhr.getResponseHeader('content-type').trim().toLowerCase() == this.contentType.APPLICATION_JSON) {
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

			xhr.setRequestHeader('content-type', options.contentType);
			if(options.contentType === this.contentType.X_WWW_FORM_URLENCODED) {
                sendData = Object.keys(options.data).map(function(k) {
                    return encodeURIComponent(k) + '=' + (options.data[k] != undefined ? encodeURIComponent(options.data[k]) : '');
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

	registerModule: function(module_name, module_cb) {
	    if(!(module_cb && module_cb.constructor && module_cb.call && module_cb.apply)) {
	        throw new Error('registerModule module is not a function');
	    }
        if(this._module_validation.test(module_name)) {
            throw new Error('module_name is invalid and must contain number,letters,underscore only! (spaces not allowed)');
        }
        var module = module_cb(this);
        if(!module) {
            throw new Error('module_callback must return the network entries as object');
        }

        this._modules[module_name] = module;

        Object.defineProperty(this, module_name, {
            value: this._modules[module_name],
            writable: false,
            enumerable: false
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
        for(var i = 0 ; i < this._eventListeners.length ; i++) {
            if( this._eventListeners[i][eventKey] && typeof this._eventListeners[i][eventKey] === "function" ) {
                this._eventListeners[i][eventKey](options);
            }
        }
    },

	addEventListener: function(eventListener) {
	    this._eventListeners.push(eventListener);
	}
};

module.exports = Network;

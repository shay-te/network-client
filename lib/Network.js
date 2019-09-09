
var Network = {
    _eventListeners: [],
	_lastXmlHttp: undefined,
	_xmlHttpVersions: [ 'MSXML2.XmlHttp.5.0', 'MSXML2.XmlHttp.4.0', 'MSXML2.XmlHttp.3.0', 'MSXML2.XmlHttp.2.0', 'Microsoft.XmlHttp' ],
    HttpMethod: {
	    'GET':'GET',
	    'POST':'POST',
	    'PUT':'PUT',
	    'DELETE':'DELETE'
	},
	_modules: {},
    _module_validation : new RegExp(!/[^a-zA-Z0-9_]/),

    contentType: {
        'APPLICATION_JSON' : 'application/json',
        'X_WWW_FORM_URLENCODED' : 'application/x-www-form-urlencoded'
    },

    _headersPermanent: {},
    _headersTemporary: {},

	/**
	 * Network
	 **/
    get: function(url, data, contentType, success, error) { this._send(this.HttpMethod.GET, url, queryString, data, contentType, success, error); },
    post: function(url, data, contentType, success, error) { this._send(this.HttpMethod.POST, url, queryString, data, contentType, success, error); },
    put: function(url, data, contentType, success, error) { this._send(this.HttpMethod.PUT, url, queryString, data, contentType, success, error); },
    del: function(url, data, contentType, success, error) { this._send(this.HttpMethod.DELETE, url, queryString, data, contentType, success, error); },
    get_promise: function(url, data, contentType) { this._sendPromise(this.HttpMethod.GET, url, queryString, data, contentType); },
    post_promise: function(url, data, contentType) { this._sendPromise(this.HttpMethod.POST, url, queryString, data, contentType); },
    put_promise: function(url, data, contentType) { this._sendPromise(this.HttpMethod.PUT, url, queryString, data, contentType); },
    del_promise: function(url, data, contentType) { this._sendPromise(this.HttpMethod.DELETE, url, queryString, data, contentType); },

    addRequestHeader: function(header, isPermanent, callback) {
        if (!this._isStr(header) && this._isStrBlank(header)) { throw 'key must be set to string value'; }
        if (!this._isUndef(isPermanent) && this._isBool(isPermanent)){ throw 'isPermanent must be boolean or undefined'; }
        if (!callback && this._isFunc(callback)) { throw 'callback must be function or undefined'; }
        if(isPermanent) {
            this._headersPermanent[header] = callback
        } else {
            this._headersTemporary[header] = callback
        }
    },

	_sendPromise : function(method, url, queryString, data, contentType) {
        var res, rej;
        var promise = new Promise(function(resolve, reject) {
            res = resolve;
            rej = reject;
        });

        var success = function(data) {res(data);};
        var error = function(data) {rej(data);};

	    this._send(method, url, queryString, data, success, error);
	    return promise;
	},

    _send: function(method, url, queryString, data, success, error) {
        return this._ajax({
            method: method || this.HttpMethod.GET,
            url : url || '',
            queryString : queryString || {},
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

    _setRequestHeaders(xhr, headers, method, url, queryString, data, contentType) {
        var headKeys = this._objectKeys(headers);
        for (var i in headKeys) {
            var key = headKeys[i];
            var value = headers[key](method, url, queryString, data, contentType);
            if(value) {
                xhr.setRequestHeader(key, value);
            }
        }
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
		var hasQueryString = options.queryString != undefined;


        var url = options.url

        if(options.method == this.HttpMethod.GET) {
            url = url + '?' + this._jsonToDataString(options.queryString)
        }

		xhr.open(options.method, url, true);

        // Set request header values
        this._setRequestHeaders(xhr, this._headersPermanent, options.method, url, options.queryString, options.data, options.contentType);
        this._setRequestHeaders(xhr, this._headersTemporary, options.method, url, options.queryString, options.data, options.contentType);
        this._headersTemporary = {};

		if(hasData && options.method != this.HttpMethod.GET) {
		    var sendData = '';
			xhr.setRequestHeader('content-type', options.contentType);
			if(options.contentType === this.contentType.X_WWW_FORM_URLENCODED) {
                sendData = this._jsonToDataString(options.data)
			} else if(options.contentType === this.contentType.APPLICATION_JSON) {
			    sendData = JSON.stringify(options.data);
			} else {
			    console.error('unknown content type, how to send the data ?');
			}
			xhr.send(sendData);
		}
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
    fireEventNetworkStart: function(options) { this.__fireEventByKey('networkStart', options); },
    fireEventNetworkEnd:   function(options) { this.__fireEventByKey('networkEnd', options); },
    fireEventNetworkError: function(options) { this.__fireEventByKey('networkError', options); },

    __fireEventByKey: function(eventKey, options) {
        for(var i = 0 ; i < this._eventListeners.length ; i++) {
            this._eventListeners[i][eventKey](options);
        }
    },

	addNetworkListener: function(networkListener) {
	    if (!this._isObj(networkListener)){ throw 'networkListener must be an object that contains function to handle [networkStart, networkEnd, networkError]'};
	    this._eventListeners.push(networkListener);
	},

	/**
	 * Utils
	 **/
    _isStr(s) {return s && s.constructor === String;},
    _isStrBlank(s) {return  s.trim() === '';},
    _isBool(b) {return typeof b !== 'boolean';},
    _isUndef(o) {return typeof o === 'undefined';},
    _isFunc(f) {return typeof f === 'function';},
    _isObj(o) {return o && typeof o.constructor === 'Object';},

    _jsonToDataString: function(data) {
        var keys = this._objectKeys(data);
        var result = [];
        for(var i in keys) {
            var key = keys[i];
            result.push(encodeURIComponent(key) + '=' + (data[key] != undefined ? encodeURIComponent(data[key]) : ''))
        }
        return result.join('&').replace(/%20/g, '+');
    },

    _objectKeys: function(obj) {
      if (!this._isObj(obj)) {throw new TypeError('_objectKeys called on non-object');}
      var result = [], prop, i;
      var hasOwnProp = Object.prototype.hasOwnProperty;
      for (prop in obj) {
        if (hasOwnProp.call(obj, prop)) {
          result.push(prop);
        }
      }
      return result;
    }

};

export default Network;

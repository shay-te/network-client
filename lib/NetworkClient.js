var NetworkClient = {
    HttpMethod: { 'GET':'GET', 'POST':'POST', 'PUT':'PUT', 'DELETE':'DELETE' },
    ContentType: {
        'APPLICATION_JSON': 'application/json',
        'X_WWW_FORM_URLENCODED': 'application/x-www-form-urlencoded'
    },
    _lastXmlHttp: undefined,
    _xmlHttpVersions: [ 'MSXML2.XmlHttp.5.0', 'MSXML2.XmlHttp.4.0', 'MSXML2.XmlHttp.3.0', 'MSXML2.XmlHttp.2.0', 'Microsoft.XmlHttp' ],
    _module_validation : new RegExp(!/[^a-zA-Z0-9_]/),
    _headers: {},
    _default_options: { 'json': false, 'headers': {}, 'retries': 0, },

	/**
	 *
	 * Network
	 *
	 **/
    get:  function(url, data, options, success, error) { this._send(this.HttpMethod.GET   , url, data, options, success, error); },
    post: function(url, data, options, success, error) { this._send(this.HttpMethod.POST  , url, data, options, success, error); },
    put:  function(url, data, options, success, error) { this._send(this.HttpMethod.PUT   , url, data, options, success, error); },
    del:  function(url, data, options, success, error) { this._send(this.HttpMethod.DELETE, url, data, options, success, error); },
    get_promise : function(url, data, options) { return this._sendPromise(this.HttpMethod.GET   , url, data, options); },
    post_promise: function(url, data, options) { return this._sendPromise(this.HttpMethod.POST  , url, data, options);  },
    put_promise : function(url, data, options) { return this._sendPromise(this.HttpMethod.PUT   , url, data, options); },
    del_promise : function(url, data, options) { return this._sendPromise(this.HttpMethod.DELETE, url, data, options); },

	/**
	 *
	 * Headers
	 *
     */
    addRequestHeader: function(header, value) { this._headers[header] = value; },
    removeRequestHeader: function(header) { delete this._headers[header]; },
    _setRequestHeaders: function(xhr, requestData) {
        var headers = this._headers;
        if(this._isObj(requestData.options['headers'])) {
            headers = this._objectAssign(this._headers, requestData.options.headers);
        }
        var headKeys = this._objectKeys(headers);
        for (var i in headKeys) {
            var key = headKeys[i];
            var headerVal = requestData.headers[key];
            var value = undefined;
            if(this._isStr(headerVal)) { value = headerVal; }
            else if(this._isFunc(headerVal)) { value = headerVal(requestData.method, requestData.url, requestData.data) }
            else if(this._isArr(headerVal)) { value = headerVal.join(',') }
            else {throw new TypeError('header value must a string, list of strings, callback')}
            if(value) { xhr.setRequestHeader(key, value); }
        }
    },

	/**
	 *
	 * Network
	 *
	 **/
    _sendPromise: function(method, url, data, options) {
        var res, rej;
        var promise = new Promise(function(resolve, reject) {
            res = resolve;
            rej = reject;
        });
        var success = function(data) {res(data);};
        var error = function(data) {rej(data);};

	    this._send(method, url, data, options, success, error);
	    return promise;
	},

    _send: function(method, url, data, options, success, error) {
        return this._ajax({
            method: method || this.HttpMethod.GET,
            url : url || '',
            data : data || {},
            options: this._objectAssign(options || {}, this._default_options),
            success : success || function(){},
            error : error || function(){}
        });
    },

	_getXHR: function() {
        if (typeof XMLHttpRequest !== 'undefined') {
            return new XMLHttpRequest();
        }
        if(!this.lastXmlHttp) {
            for (var i = 0, len = this._xmlHttpVersions.length; i < len; i++) {
                try {
                    xhr = new ActiveXObject(this._xmlHttpVersions[i]);
                    this._lastXmlHttp = this._xmlHttpVersions[i];
                    break;
                } catch (e) {console.error(e);}
            }
        }
        return new ActiveXObject(this._lastXmlHttp);
    },

	_ajax : function(requestData) {
        this._fireEventNetworkStart(requestData);
        var xhr = this._getXHR();

        function ensureReadiness() {
            if (xhr.readyState < 4) { return; }
            if (xhr.readyState === 4) {
                var isSuccess = xhr.status >= 200 && xhr.status < 300 || xhr.status == 304;
                if(isSuccess) {
                    var result = xhr.responseText || xhr.response;
                    if(result && xhr.getResponseHeader('content-type') && xhr.getResponseHeader('content-type').toLowerCase().indexOf(this.ContentType.APPLICATION_JSON) != -1) {
                        result = JSON.parse(result);
                    }
                    this._fireEventNetworkEnd(requestData);
                    requestData.success(result);
                } else {
                  this._fireEventNetworkError(requestData);
                    requestData.error(xhr);
                }
            }
        };
        xhr.onreadystatechange = ensureReadiness.bind(this);

        var hasData = requestData.data && JSON.stringify(requestData.data) !== JSON.stringify({});
        var url = requestData.url;
        if(hasData && requestData.method == this.HttpMethod.GET) {
            url = url + '?' + this._jsonToDataString(requestData.data);
        }
        xhr.open(requestData.method, url, true);

        this._setRequestHeaders(xhr, requestData);

        var sendData = null;
        if(hasData && requestData.method != this.HttpMethod.GET) {
            if(requestData.options.json) {
                sendData = JSON.stringify(requestData.data);
            } else {
                sendData = this._jsonToDataString(requestData.data); // Default ContentType.X_WWW_FORM_URLENCODED
            }
        }
        xhr.send(sendData);
	},

	/**
	 *
	 * Module support
	 *
	 **/
    _modules: {},
	registerModule: function(module_name, module_cb) {
	    if(!this._isFunc(module_cb)) {
	        throw new Error('registerModule module_cb is not a function');
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
	 *
	 * Events support
	 *
	 **/
    _eventListeners: [],
    NetworkListener: function(impls) {
        this.networkStart = impls.hasOwnProperty('networkStart') ? impls['networkStart'] : function(d) {};
        this.networkEnd = impls.hasOwnProperty('networkEnd') ? impls['networkEnd'] : function(d) {};
        this.networkError = impls.hasOwnProperty('networkError') ? impls['networkError'] : function(d) {};
        return this;
    },
    _fireEventNetworkStart: function(requestData) { this._fireEventByKey('networkStart', requestData); },
    _fireEventNetworkEnd:   function(requestData) { this._fireEventByKey('networkEnd', requestData); },
    _fireEventNetworkError: function(requestData) { this._fireEventByKey('networkError', requestData); },
    _fireEventByKey: function(eventKey, options) {
        for(var i = 0 ; i < this._eventListeners.length ; i++) {
            try { this._eventListeners[i][eventKey](options); } catch (e) {console.error(e);}
        }
    },
    addNetworkListener: function(networkListener) {
        if(!networkListener || !(networkListener instanceof this.NetworkListener)) {
            throw 'networkListener must and "NetworkListener" instance to handle [networkStart, networkEnd, networkError]'
        }
        this._eventListeners.push(networkListener);
    },
    removeNetworkListener: function(networkListener) {
        for(var i in this._eventListeners) {
            if(this._eventListeners[i] === networkListener) { this._eventListeners.splice(i, 1); break; }
        }
    },

    /**
     *
     * Utils
     *
     **/
    _isStr: function(s) {return s && s.constructor === String;},
    _isStrBlank: function(s) {return  s.trim() === '';},
    _isBool: function(b) {return typeof b !== 'boolean';},
    _isUndef: function(o) {return typeof o === 'undefined';},
    _isFunc: function(f) {return typeof f === 'function';},
    _isObj: function(o) {return o && o.constructor === Object;},
    _isArr: function(o) {return o && o.constructor === Array;},
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
        var result = [], prop;
        var hasOwnProp = Object.prototype.hasOwnProperty;
        for (prop in obj) {
            if (hasOwnProp.call(obj, prop)) { result.push(prop); }
        }
        return result;
    },
    _objectAssign: function() {
        var result = {};
        for(var i in arguments) {
            var obj = arguments[i];
            if (!this._isObj(obj)) {throw new TypeError('_objectAssign accepts only objects');}
            var objKeys = this._objectKeys(obj);
            for(var keyIndex in objKeys) {
                var key = objKeys[keyIndex];
                result[key] = obj[key];
            }
        }
        return result;
    }
};
module.exports = NetworkClient;

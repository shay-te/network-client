var _getSupportedXHR = function() {
    var _xmlHttpVersions = ['MSXML2.XmlHttp.5.0', 'MSXML2.XmlHttp.4.0', 'MSXML2.XmlHttp.3.0', 'MSXML2.XmlHttp.2.0', 'Microsoft.XmlHttp'];
    if(!this.lastXmlHttp) {
        for (var i = 0, len = _xmlHttpVersions.length; i < len; i++) {
            try {
                xhr = new ActiveXObject(_xmlHttpVersions[i]);
                return _xmlHttpVersions[i];
            } catch (e) {}
        }
    }
}

var NetworkClient = {
    HttpMethod: { 'GET':'GET', 'POST':'POST', 'PUT':'PUT', 'DELETE':'DELETE' },
    ContentType: {
        'APPLICATION_JSON': 'application/json',
        'X_WWW_FORM_URLENCODED': 'application/x-www-form-urlencoded'
    },
    _default_options: { 'json': false, 'headers': {}, 'retries': 0, 'backOffFactor': 0, 'store': false, 'storeExpires': true, 'storeExpiration': undefined},

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
     _headers: {},
    addRequestHeader: function(header, value) { this._headers[header] = value; },
    removeRequestHeader: function(header) { delete this._headers[header]; },
    _setRequestHeaders: function(xhr, method, url, data, options) {
        var headers = this._objectAssign(this._headers, options.headers);
        var headKeys = this._objectKeys(headers);
        for (var i in headKeys) {
            var key = headKeys[i];
            var headerVal = headers[key];
            var value = undefined;
            if(this._isStr(headerVal)) { value = headerVal; }
            else if(this._isFunc(headerVal)) { value = headerVal(method, url, data, options) }
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
        var promise = new Promise(function(resolve, reject) { res = resolve; rej = reject; });
        var success = function(data) {res(data);};
        var error = function(data) {rej(data);};
	    this._send(method, url, data, options, success, error);
	    return promise;
	},

    _send: function(method, url, data, options, success, error) {
        if(method && !this._isStr(method)) {throw new TypeError('method must be a string');}
        if(url && !this._isStr(url)) {throw new TypeError('url must be a string');}
        if(data && !this._isObj(data)) {throw new TypeError('data must be a object');}
        if(options && !this._isObj(options)) {throw new TypeError('options must be a object');}
        if(success && !this._isFunc(success) || error && !this._isFunc(error)) {throw new TypeError('success/error callback must be a function');}

        var fullOptions = this._objectAssign(this._default_options, options || {});
        if(fullOptions.retries > 0) {
            fullOptions = this._objectAssign(fullOptions, {retries: --fullOptions.retries});
        }

        this._fireEventNetworkStart(method, url, data, options);
        this._ajax(
            method || this.HttpMethod.GET,
            url || '',
            data || {},
            fullOptions,
            function(responseData) {
                try { responseData = JSON.parse(responseData); } catch (e) {}
                this._fireEventNetworkEnd(method, url, data, options);
//                storeResultsPermanently
                success(responseData)
            }.bind(this),
            function(xhr){
                if(fullOptions.retries > 0) {
                    setTimeout(
                        function() { this._send(method, url, data, fullOptions, success, error) },
                        fullOptions.backOffFactor
                    )
                    return; // on retry there is no need to call back again
                }
                this._fireEventNetworkError(method, url, data, options);
                error(xhr);
            }.bind(this)
        );
    },

	_ajax: function(method, url, data, options, success, error) {
        var xhr = this._getXHR();
        xhr.onreadystatechange = function() {
            if (xhr.readyState < 4) { return; }
            if (xhr.readyState === 4) {
                var isSuccess = xhr.status >= 200 && xhr.status < 300 || xhr.status == 304;
                if(isSuccess) {
                    success(xhr.responseText || xhr.response);
                } else {
                    error(xhr);
                }
            }
        }.bind(this);

        var hasData = data && JSON.stringify(data) !== JSON.stringify({});
        var url = url;
        var sendData = null;
        if(hasData) {
            if(method == this.HttpMethod.GET) {
                url = url + '?' + this._jsonToDataString(data);
            } else {
                if(options.json) {
                    sendData = JSON.stringify(data);
                } else {
                    sendData = this._jsonToDataString(data); // X_WWW_FORM_URLENCODED
                }
            }
        }
        xhr.open(method, url, true);
        this._setRequestHeaders(xhr, method, url, data, options);
        xhr.send(sendData);
	},
    _lastXmlHttp: _getSupportedXHR(),
	_getXHR: function() {
        if (typeof XMLHttpRequest !== 'undefined') { return new XMLHttpRequest(); }
        return new ActiveXObject(this._lastXmlHttp);
    },

	/**
	 *
	 * Module support
	 *
	 **/
    _modules: {},
    _module_validation : new RegExp(!/[^a-zA-Z0-9_]/),
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
        this.networkStart = impls.hasOwnProperty('networkStart') ? impls['networkStart'] : function(method, url, data, options) {};
        this.networkEnd = impls.hasOwnProperty('networkEnd') ? impls['networkEnd'] : function(method, url, data, options) {};
        this.networkError = impls.hasOwnProperty('networkError') ? impls['networkError'] : function(method, url, data, options) {};
        return this;
    },
    _fireEventNetworkStart: function(method, url, data, options) { this._fireEventByKey('networkStart', method, url, data, options); },
    _fireEventNetworkEnd:   function(method, url, data, options) { this._fireEventByKey('networkEnd', method, url, data, options); },
    _fireEventNetworkError: function(method, url, data, options) { this._fireEventByKey('networkError', method, url, data, options); },
    _fireEventByKey: function(eventKey, method, url, data, options) {
        for(var i = 0 ; i < this._eventListeners.length ; i++) {
            try { this._eventListeners[i][eventKey](method, url, data, options); } catch (e) {console.error(e);}
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

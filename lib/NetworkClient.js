var NetworkClient = function(defaultConfigOverride){
    var HttpMethod = { "GET":"GET", "POST":"POST", "PUT":"PUT", "DELETE":"DELETE" };
    this.HttpMethod = HttpMethod;

    /**
     *
     * Utils
     *
     **/
    function _error(msg) { if (typeof console !== "undefined" && typeof console.error !== "undefined") { console.error(msg); } }
    function _isBool(b) {return typeof b !== "boolean";}
    function _isArr(o) {return o && o.constructor === Array;}
    function _isStr(s) {return (typeof s === "string") ? true : false;}
    function _isStrBlank(s) {return (_isStr(s) && s.replace(/^\s+|\s+$/g, "") === "") ? true : false;}
    function _isFunc(f) {return typeof f === "function";}
    function _isObj(o) {return o && o.constructor === Object;}
    function _isInt(str) {return ((str|0) == str && str != "") || str === 0;}
    function _jsonToDataString(data) {
        var keys = _objectKeys(data);
        keys.sort()
        var result = [];
        for(var i in keys) {
            var key = keys[i];
            result.push(encodeURIComponent(key) + "=" + (data[key] != undefined ? encodeURIComponent(data[key]) : ""))
        }
        return result.join("&").replace(/%20/g, "+");
    }
    function _objectKeys(obj) {
        if (!_isObj(obj)) {throw new TypeError("_objectKeys called on non-object");}
        var result = [], prop;
        var hasOwnProp = Object.prototype.hasOwnProperty;
        for (prop in obj) {
            if (hasOwnProp.call(obj, prop)) { result.push(prop); }
        }
        return result;
    }
    function _objectAssign() {
        var result = {};
        for(var i in arguments) {
            var obj = arguments[i];
            if (!_isObj(obj)) {throw new TypeError("_objectAssign accepts only objects");}
            var objKeys = _objectKeys(obj);
            for(var keyIndex in objKeys) {
                var key = objKeys[keyIndex];
                result[key] = obj[key];
            }
        }
        return result;
    }
    function _now() {
        return (!Date.now) ? new Date().getTime() : Date.now();
    }
    function _storageSupported() {
        try {
            if(typeof localStorage != "undefined") {
                localStorage.setItem("--key--", "--val--");
                localStorage.removeItem("--key--");
                return true;
            }
        } catch (exception) {}
        return false;
    }
    var _localStorageFill = {
        _data: {},
        setItem: function(id, val) { return this._data[id] = String(val); },
        getItem: function(id) { return this._data[id]; },
        removeItem: function(id) { return delete this._data[id]; },
        clear: function() { return this._data = {}; }
    }
    function _getSupportedXHR() {
        var _xmlHttpVersions = ["MSXML2.XmlHttp.5.0", "MSXML2.XmlHttp.4.0", "MSXML2.XmlHttp.3.0", "MSXML2.XmlHttp.2.0", "Microsoft.XmlHttp"];
        for (var i = 0, len = _xmlHttpVersions.length; i < len; i++) {
            try {
                xhr = new ActiveXObject(_xmlHttpVersions[i]);
                return _xmlHttpVersions[i];
            } catch (e) {}
        }
    }
    function _buildUrl(baseURL, path) {
        if(!_isStrBlank(baseURL)) {
            return baseURL.replace(/\/+$/g, "") + "/" + (path || "").replace(/^\/+/g, "");
        }
        return path;
    }

	/**
	 *
	 * Promise
	 *
	 **/
	var _Promise= ( function() {return (typeof Promise !== "undefined" && Promise.toString().indexOf("[native code]") !== -1) ? Promise : undefined;} )();
	this.setPromise = function(promiseObject) { _Promise = promiseObject }

	/**
	 *
	 * Network
	 *
	 **/
    var _default_request_config = { baseURL: "", json: false, headers: {}, retries: 0, backOffFactor: 0, store: false, storeExpiration: 0, debug: false, withCredentials: false};
    var _request_config = defaultConfigOverride ? _objectAssign(_default_request_config, defaultConfigOverride) : _default_request_config;

    this.get =  function(url, data, config, success, error) { _send(this.HttpMethod.GET   , url, data, config, success, error); }
    this.post = function(url, data, config, success, error) { _send(this.HttpMethod.POST  , url, data, config, success, error); }
    this.put =  function(url, data, config, success, error) { _send(this.HttpMethod.PUT   , url, data, config, success, error); }
    this.del =  function(url, data, config, success, error) { _send(this.HttpMethod.DELETE, url, data, config, success, error); }
    this.use =  function(method, url, data, config, success, error) { _send(method, url, data, config, success, error); }
    this.get_promise  = function(url, data, config) { return _sendPromise(this.HttpMethod.GET   , url, data, config); }
    this.post_promise = function(url, data, config) { return _sendPromise(this.HttpMethod.POST  , url, data, config); }
    this.put_promise  = function(url, data, config) { return _sendPromise(this.HttpMethod.PUT   , url, data, config); }
    this.del_promise  = function(url, data, config) { return _sendPromise(this.HttpMethod.DELETE, url, data, config); }
    this.use_promise  = function(method, url, data, config) { return _sendPromise(method, url, data, config); }

	/**
	 *
	 * Network Internal
	 *
	 **/
    var _lastXmlHttp = _getSupportedXHR();
    function _sendPromise(method, url, data, config) {
        if(!_Promise) {
            throw new TypeError("Promise not supported in this platform, please set alternative promise object using \"NetworkClient.setPromise(PolyfillPromiseObject)\"");}
        var res, rej;
        var promise = new _Promise(function(resolve, reject) { res = resolve; rej = reject; });
        var success = function(data, status) {
            try{
                res({data: data, status: status});
            }catch(err) {
                if(config && _isObj(config) && config.debug) {
                    _error("ERROR: method:" + method + ", fullUrl:" + fullUrl + ", data:" + _jsonToDataString(data || {}) + ", config:" + _jsonToDataString(fullConfig || {}));
                }
                rej(err);
            }
        };
        var error = function(data) {rej(data);};
	    _send(method, url, data, config, success, error);
	    return promise;
	}

    function _send(method, url, data, config, success, error) {
        if(method && !_isStr(method)) {throw new TypeError("method must be a string");}
        if(url && !_isStr(url)) {throw new TypeError("url must be a string");}
        if(config && !_isObj(config)) {throw new TypeError("config must be a object");}
        if((success && !_isFunc(success)) || (error && !_isFunc(error))) {throw new TypeError("success/error callback must be a function");}
        // Default
        if(!success) { success = function(){};}
        if(!error) { error = function(){};}

        var fullConfig = _objectAssign(_request_config, config || {});
        if(fullConfig.retries > 0) {
            fullConfig = _objectAssign(fullConfig, {retries: --fullConfig.retries});
        }

        var fullUrl = _buildUrl(fullConfig.baseURL, url);
        if(fullConfig.store) {
            var sorted_result = _fromStorage(method, fullUrl, data);
            if(sorted_result) {
                _fireNetworkStorage(method, fullUrl, data, fullConfig);
                success(sorted_result);
                return;
            }
        }
        _fireNetworkStart(method, fullUrl, data, fullConfig);
        _ajax(
            method, fullUrl, data, fullConfig,
            function(responseData, status) {
                try { responseData = JSON.parse(responseData); } catch (e) {}
                _fireNetworkEnd(method, fullUrl, data, fullConfig, status);
                if(fullConfig.store) {
                    _toStorage(method, fullUrl, data, responseData, fullConfig.storeExpiration);
                }
                success(responseData, status);
            },
            function(xhr){
                if((xhr.status == 0 || xhr.status == 408) && fullConfig.retries > 0) {
                    setTimeout(
                        function() { _send(method, url, data, fullConfig, success, error) },
                        fullConfig.backOffFactor
                    )
                    return; // on retry there is no need to call back again
                }_build_store_key
                _fireNetworkError(method, fullUrl, data, fullConfig, xhr.status);
                if(fullConfig.debug) {
                    _error("ERROR: method:" + method + ", fullUrl:" + fullUrl + ", data:" + _jsonToDataString(data || {}) + ", config:" + _jsonToDataString(fullConfig || {}));
                }
                error(xhr);
            }
        );
    }

	function _ajax (method, url, data, config, success, error) {
        var xhr = undefined;
        if (typeof XMLHttpRequest !== "undefined") {
            xhr = new XMLHttpRequest();
        } else {
            xhr = new ActiveXObject(_lastXmlHttp);
        }
        xhr.onreadystatechange = function() {
            if (xhr.readyState < 4) { return; }
            if (xhr.readyState === 4) {
                if(xhr.status >= 200 && xhr.status < 300 || xhr.status == 304) {
                    success(xhr.responseText || xhr.response, xhr.status);
                } else {
                    error(xhr);
                }
            }
        }

        var url = url;
        var sendData = data;
        if(data && _isObj(data)) {
            if(method.toUpperCase() == HttpMethod.GET) {
                url = url + "?" + _jsonToDataString(data);
            } else {
                if(config.json) {
                    sendData = JSON.stringify(data);
                } else {
                    sendData = _jsonToDataString(data); // X_WWW_FORM_URLENCODED
                }
            }
        }
        xhr.open(method, url, true);
        _setRequestHeaders(xhr, method, url, data, config);
        if(config.withCredentials){
            xhr.withCredentials = true;
        } else {
            xhr.withCredentials = false;
        }
        
        xhr.send(sendData);
	}

  /**
   *
   * Headers
   *
   */
    var _headers = {}
    this.addRequestHeader = function(header, value) { _headers[header] = value; }
    this.removeRequestHeader = function(header) { delete _headers[header]; }
    var _setRequestHeaders = function(xhr, method, url, data, config) {
        var headers = _objectAssign(_headers, config.headers);
        var headKeys = _objectKeys(headers);
        for (var i in headKeys) {
            var key = headKeys[i];
            var headerVal = headers[key];
            var value = undefined;
            if(_isStr(headerVal)) { value = headerVal; }
            else if(_isFunc(headerVal)) { value = headerVal(method, url, data, config) }
            else if(_isArr(headerVal)) { value = headerVal.join(",") }
            if(value) { xhr.setRequestHeader(key, value); }
        }
    }

	/**
	 *
	 * Module support
	 *
	 **/
    var _module_validation = new RegExp(!/[^a-zA-Z0-9_]/);
	this.registerModule = function(module_name, module_cb) {
	    if(!_isFunc(module_cb)) {
	        throw new Error("registerModule module_cb is not a function");
	    }
        if(_module_validation.test(module_name)) {
            throw new Error("registerModule, module_name is invalid. number,letters,underscore only!");
        }
        var functionArgs = Array.prototype.slice.call(arguments).splice(2, arguments.length);
        functionArgs.unshift(this);
        var module = module_cb.apply(module_cb, functionArgs);
        if(!module || !_isObj(module)) { throw new Error("registerModule, module_cb return val must be set and be an object."); }
        this[module_name] = module;
	}

	/**
	 *
	 * Events support
	 *
	 **/
    var _eventListeners = [];
    this.NetworkListener = function(impls) {
        this.networkStart = impls.hasOwnProperty("networkStart") ? impls["networkStart"] : function(method, url, data, config) {};
        this.networkEnd = impls.hasOwnProperty("networkEnd") ? impls["networkEnd"] : function(method, url, data, config) {};
        this.networkError = impls.hasOwnProperty("networkError") ? impls["networkError"] : function(method, url, data, config) {};
        this.networkStorage = impls.hasOwnProperty("networkStorage") ? impls["networkStorage"] : function(method, url, data, config) {};
        return this;
    }
    var _fireNetworkStart = function(method, url, data, config) { _fireEventByKey("networkStart", method, url, data, config); }
    var _fireNetworkEnd = function(method, url, data, config, status) { _fireEventByKey("networkEnd", method, url, data, config, status); }
    var _fireNetworkError = function(method, url, data, config, status) { _fireEventByKey("networkError", method, url, data, config, status); }
    var _fireNetworkStorage = function(method, url, data, config) { _fireEventByKey("networkStorage", method, url, data, config); }
    var _fireEventByKey = function(eventKey, method, url, data, config, status) {
        for(var i = 0 ; i < _eventListeners.length ; i++) {
            try { _eventListeners[i][eventKey](method, url, data, config, status); } catch (e) {_error(e);}
        }
    }
    this.addNetworkListener= function(networkListener) {
        if(!networkListener || !(networkListener instanceof this.NetworkListener)) {
            throw "networkListener must and \"NetworkListener\" instance to handle [networkStart, networkEnd, networkError]"
        }
        _eventListeners.push(networkListener);
    }
    this.removeNetworkListener= function(networkListener) {
        for(var i in _eventListeners) {
            if(_eventListeners[i] === networkListener) { _eventListeners.splice(i, 1); break; }
        }
    }
    /**
     *
     * Storage
     *
     **/
    var _creation_time = _now();
    var _storage = _storageSupported() ? localStorage : _localStorageFill;
    function _build_store_key (method, url, data) {
        if(!method || !url) {throw new TypeError("Store error \"method\" and \"url\" must be set"); }
        return (method + "-" + url + "-" + (data ? _jsonToDataString(data) : "{}" )).toLowerCase().replace(/\s/g, "").replace(/\\/g, "#");
    }
    function _toStorage(method, url, data, storeData, storeExpiration) {
        if((storeExpiration || storeExpiration == "") && (!_isInt(storeExpiration) || parseInt(storeExpiration) < 0)) { throw new TypeError("storeExpiration can be \"undefined\" or >= 0"); }
        if(_isInt(storeExpiration)) { storeExpiration = parseInt(storeExpiration); }
        _storage.setItem(_build_store_key(method, url, data),
                              JSON.stringify({time: _now(), data: storeData, expires: storeExpiration}));
    }
    function _fromStorage(method, url, data) {
        var key = _build_store_key(method, url, data);
        var storeStr = _storage.getItem(key);
        if(storeStr) {
            var storeItem = JSON.parse(storeStr);
            if  (storeItem.expires === undefined || // Never expires
                (storeItem.expires === 0 && _creation_time < storeItem.time) || // Expires on reload
                (storeItem.expires + storeItem.time) > _now()) { // Expiration of time
                return storeItem.data;
            } else {
                _storage.removeItem(key);
            }
        }
        return undefined;
    }

    /**
     *
     * Expose methods for tests
     *
     **/
    function _reset_creation_time() {_creation_time = _now();}
    if(typeof process !== "undefined" && process.hasOwnProperty("env") && process.env && process.env.NODE_ENV === "test") {
        this._storage = _storage; this._creation_time = _creation_time; this._build_store_key = _build_store_key; this._toStorage = _toStorage; this._fromStorage = _fromStorage; this._reset_creation_type = _reset_creation_time;
    }

    return this;
};
if(typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = NetworkClient;
    module.exports.default = NetworkClient;
}

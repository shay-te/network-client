var Network = {
    _eventListeners: [],
    _lastXmlHttp: undefined,
    _xmlHttpVersions: [ 'MSXML2.XmlHttp.5.0', 'MSXML2.XmlHttp.4.0', 'MSXML2.XmlHttp.3.0', 'MSXML2.XmlHttp.2.0', 'Microsoft.XmlHttp' ],
    _modules: {},
    _module_validation : new RegExp(!/[^a-zA-Z0-9_]/),
    _headers: {},
    HttpMethod: { 'GET':'GET', 'POST':'POST', 'PUT':'PUT', 'DELETE':'DELETE' },
    ContentType: {
        'APPLICATION_JSON': 'application/json',
        'X_WWW_FORM_URLENCODED': 'application/x-www-form-urlencoded'
    },

	/**
	 * Network
	 **/
    get: function(url, data, contentType, options, success, error) { this._send(this.HttpMethod.GET, url, data, contentType, options, success, error); },
    post: function(url, data, contentType, options, success, error) { this._send(this.HttpMethod.POST, url, data, contentType, options, success, error); },
    put: function(url, data, contentType, options, success, error) { this._send(this.HttpMethod.PUT, url, data, contentType, options, success, error); },
    del: function(url, data, contentType, options, success, error) { this._send(this.HttpMethod.DELETE, url, data, contentType, options, success, error); },
    get_promise: function(url, data, contentType, options) { this._sendPromise(this.HttpMethod.GET, url, data, contentType, options); },
    post_promise: function(url, data, contentType, options) { this._sendPromise(this.HttpMethod.POST, url, data, contentType, options); },
    put_promise: function(url, data, contentType, options) { this._sendPromise(this.HttpMethod.PUT, url, data, contentType, options); },
    del_promise: function(url, data, contentType, options) { this._sendPromise(this.HttpMethod.DELETE, url, data, contentType, options); },

    _validateHeader: function(header, value) {
        if (!this._isStr(header) && this._isStrBlank(header)) { throw 'key must be set to string value'; }
        if (!value) { throw 'value must defined'; }
        if (!this._isStr(value) && !this._isArr(value) && !this._isFunc(value)) { throw 'value must a string, list of strings, callback'; }
    },

    /**
     *  header: the header name
     *  value: string, array of string, callback
     */
    addRequestHeader: function(header, value) {
        this._validateHeader(header, value)
        this._headers[header] = value;
    },

    removeRequestHeader: function(header) { delete this._headers[header]; },

    _sendPromise: function(method, url, data, contentType, options) {
        var res, rej;
        var promise = new Promise(function(resolve, reject) {
            res = resolve;
            rej = reject;
        });
        var success = function(data) {res(data);};
        var error = function(data) {rej(data);};

	    this._send(method, url, data, contentType, options, success, error);
	    return promise;
	},

    _send: function(method, url, data, contentType, options, success, error) {
        return this._ajax({
            method: method || this.HttpMethod.GET,
            url : url || '',
            data : data || {},
            contentType: contentType,
            options: options || {},
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

    _setRequestHeaders: function(xhr, headers, method, url, data, contentType) {
        var headKeys = this._objectKeys(headers);
        for (var i in headKeys) {
            var key = headKeys[i];
            var headerVal = headers[key];
            var value = undefined;
            if(this._isStr(headerVal)) { value = headerVal; }
            else if(this._isFunc(headerVal)) { value = headerVal(method, url, data, contentType) }
            else if(this._isArr(headerVal)) { value = headerVal.join() }
            if(value) { xhr.setRequestHeader(key, value); }
        }
    },

	_ajax : function(requestData) {
        this.fireEventNetworkStart(requestData);
        var xhr = this._fetchXHR();

        function ensureReadiness() {
            if (xhr.readyState < 4) { return; }
            if (xhr.readyState === 4) {
                var isSuccess = xhr.status >= 200 && xhr.status < 300 || xhr.status == 304;
                if(isSuccess) {
                    var result = xhr.responseText || xhr.response;
                    if(result && xhr.getResponseHeader('content-type').trim().toLowerCase() == this.ContentType.APPLICATION_JSON) {
                        result = JSON.parse(result);
                    }
                    this.fireEventNetworkEnd(requestData);
                    requestData.success(result);
                } else {
                  this.fireEventNetworkError(requestData);
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

        // Set request header values
        this._setRequestHeaders(xhr, this._headers, requestData.method, url, requestData.data, requestData.contentType); // Permanent
        if(this._isObj(requestData['options']) && this._isObj(requestData.options['headers'])) {
            this._setRequestHeaders(xhr, requestData.options.headers, requestData.method, url, requestData.data, requestData.contentType); // Permanent
        }


        var sendData = null;
        if(hasData && requestData.method != this.HttpMethod.GET) {
            xhr.setRequestHeader('content-type', requestData.contentType);
            if(requestData.contentType === this.ContentType.X_WWW_FORM_URLENCODED) {
                sendData = this._jsonToDataString(requestData.data);
            } else if(requestData.contentType === this.ContentType.APPLICATION_JSON) {
                sendData = JSON.stringify(requestData.data);
            } else {
                console.error('unknown contentType, how to send the data ?');
            }
        }
        xhr.send(sendData);
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
    }
};
export default Network;

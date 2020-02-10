# NetworkClient

## What is Network Client

Network-Client it's a small footprint javascript REST client. 
aim to give advanced capabilities in a declarative simple interface. 
it has no dependencies and written to support old browses. 

### Installing

```bash
npm install network-client
```

### Example

    https://github.com/shacoshe/network-client/tree/master/example

### Running tests
    
    npx mocha --full-trace --exit

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

**Shay Tessler**  - [github](https://github.com/shacoshe)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details


# Instructions


# Global Request headers

First, we will configure Network Client to set the headers the are important to us 

```javascript
var NetworkClient = require("network-client");
var Network = new NetworkClient();

Network.addRequestHeader("Cache-control", ["no-cache", "no-store"]);
Network.addRequestHeader("Pragma", "no-cache");
Network.addRequestHeader("Expires", "0");
...
Network.removeRequestHeader("some-header");
```

we can also add conditional headers 

```javascript
var tokenElement = document.getElementsByName("csrfmiddlewaretoken")
if(tokenElement && tokenElement.length > 0) {
    var checkCsrfHeader = function(method, url, data, contentType) {
        if(!(/^(GET|HEAD|OPTIONS|TRACE)$/.test(method))) {
            return tokenElement[0].value;
        }
        return; // Don't return anything will skip this header
    }
    Network.addRequestHeader("X-CSRFToken", checkCsrfHeader);
}
```

# Promise Support

By default, NetwokrClient will use the native Promise object.   
in cases where native Promise is not available, you can tell NetworkClient what is you Promise object.
 
```javascript
Network.setPromise(MyPromiseObject);
```

# Network Events

NetworkClient allows us to be notified about API calls `start`, `end` and `error`.   
By creating a `new NetworkClient.NetworkListener` object we can register it to NetworkClient    

### Creating a new "NetworkListener 

```javascript
var netowrkListener = new NetworkClient.NetworkListener({
    networkStart: function(method, url, data, options) {
        if(method == NetworkClient.HttpMethod.GET && url.indexOf("/user") > -1) {
            //Show saving user information notifications
        }
    },
    networkEnd: function(method, url, data, options) {
    },
    networkError: function(method, url, data, options) {
        console.error("Error while calling url: " + url);
        if(method == NetworkClient.HttpMethod.POST &&  url != "../error") {
            NetowrkClient.errors.register(data)
        }
    }    
})
Network.addNetworkListener(networkListener);

...
...

Network.removeNetworkListener(networkListener);
```


# Request Options

Any request can be configured individually if no configuration options were specified the default options are used.   
options are represented as a JSON object and can be overridden in the following manner 

```javascript 
Network = new NetworkClient({"json": true, "retries": 0, "backOffFactor": 0, "store": false, ...});
```

Available options are

* `json` true/false indicating of the request should be send as a `json` or `form`. (default: `false`)
* `headers` additional to  `addRequestHeader/removeRequestHeader`. (default: `{}`)
* `retries` number of retires if the request return with `status_code >= 300 and status_code != 304`. (default: `0`)
* `backOffFactor` number of milli seconds between each retry. (default: `0`)
* `store` true/false when a request is successful the result will be stored. (all method types can be stored)     
         calling another request with the same methods, url, params will cause fetching the last stored result. (default: `false`)  
* `storeExpiration` have 3 options that control how much time results are stored. 
    * `undefined` never expires, will use `localStorage` if available, otherwise will use a polyfill that will expire on reload.
    * `0` expires on reload (default option)
    * `123..` time in milliseconds     



### Declaring Modules

Modules are a greate way to group REST operation, make seperation of concerns and add load them only when needed.

###### networkItem.js
```javascript
Network.registerModule('item', function(network, additionalData) {
    var options = {};
	return {
		get: function(item_id, success, error) {
			return network.get_promise('api/item/' + item_id);
		},
		set: function(item_id, data, success, error) {
			return network.post_promise('api/item/' + item_id, data);
		}
	};
});
```

```javascript
Network.item.get(1);
Network.item.set(2, {'x':'y'});
```
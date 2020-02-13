# Network-Client

Network-Client it's a small footprint javascript REST client.    
Aim to give a declarative simple interface with capabilities of storage, retries And event handling.    
it has no dependencies and written to support old browsers like IE8.  

### Installing

```bash
npm install network-client
```

### Example

See the tests for more examples.

```http
https://github.com/shacoshe/network-client/tree/master/test
```

### Running tests

```shell
npx mocha --exit
```

Running a sample of tests on the browser, run a simple node server

```shell
cd test/web
node index.js
```

Open the browser and navigate to 

```http
http://localhost:8080/
```



## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

**Shay Tessler**  - [github](https://github.com/shacoshe)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details

# Instructions






## Global Request headers
Supported headers values are String, Array and Function
```javascript
var NetworkClient = require("network-client");
var Network = new NetworkClient();

Network.addRequestHeader("Cache-control", ["no-cache", "no-store"]);
Network.addRequestHeader("Pragma", "no-cache");
Network.addRequestHeader("Expires", "0");

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

...

Network.removeRequestHeader("some-header");
```



## Promise Support

By default, NetwokrClient is using the native Promise object.
in cases where native Promise is not available, NetworkClient can be told what is the Promise object.

```javascript
Network.setPromise(MyPromiseObject);
```



## Network Events

NetworkClient can notify `NetworkClient.NetworkListener` event listeners on API calls such as `start`, `end`, `error` And when `storage` is used.    

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



## Request Configuration

The configuration is a simple JSON object that can be used globally for all requests, And for an individual request. When no configuration specified the default config object is used.  

Global configuration can be set at the creation of NetwortClient. (see next example for specific request configuration.) 

```javascript 
Network = new NetworkClient({"json": true, ..});
```

Available options are

* `baseURL` String suffix for the request URL,  (default: `""`)
* `json` true/false. Indicating the request should be send as a `JSON` or `FORM` (`encodeURIComponent` string) . (default: `false`)
* `headers` additional to  `addRequestHeader/removeRequestHeader`. (default: `{}`)
* `retries` number of retires in case when the request return with `status_code == 0 OR status_code == 408`. (default: `0`)
* `backOffFactor` number of milliseconds between each retry. (default: `0`)
* `store` true/false. When a request is successful the result will be stored.  Calling another request with the same methods, URL And parameters will cause get the last stored result. (all `METHOD` types will be store when data is returned) (default: `false`)  
* `storeExpiration` have 3 options that control for how long results are stored.  (default: `0`).
    * `undefined` never expires, will use `localStorage` if available, otherwise will use a polyfill that will expire on reload.
    * `0` expires on reload 
    * `123..` time in milliseconds     



## Modules

Modules are a great way to group REST operation, make separation of concerns And load them only when needed.

The module is a simple `javascript function` that accepts the instance of `NetworkClient` as the first parameter. The parameters following after it is passed by the code who registration of the module (see example).

`NetowrkClient` instance expose functions to send HTTP request. with or without Promise support

Available functions to send with promise support.

```javascript
network.get_promise(url/path, data, configutation)
network.set_promise(url/path, data, configutation)
network.put_promise(url/path, data, configutation)
network.del_promise(url/path, data, configutation)
network.use_promise(method, url/path, data, configutation)
```


```javascript
network.get(url/path, data, configutation, success, error)
network.set(url/path, data, configutation, success, error)
network.put(url/path, data, configutation, success, error)
network.del(url/path, data, configutation, success, error)
network.use(method, url/path, data, configutation, success, error)
```


When sending a `GET` request the data automatically be sent in the URL




###### networkItem.js
```javascript
var moduleItems = function(network, additionaArgument1, additionaArgument2) {
   return {
      get: function(item_id) {
         return network.get_promise('api/item/' + item_id);
      },
      set: function(item_id, data) {
         return network.post_promise('api/item/' + item_id, data);
      }
   };
}
```

After the module is registered we can call it in the following why

```javascript
var arg1 = ...., arg2 = ...;
Network.registerModule('items', moduleItems, arg1, arg2);

Network.item.get(1);
Network.item.set(2, {'x':'y'});
```

### Declaring Modules Using callbacks

###### networkPosts.js

```javascript
var modulePosts = function(network) {
   return {
      get: function(post_id, success, error) {
         return network.get('api/posts/' + item_id, {}, {}, function(data) {
                                                           ... process the data
                                                           var proccesedData= ...
                                                           success(proccesedData);
                                                       }, error);
      },
      create: function(data, success, error) {
         return network.post('api/posts', data, {}, success, error);

      }
   };
}
```

And using the module

```javascript
Network.registerModule('posts', modulePosts);

Network.posts.get(1, function(data) {
                   ... do somthing 
                });
```


### Declaring Modules With Configuration

In case we will fetch information that is large and may not change we can store it in browser

###### networkDetails.js

```javascript
var moduleDetails = function(network, additionaArgument1) {
   return {
      get: function(data_id) {
            var config = {
                retries: 3, // Try to fetch data 3 times.
                backOffFactor: 505, // Wait 505 miliseconds between requests.
                store: true, // Store the returned data.
                storeExpiration: undefined // Store in localstorage or fallback storage.
            };
         return network.get_promise('api/data/' + data_id, {}, config);
      },
   };
}
```

And using the module

```javascript
Network.registerModule('details', moduleDetails, "additionaArgument1");

var data = await Network.posts.get(1);
```


Thank You For Reading, You are a Star.
<a class="github-button" href="https://github.com/shacoshe/network-client" data-icon="octicon-star" data-size="large" aria-label="Star shacoshe/network-client on GitHub">Star</a>

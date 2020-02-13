# Network-Client

Network-Client it's a small footprint javascript REST client.    
Aim to give a declarative simple interface with capabilities of storage, retries And event handling.    
it has no dependencies and written to support old browsers like IE8.  

### Installing

```bash
npm install network-client
```

### Examples

[https://github.com/shacoshe/network-client/tree/master/test](https://github.com/shacoshe/network-client/tree/master/test)

### Running tests

```shell
npx mocha --exit
```

### Running In The Browser

These are only basic functionalities tests.

```shell
cd test/web
node index.js
```

Open the WEB Browser and navigate to [http://localhost:8080/](http://localhost:8080/)



## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for more details on our code of conduct, and the process for submitting pull requests to us.

## Contributors

**Shay Tessler**  - [github](https://github.com/shacoshe)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details

# Instructions



## Global Request headers

Supported headers values are `String`, `Array` and `Function`.
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

By default, `NetwokrClient` is using the native `Promise` object.
in cases where native `Promise` is not available, `NetworkClient` can be told what is the Promise object.

```javascript
Network.setPromise(MyPromiseObject);
```



## Network Events

`NetworkClient` can notify `NetworkClient.NetworkListener` event listener on API calls such as `start`, `end`, `error` And when `storage` is used.    

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

Global configuration can be set at the creation of `NetwortClient`. For example:

```javascript 
Network = new NetworkClient({"json": true, ..});
```

#### Available Options

* `baseURL` String suffix for the request URL,  (type: `string`, default: `""`)
* `json` Indicating the request should be send as a `JSON` or `FORM` (`encodeURIComponent` string) . (type: `boolean`, default: `false`)
* `headers` Additional to  `addRequestHeader/removeRequestHeader`. (type: `object`, default: `{}`)
* `retries` Number of retires in case when the request return with `status_code == 0 OR status_code == 408`. (type: `number`, default: `0`)
* `backOffFactor` Number of milliseconds between each retry. (type: `number`, default: `0`)
* `store`. When a request is successful the result will be stored.  Calling to another request with the same methods, URL And parameters will get the last stored result. Without sending any request to the server. (All `METHOD` types will be store the return data.) (type: `boolean`, default: `false`)  
* `storeExpiration` have 3 options that control for how long results are stored.  (type: `number`,default: `0`).
    * `undefined` never expires, will use `localStorage` if available, otherwise will use a "polyfill" that will expire on reload.
    * `0` expires on reload 
    * `123..` time in milliseconds  



## Modules

Modules are a great way to group REST operation, make separation of concerns And load them only when they are needed.

The module is a simple `javascript` `function` that accepts an instance of `NetworkClient` for it's first parameter. 
`NetowrkClient` instance expose functions to send HTTP request. with or without Promise.

Available functions to send a request with `Promise`

```javascript
var network = new NetworkClient();
network.get_promise(path, data, configutation)
network.set_promise(path, data, configutation)
network.put_promise(path, data, configutation)
network.del_promise(path, data, configutation)
network.use_promise(method, path, data, configutation)
```

Available functions to send a request with the traditional `success` And `error` callback
```javascript
var network = new NetworkClient();
network.get(path, data, configutation, success, error)
network.set(path, data, configutation, success, error)
network.put(path, data, configutation, success, error)
network.del(path, data, configutation, success, error)
network.use(method, path, data, configutation, success, error)
```



> **NOTICE**: When sending a `GET` request. The request Data will be sent inside the URL as Query String parameters.



## Examples

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

After the module is registered we can call it in the following why.  

```javascript
var additionaArgument1 = ...., additionaArgument2 = ...;
network.registerModule('items', moduleItems, additionaArgument1, additionaArgument2);

await network.items.get(1);
await network.items.set(2, {'x':'y'});
```



### Declaring Modules Using Callbacks

###### networkPosts.js

```javascript
var modulePosts = function(network) {
    var proc_get = function(data, success) {
        ... process the "data" into "proccesedData"
        var proccesedData= ...
        success(proccesedData);
   }
    
   return {
      get: function(post_id, success, error) {
         return network.get('api/posts/' + item_id, {}, {}, 
                            function(data){proc_get(data, success)}, 
                            error);
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



### Request With Configuration

In case we will fetch information that is large and may not change we can store it in browser

###### networkDetails.js

```javascript
var moduleDetails = function(network) {
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
Network.registerModule('details', moduleDetails);

var data = await Network.posts.get(1);
```





### Thank You For Reading !.
### You Are a Star.    
(If you like this project please star it) 

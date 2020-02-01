---
id: configuration
title: Configuration
sidebar_label: Configuration
---

First we will configure Network Client to set the headers the are important to us 

```javascript
Network.addRequestHeader('Cache-control', ['no-cache', 'no-store']);
Network.addRequestHeader('Pragma', 'no-cache');
Network.addRequestHeader('Expires', '0');
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
    Network.addRequestHeader('X-CSRFToken', checkCsrfHeader);
}
```

### Declaring Modules

Modules are a greate way to group REST operation, make seperation of concerns and add load them only when needed.

###### networkSearch.js
```javascript
Network.registerModule('search', function(network) {
	return {
		search: function(lastActivityTime, success, error) {
			network.get('/api/search/' + lastActivityTime, 
                  undefined, 
                  Network.ContentType.APPLICATION_JSON, 
                  undefined, 
                  success, 
                  error);
		},
		saveSearchPreferences: function(searchPreferences, success, error) {
			network.post('/api/search_pref', 
                   searchPreferences, 
                   Network.ContentType.APPLICATION_JSON, 
                   undefined, 
                   success, 
                   error);
		}
	};
});
```
in the example above we are calling to `Network.registerModule` method with two parameter 
`'search'` the name of this network module 

`function(network) {`function that give access an instance of NetworkClient. 

the function return a json object 

---
id: events
title: Events
sidebar_label: Events
---

### The NetworkListener object

NetworkClient allow us to be notified about API calls `start`, `end` and `error`.
 
By create a `new NetworkClient.NetworkListener` object we can pass it with the events that will going to occur.    


### Creating a new "NetworkListener 

```javascript
var NetworkClient = require("network-client");
var netowrkListener = new NetworkClient.NetworkListener({
    networkStart: function(requestData) {
        if(requestData.method == "POST" && requestData.url.indexOf("/user") > -1) {
            //Show saving user information notifications
        }
    },
    networkEnd: function(requestData) {
    },
    networkError: function(requestData) {
        console.error("Error wchile calling url: " + requestData.url); 
    }    
})
NetworkClient.addNetworkListener(networkListener);
```



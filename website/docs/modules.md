---
id: modules
title: Modules
sidebar_label: Modules
---

### Declaring Modules

Modules are a greate way to group REST operation, make seperation of concerns and add load them only when needed.

###### networkItem.js
```javascript
Network.registerModule('item', function(network) {
    var options = {};
	return {
		get: function(item_id, success, error) {
			return network.get_promise('/api/item/' + item_id);
		},
		set: function(item_id, data, success, error) {
			return network.post_promise('/api/item/' + item_id, data);
		}
	};
});
```

```javascript
Network.item.get(1);
Network.item.set(2, {'x':'y'});
```
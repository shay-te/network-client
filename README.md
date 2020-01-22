# Network Client

## What is Network Client

network-client it's a small foot print javascript REST client. 
aim to give advanced capebilities in a declarative simple interface. 
it has no depeendencies and written to support old browsrs. 

### Installing

```bash
npm install network-client
```

### Example

    https://github.com/shacoshe/network-client/tree/master/example


### Configuration
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

## What can i do with network client

##### 1. Pipelining web pages for high performance
Pipelining web pages allow us to stream all available content and resources back to the browser by using single/initial HTTP connection made to fetch HTML page.

###### pros:    
* no need to wait for javascript code to ajax and fetch data  
* more connection available by the browser for resources 
* no network time for opening more TCP(HTTP) connection [1](https://www.cse.iitk.ac.in/users/dheeraj/cs425/lec14.html)
###### cons:    
* dismisses the browser cache mechanism

##### 2. No Setup Required
There is no need for compiling, preparing, optimizing, uglifiing source files
all is done automatically by response configuration.

##### 3. Fast websites with not effort.
Bigpipe Response is analyzing and building exactly what needed and send it back to the browser.    
this includes `HTML, JavaScript, JavaScript Server Side Rendeing, SASS, i18n. and more`

##### 6. Plug-able 
Use any Javascript framework and more. by creating a custom processor you can easily pipe any source file.  
by default [React](https://reactjs.org/) is supported out of the box.

##### 4. Packing easy control 
Bigpipe Response let you config what resource to load, how to bundle it and how to embed it by telling the response object exactly what you need.  

##### 5. i18n optimization
Bigpipe Response uses django built-in internalization and extends it to be supported by javascript components and server side rendering. 


###### SearchBar.jsx
```javascript
class SearchBar extends React.Component { //ES6
    ....
	render() {
export default SearchBar;
```

###### search.html
the HTML fill will have NO closing tags of `</body></htmml>`

```html
<html>
    <head>
        <meta charset="utf-8">
	    <base href="/" target="_blank">
        {% for css_link in css_links %}
            <link rel="stylesheet" media="screen" href="{{css_link}}">
        {% endfor %}
        <script type="text/javascript" src="public/bigpipe.js"></script>
        <script type="text/javascript" src="jsi18n"></script>
        {% for js_link in js_links %}
        <script type="text/javascript" src="{{js_link}}"></script>
        {% endfor %}
    </head>
    <body>
        ...
        <div id="search-bar"> ... </div>
        ....
        <div id="search-results"> ... </div>
        ....
        <div id="chat"> ... </div>
            ....
        <div id="page-bottom"> ... </div>
    ...    
```


###### view_search.py
```javascript


```

### Running tests



## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.


## Authors

**Shay Tessler**  - [github](https://github.com/shacoshe)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details

# Kalix.js
A fast vader jsx transformer and dom handler for bun.js

#Usage

```js
import { document, Element, DOMParser} from 'Kalix/document'
// Vaderjs function
var App = function () {
    let [state, setState] = useState('state', App, [])
    return Element('div', null, 'Hello World', Element('span', null, 'Hello World', state().length))
}

let dom = document.createElement(App())
console.log(dom.html) // <div >Hello World<span >Hello World0 </span> </div>
const parser = new DOMParser() 
const parsed = parser.parseFromString('<div id="div1">Hello<span class="too">Hello</span></div>')
console.log(parsed.body.firstChild.querySelectorAll('*'))
```

# Use Cases

1. SSR - Kalix is used in vaderjs to build pages on the server, before sending to client which gives users better load times!
2. HTTP Response parsing - Kalix could be used to turn http responses into a tree
3. Crawling - you can crawl websites using Kalix to grab their contents.

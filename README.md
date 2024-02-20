# Kalix.js
A fast vader jsx transformer and dom handler for bun.js

#Usage

```js
import { document, Element, DOMParser} from 'Kalix/document'

var App = function () {
    let [state, setState] = useState('state', App, [])
    return Element('div', null, 'Hello World', Element('span', null, 'Hello World', state.length))
}

let dom = document.createElement(App())
console.log(dom.html) // <div >Hello World<span >Hello World0 </span> </div>
const parser = new DOMParser() 
const parsed = parser.parseFromString('<div id="div1">Hello<span class="too">Hello</span></div>')
console.log(parsed.body.firstChild.querySelectorAll('*'))
```

# Kalix.js
A fast vader jsx transformer and dom handler

#Usage

```js
import { document, Element, tree} from 'Kalix/document'

var App = function () {
    let [state, setState] = useState('state', App, [])
    return Element('div', null, 'Hello World', Element('span', null, 'Hello World', state.length))
}

let dom = document.createElement(App())
console.log(dom.html) // <div >Hello World<span >Hello World0 </span> </div>
```

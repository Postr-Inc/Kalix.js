let tree = []

export var document = {
    createElement: (el) => {
        let node = {
            children: [],
            tag: el,
            props: {}, 
            events: [],
            attributes: {},
            id: '',
            querySelector: (el) => {
                switch(true){
                    case  el.startsWith('.'):
                        return node.children.find((child) => child?.props?.className === el.substring(1))
                    case el.startsWith('#'):
                        return node.children.find((child) => child?.id === el.substring(1))
                    default:
                        return node.children.find((child) => child?.tag === el)
                }
            },
            addEventListener: (type, listener) => {
                node.events.push({type, listener})
            },
            
            appendChild: (child) => { 
                node.children.push(child)
            },
            classList: {
                add: (className) => {
                    node.props.className = className
                },
                remove: (className) => {
                    node.props.className = node.props.className.replace(className, '')
                },
                has: (className) => {
                    return node.props.className.includes(className)
                },
                toggle: (className) => {
                    if(node.props.className.includes(className)){
                        node.props.className = node.props.className.replace(className, '')
                    }else{
                        node.props.className += ` ${className}`
                    }
                }
            },
            removeChild: (child) => {
                node.children = node.children.filter((child) => child !== child)
            },
            remove: () => {
                node.children = []
            },
            style: {}, 
            html: '',
            textContent: '',
            innerHTML: '',
            parseHtml: (html) => {
                // use htmlRewriter
            },
            element: () => {
                let el = `
                <${node.tag}
                ${
                    Object.keys(node.props.length > 0 ? node.props : node.attributes).map((prop) => { 
                        return `${prop}="${node.props.length > 0 ? node.props[prop] : node.attributes[prop]}"`  
                    }).join(' ')
                }
                >${node.children.map((child) =>{
                    if(child.tag === 'TEXT_ELEMENT'){
                        return child.props.nodeValue
                    }else{
                        if(child.children.length > 0){
                            return Object.keys(child).includes('element') ? child.element() : child.htmlNode.element()
                        }
                    }
                }).join('')}
                ${
                    node.innerHTML   + node.textContent
                }
                </${node.tag}>
                ` 
                return el.replace(/\s+/g, ' ').trim()
            }
        } 
        if(!tree.includes(node)){
            tree.push(node)
        }
        
        node['parentNode'] =  tree.find((node) => node.children.includes(node))
        return  node
    },
     
    createTextNode: (text) => {
        let node = {
            tag: 'TEXT_ELEMENT',
            props: {nodeValue: text},
            parentNode: tree.find((node) => node.children.includes(node)),
            children: []
        }
        node['parentNode'] = tree.find((node) => node.children.includes(node))
        if(!tree.includes(node)){
            tree.push(node)
        }
        return node
    },
    attribute: (el, attr, value) => {
        el.props[attr] = value 
    },
    querySelector: (el) => {
        switch(true){
            case  el.startsWith('.'):
                return tree.find((child) => child?.props?.className === el.substring(1))
            case el.startsWith('#'):
                return tree.find((child) => child?.id === el.substring(1))
            default:
                return tree.find((child) => child?.tag === el)
        }
    },
    querySelectorAll: (el) => {
        let nodes = []
        switch(true){
            case  el.startsWith('.'):
                nodes = tree.filter((child) => child?.props?.className === el.substring(1))
                break;
            case el.startsWith('#'):
                nodes = tree.filter((child) => child?.id === el.substring(1))
                break;
            default:
                nodes = tree.filter((child) => child?.tag === el)
                break;
        }
        return nodes
    },
    getElementById: (id) => {
        return tree.find((child) => child?.id === id)
    },
    getElementsByClassName: (className) => {
        return tree.filter((child) => child?.props?.className === className)
    },
    getElementsByTagName: (tagName) => {
        return tree.filter((child) => child?.tag === tagName)
    },
    getElementsByName: (name) => {
        return tree.filter((child) => child?.props?.name === name)
    },
    removeChild: (child) => {
        tree = tree.filter((node) => node !== child)
    },
    toString: () => {
        return tree.map((node) => {
            return node.element()
        }).join('') 
    },
    jsxTOString: (jsx) => {
        jsx = typeof jsx === 'function' ? jsx() : jsx
        if(!typeof jsx === 'function' || !typeof jsx === 'object'){
             throw new Error(`document.jsxToString() only accepts a JSX element or function as an argument`)
        }
        let el =  jsx.tag === 'TEXT_ELEMENT' ? document.createTextNode(jsx.props.nodeValue) : document.createElement(jsx.tag)
        for(var i = 0; i < jsx.children.length; i++){
            el.appendChild(jsx.children[i])
        }
        return el.element()
    }
}

function handleStyles(styles, nodeEl) { 

    for (let key in styles) {
        if(typeof styles[key] === 'object'){
            handleStyles(styles[key], nodeEl)
        }
        nodeEl.style[key] = styles[key];
    }
 
}


export function Element(tag, props, ...children){
    !props ? props = {} : null
    if(!props?.['$$key']){
        props['$$key'] = tag.name || Math.random().toString(36).substring(7)
    }

    if(typeof tag === 'function'){ 
       return generateJSX(tag, props, children) 
    } 
    let node = {
        tag: tag,
        props: props,
        children: children, 
        _key: props['$$key'],
        events: [],
        staticEl: document.createElement(tag),
        parentNode: null
    }
    for(var i = 0; i < children.length; i++){
      if(typeof children[i] === 'string' || typeof children[i] === 'number'){
        children[i] = {
          tag: 'TEXT_ELEMENT',
          props: {nodeValue: children[i]},
          _key: props['$$key'],
          parentNode: {tag: tag, props: props, children: children, _key: props['$$key']},
          children: []
        }
      }else{
          if(children[i]){
            children[i].parentNode = {tag: tag, props: props, children: children}
          }
      }
    }  
    let nodeEl = node.tag === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(node.tag)
    node.staticEl = nodeEl 
    for(var key in props){
       if(key.toLowerCase().includes('on')){
         nodeEl.addEventListener(key.substring(2).toLowerCase(), props[key])   
         node.events.push({type: key.substring(2).toLowerCase(), listener: props[key]}) 
       }  
       if(key === '$$key' && !nodeEl._key && nodeEl.nodeType === 1
       ){
          Object.defineProperty(nodeEl, '_key', {
            value: props[key],
            writable: true
          })
       }
    
    }
    if(props.style){
        handleStyles(props.style, nodeEl)
    }
    if(props.ref){
       switch(true){
        case Array.isArray(props.ref.current):
            if(!props.ref.current.find((el) => el === nodeEl)){
                props.ref.current.push(nodeEl)
            }
            break;
        case props.ref.current === HTMLElement:
            props.ref.current = nodeEl
            break;
        case props.ref.current === null:
            props.ref.current = nodeEl
            break;
        default:
            props.ref.current = nodeEl
            break;

       }
    }
    node['htmlNode'] = nodeEl
      
     
    for(var i = 0; i < children.length; i++){
      
        if(children[i]){
            children[i].parentNode = {tag: tag, props: props, children: children}
        }
        nodeEl.appendChild(children[i].tag === 'TEXT_ELEMENT' ? document.createTextNode(children[i].props.nodeValue) : children[i].staticEl) 
      
    }
 
   
    return node;
}
  

export default {
    document,
    Element
}

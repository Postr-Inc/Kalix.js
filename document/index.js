/** 
 * @module DOMParser
 * @description The DOMParser interface provides the ability to parse HTML source code from a string into a DOM Document. 
 */
export class DOMParser {
    /**
     * @decription - parse html to a document
     * @param {string} html 
     * @returns  {Document}
     */
    parseFromString(html) {
        let doc = new Document();
        let t = new Bun.Transpiler({
            loader: "tsx", // "js | "jsx" | "ts" | "tsx",
            target: "browser",
            define: {
                "jsxDEV": "Element",
                "jsx": "Element"
            }
        });

        let el = t.transformSync(`

        const html = ${html}
        function Doc() { 
            return (
               <html>
               <body>${html}</body>
               </html>
            )
          }
         return Doc()
        ` )
        el = el.replaceAll(`jsxDEV`, `Element`)
        let evaluated = eval(`(function(){${el}})()`)
        evaluated.children.forEach((child) => {
            child.outerHTML = child.toString()
        })
        doc.tree = evaluated.children
        doc.body = evaluated.children[0]
        doc.body.outerHTML = evaluated.children[0].toString()
        doc.body.firstChild = evaluated.children[0].children[0]
        doc.documentElement = evaluated
        doc.documentElement.outerHTML = evaluated.children[0].toString()
        this.tree = evaluated.children
        return doc
    }
    /**
     * @description - Returns a string containing the HTML serialization of the element's descendants.
     * @returns {string}
     */
    toString() {
        return this.tree.toString();
    }

}
class HTMLTEXTNode {
    constructor(text) {
        this.nodeValue = text;
        this.nodeType = 3;
        this.tagName = "TEXT_ELEMENT";
        this.props = { nodeValue: text };
    }

    toString() {
        return this.nodeValue;
    }

    insertBefore(node) {
        this.nodeValue = `${node.toString()}${this.nodeValue}`;
        return this;
    }
}
class HTMLElement {
    constructor(tagName, props, children) {
        this.tagName = tagName;
        this.props = props;
        this.children = children;
        this.outerHTML = this.toString("outerHTML");
        this.innerHTML = this.toString("innerHTML");
        /**
         * @type {HTMLElement | HTMLTEXTNode}
         */
        this.firstChild = this.children[0];
        this.style = {};
        this.attributes = props;
        this.events = [];
        /**
         * @type {string | null}
         */
        this.id = null;
        this.nodeType = 1;
        this.accessKey = null;
    }

    /**
     * @description - Returns a string containing the HTML serialization of the element's descendants.
     * @param {string} type - outerHTML, innerHTML, innerText
     * @returns  {string}
     */
    toString(type = "outerHTML") {
        switch (type) {
            case "outerHTML":
                if (this.tagName === "TEXT_ELEMENT") {
                    return this.props.nodeValue;
                }
                let props = "";
                for (let key in this.props) { 
                    if (key !== 'style' && key !== 'ref'){
                        props += `${key}="${this.props[key]}" `
                    }
                } 
                let children = this.children
                    .map((child) => {
                        return child.toString();
                    }).join("");
                if (this.attributes?.style) {
                    for (let key in this.attributes.style) {
                        this.style[key] = this.attributes.style[key]
                    }
                }


                if (this.attributes && Object.keys(this.attributes).length > 0) {
                    props += ` ${Object.keys(this.attributes).map((key) =>{ 
                        if(key !== 'style' && !props.includes(key) && key !== 'ref'){
                            return `${key}="${this.attributes[key]}"`
                        }
                    }).join(' ')}`
                }
                if (this.style && Object.keys(this.style).length > 0) {
                    props += ` style="${handleStyles(this.style, this)}"`
                }
                if (this.props?.id) {
                    this.id = this.props.id
                }
                return `<${this.tagName} ${props}>${children}</${this.tagName}>`;
            case "innerHTML":
                this.innerHTML = this.children
                    .map((child) => {
                        return child.toString();
                    })
                    .join("");
                return this.children
                    .map((child) => {
                        return child.toString();
                    })
                    .join("");
            case "innerText":
                return this.children
                    .map((child) => {
                        return child.toString();
                    })
                    .join("");
            default:
                break;
        }
    }
    /**
     * @description - Appends a node as the last child of a node.
     * @param {HTMLElement|HTMLTEXTNode} child 
     * @returns 
     */
    appendChild(child) {  
        this.outerHTML = this.toString("outerHTML");
        this.innerHTML = this.toString("innerHTML");
        if (!this.children.includes(child)) {
            this.children.push(child);
            this.outerHTML = this.toString("outerHTML");
            this.innerHTML = this.toString("innerHTML");
        }
        return this;
    }
    /**
     * @description - Inserts a set of Node objects or DOMString objects after the last child of the ParentNode.
     * @param {HTMLElement|HTMLTEXTNode} child
     * @returns  {HTMLElement}
     */
    prepend(child) {
        this.children = [child, ...this.children];
        return this;
    }

    /**
     * @description - Removes a child node from the DOM  
     * @param {Object} child 
     * @returns  {HTMLElement}
     */
    removeChild(child) {
        this.children = this.children.filter((c) => c !== child); 
        this.innerHTML = this.toString("innerHTML");
        this.outerHTML = this.toString("outerHTML");
        return this;
    }

    /**
     * @method classList 
     * @description - add, remove, toggle, or check the presence of a class in the class attribute of an element
     * @returns {(add: (className: string) => HTMLElement | HTMLTEXTNode | null, remove: (className: string) => HTMLElement | HTMLTEXTNode | null, toggle: (className: string) => HTMLElement | HTMLTEXTNode | null, contains: (className: string) => boolean) => HTMLElement | HTMLTEXTNode | null}
     */
    classList = {
        add: (className) => {
            this.props.className = `${this.props.className} ${className}`;
            return this;
        },
        remove: (className) => {
            this.props.className = this.props.className.replace(className, "");
            return this;
        },
        toggle: (className) => {
            if (this.props.className.includes(className)) {
                this.props.className = this.props.className.replace(className, "");
            } else {
                this.props.className = `${this.props.className} ${className}`;
            }
            return this;
        },
        contains: (className) => {
            return this.attributes["class" || "className"].includes(className);
        },
    };

    /**
     *
     * @param {string} selector
     * @returns {HTMLElement}
     */
    querySelector(selector) {
        switch (true) {
            case selector.startsWith("."):
                return this.children.find((child) => {
                    child.outerHTML = child.toString();
                    return child.props.className.includes(selector.substring(1));
                });
            case selector.startsWith("#"):
                return this.children.find((child) => {
                    child.outerHTML = child.toString();
                    return child.props.id === selector.substring(1);
                });
            default:
                let child = this.children.find((child) => {
                    child.outerHTML = child.toString();
                    return child.tagName === selector;
                }
                );
                if (!child) {
                    // check if children of children have the selector
                    this.children.forEach((c) => {
                        if (c.children) {
                            child = c.children.find((child) => {
                                child.outerHTML = child.toString("outerHTML");
                                child.innerHTML = child.toString("innerHTML");
                                return child.tagName === selector;
                            }
                            );
                        }
                    })
                }

                return child;
        }
    }
    /** 
     * @description - Returns a list of elements with the given tag name. The subtree underneath the specified element is searched, excluding the element itself.
     * @param {string} selector 
     * @returns {Array<HTMLElement | HTMLTEXTNode>}
     */
    querySelectorAll(selector) {
        switch (true) {
            case selector.startsWith("."):
                return this.children.filter((child) => {
                    return child.props.className.includes(selector.substring(1));
                });
            case selector === '*':
                return this.children;
            case selector.startsWith("#"):
                return this.children.filter((child) => {
                    return child.props.id === selector.substring(1);
                });
            default:
                return this.children.filter((child) => {
                    return child.tagName === selector;
                });
        }
    }
    parseHTML(html) {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(html);
        return parsed;
    }
}
/**
 * @module Document
 * @description - The Document interface represents any web page loaded  in the browser and serves as an entry point into the web page's content, which is the DOM tree.
 */
export class Document {
    constructor() {
        this.tree = [];
        /**
         * @description - Returns the <body> or <frameset> node of the current document.
         * @type {HTMLElement}
         */
        this.body = new HTMLElement("body", {}, []);
        /**
         * @description - Document.documentElement returns the Element that is the root element of the document
         * @type {HTMLElement}
         * @returns {{outerHTML: string, innerHTML: string}}
         */
        this.documentElement = null;

        /**
         * @description -  Returns the first child of a node, or the first child that is an element, and null if there are no child elements.
         * **/
        this.firstElementChild = null;
    }

    /**
     * @description - Creates a new Text node.  This method can be used to escape HTML characters.
     * @param {sring} text 
     * @returns  {HTMLTEXTNode}
     */
    createTextNode(text) {
        return new HTMLTEXTNode(text);
    }
    /**
     * @description -  Creates a new element with the provided tag name or node object.
     * @param {Object | string} nodeData
     * @returns {HTMLElement}
     */
    createElement(nodeData) {
        if (typeof nodeData === 'string') {
            return new HTMLElement(nodeData, {}, [])
        }
        let { tagName, props, children } = nodeData;
        let node = new HTMLElement(tagName, props, children);
        children = children.filter((child) => child !== null || child !== undefined)
        node.children = children.map((child) => { 
            if (child.tagName === "TEXT_ELEMENT") {
                return new HTMLTEXTNode(child);
            }
            if (child instanceof HTMLElement) {
                return child;
            }
            return this.createElement(child);
        });
        return node;
    }

    /**
     * @description - Returns the first element that is a descendant of the element on which it is invoked that matches the specified group of selectors.
     * @param {string} selector 
     * @returns {HTMLElement | HTMLTEXTNode | null}
     */
    querySelector(selector) {
        switch (true) {
            case selector.startsWith("."):
                return this.tree.find((child) => {
                    child.outerHTML = child.toString();
                    return child.props.className.includes(selector.substring(1));
                });
            case selector.startsWith("#"):
                return this.tree.find((child) => {
                    return child.props.id === selector.substring(1);
                });
            default:
                let child = this.tree.find((child) => {
                    child.outerHTML = child.toString();
                    return child.tagName === selector;
                })
                if (!child) {
                    // check if children of children have the selector
                    this.tree.forEach((c) => {
                        if (c.children) {
                            child = c.children.find((child) => {
                                child.outerHTML = child.toString();
                                return child.tagName === selector;
                            }
                            );
                        }
                    })
                }
                return child;
        }
    }

    /**
     * @description - Returns a list of elements with the given tag name. The subtree underneath the specified element is searched, excluding the element itself.
     * @param {string} selector 
     * @returns {Array<HTMLElement | HTMLTEXTNode>}
     */
    querySelectorAll(selector) {
        switch (true) {
            case selector.startsWith("."):
                return this.tree.filter((child) => {
                    return child.props.className.includes(selector.substring(1));
                });
            case selector.startsWith("#"):
                return this.tree.filter((child) => {
                    return child.props.id === selector.substring(1);
                });
            default:
                return this.tree.filter((child) => {
                    return child.tagName === selector;
                });
        }
    }


    /**
     * @description - Returns a string containing the HTML serialization of the element's descendants.
     * @returns {string}
     */

    toString() {
        return this.tree.map((child) => child.toString()).join("");

    }

}

function handleStyles(styles, nodeEl) {
    let style = "";
    for (let key in styles) {
        if (typeof styles[key] === "object") {
            style += handleStyles(styles[key], nodeEl);
        }
        style += `${key}:${styles[key]};`;
    }
    return style;
}

/**
 * @method Element
 * @description - Create a virtual jsx DOM element
 * @param {string} tag 
 * @param {Object} props 
 * @param  {...any} children 
 * @returns 
 */
export function Element(tag, props = {}, ...children) {
    if(props === null){
        props = {}
    } 
    let node = {
        tagName: tag,
        props: props || {},
        children: children,
        _key: null,
        events: [],
        parentNode: null,
    };

    if (props?.children) {
        switch (true) {
            case typeof props.children === 'string':
                children = [props.children]
                break;
            case Array.isArray(props.children):
                children = props.children
                break;
            default:
                children = [props.children]
        }

        node.children = children
        delete props.children
    }

    for (var i = 0; i < children.length; i++) {
        if (typeof children[i] === "string" || typeof children[i] === "number") {
            children[i] = {
                tagName: "TEXT_ELEMENT",
                props: { nodeValue: children[i] },
                _key: null,
                parentNode: { tagName: tag, props: props, children: children, _key: null},
                children: [],
            };
            children[i] = new HTMLTEXTNode(children[i].props.nodeValue);
        } else {
            if (children[i]) {
                children[i].parentNode = { tagName: tag, props: props, children: children };
            }

            children[i] = new HTMLElement(children[i].tagName, children[i].props, children[i].children)
        }
    }

    return node;
}

export default {
    Document,
    Element,
    DOMParser,
};

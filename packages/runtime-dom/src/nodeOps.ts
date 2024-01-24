import { patchProp } from "./patchProp"

const doc = document
export const nodeOps = {
    createElement(type: string): Element {
        return doc.createElement(type)
    },
    setElementText(node: Element, text: string): void {
        node.textContent = text
    },
    removeChild(el: Element): void {
        const parent = el.parentNode
        if (parent) {
            parent.removeChild(el)
        }
    },
    insert(child: Element, parent: Element, anchor?: any): void {
        parent.insertBefore(child, anchor)
    },
    // 处理复杂，单独写为一个文件
    patchProp,
    createText(text: string) {
        const el = doc.createTextNode(text)
        return el
    },
    createComment(text: string) {
        const el = doc.createComment(text)
        return el
    },
    setText(el: Element, text: string): void {
        el.nodeValue = text
    },
}

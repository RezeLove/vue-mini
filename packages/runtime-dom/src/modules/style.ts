import { isString } from "@vue/shared"

export function patchStyle(el: Element, key: string, prev: any, next: any) {
    // @ts-ignore
    const style = el.style
    // style属性的类型是obj或者array 这里只考虑obj类型
    const isCssString = isString(next)
    if (next && !isCssString) {
        for (let key in next) {
            setStyle(style, key, next[key])
        }
    } else if (prev && isString(prev)) {
        for (let key in prev) {
            setStyle(style, key, "")
        }
    }
}

function setStyle(style: CSSStyleDeclaration, name: string, val: any) {
    // @ts-ignore
    style[name] = val
}

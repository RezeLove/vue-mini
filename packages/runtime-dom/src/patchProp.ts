import { isOn } from "@vue/shared"
import { patchClass } from "./modules/class"
import { patchDOMProp } from "./modules/props"
import { patchAttr } from "./modules/attr"
import { patchStyle } from "./modules/style"
import { patchEvent } from "./modules/event"

export const patchProp = (el: Element, key: string, prev: any, newv: any) => {
    // 处理class
    if (key === "class") {
        patchClass(el, newv)
    }
    // 处理style
    else if (key === "style") {
        patchStyle(el, key, prev, newv)
    }
    // 处理事件
    else if (isOn(key)) {
        patchEvent(el, key, prev, newv)
    }
    // 通过属性名挂载属性
    else if (shouldSetAsProps(el, key, newv)) {
        patchDOMProp(el, key, newv)
    }
    // 通过setAttribute挂载属性
    else {
        patchAttr(el, key, newv)
    }
}

function shouldSetAsProps(el: Element, key: string, newv: string | null) {
    // form是只读的属性
    if (key === "form" && el.tagName === "INPUT") {
        return false
    }
    // input list必须通过setAttribute设定
    if (key === "list" && el.tagName === "INPUT") {
        return false
    }
    if (key === "type" && el.tagName === "INPUT") {
        return false
    }
    // el是否有这个key，如果有则可以通过DOM properties设置；如果没有只能通过setAttr进行设置
    return key in el
}

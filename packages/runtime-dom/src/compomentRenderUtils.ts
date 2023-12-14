import { VNode, createVnode } from "packages/runtime-core/src/vnode"

export function normalizeVnode(child: object | string) {
    // vnode或者数组
    if (typeof child == "object") {
        return child as VNode
    }
    // 文本
    else {
        return createVnode(Text, null, String(child))
    }
}

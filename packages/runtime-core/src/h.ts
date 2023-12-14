import { VNode, createVnode, isVNode } from "./vnode"
import { isObject, isArray } from "@vue/shared"
export function h(type: any, propsOrChildren?: any, children?: any): VNode {
    const l = arguments.length
    // 如果l的长度为2，需要判断传入的是children还是props
    /**
     * children有多种类型：1-array 2-object 即VNode 3-string 4-函数（组件是使用）。传入createVnode时都处理为array
     * props只有一种类型：对象
     */
    if (l === 2) {
        if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
            if (isVNode(propsOrChildren)) {
                // 处理为array
                return createVnode(type, null, [propsOrChildren])
            } else {
                // 说明参数为props
                return createVnode(type, propsOrChildren, null)
            }
        } else {
            // childre为string、array或者函数
            return createVnode(type, null, propsOrChildren)
        }
    } else {
        if (l > 3) {
            // slice只有一个参数，切取从start开始的全部元素
            children = Array.prototype.slice.call(arguments, 2)
        } else if (l === 3) {
            if (isVNode(children)) {
                children = [children]
            }
        }
        return createVnode(type, propsOrChildren, children)
    }
}

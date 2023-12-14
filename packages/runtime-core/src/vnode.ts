import { isArray, isFunction, isObject, isString } from "@vue/shared"
import { ShapeFlags } from "packages/shared/src/shapeFlags"

// Fragment、Text和Commment类型
export const Fragment = Symbol("Fragment")
export const Text = Symbol("Text")
export const Comment = Symbol("Comment")

export interface VNode {
    __v_isVNode: boolean
    type: any
    props: any
    children: any
    shapeFlag: number
    el: Element
    key: number
}

export function createVnode(type: any, props: any, children: any): VNode {
    if (props) {
        const { class: klass, style } = props
        props.class = normalizeClass(klass)
    }
    const shapeFlag = isString(type)
        ? ShapeFlags.ELEMENT
        : // 如果type是一个对象，那么就表示是一个组件
        isObject(type)
        ? ShapeFlags.STATEFUL_COMPONENT
        : 0
    const key = props?.key ? props.key : null
    return createBaseVNode(type, props, children, shapeFlag, key)
}

function createBaseVNode(type: any, props: object, children: any, shapeFlag: number, key: any) {
    const vnode = {
        __v_isVNode: true,
        type,
        props,
        shapeFlag,
        key,
    } as VNode
    // children类型较多，可以是字符串、对象、数组等等，在解析成vnode时要处理成统一的结构
    normalizeChildren(vnode, children)
    return vnode
}

export function normalizeChildren(vnode: VNode, children: any) {
    let type = 0
    const { shapeFlag } = vnode
    if (!children) {
        children = null
    } else if (isArray(children)) {
        type = ShapeFlags.ARRAY_CHILDREN
    } else if (isObject(children)) {
    } else if (isFunction(children)) {
    } else {
        // 字符串
        children = String(children)
        // 文本节点
        type = ShapeFlags.TEXT_CHILDREN
    }
    vnode.children = children
    // 按位进行或运算 下式等于 vnode.shapeFlag = vnode.shapeFlag|type,vnode.shapeFlag与type会按位进行或运算，只要有1个1，结果就是1
    // shapeFlag是容器的类型，type是children的类型
    vnode.shapeFlag |= type
}

// class统一处理为'class1 class2 class3'的形式，中间用空格拼接
export function normalizeClass(value: any): string {
    let res = ""
    if (isString(value)) {
        res = value
    }
    // 注意:这里要先判断是否为数组，因为array也是obj类型的
    // 绑定数组：<div :class="[activeClass, errorClass]"></div>
    else if (isArray(value)) {
        // 数组的元素可能是字符串或数组
        for (let cls of value) {
            const normalized = normalizeClass(cls)
            res += normalized + " "
        }
    }
    // 绑定对象:class="{ active: isActive, 'text-danger': hasError }"
    else if (isObject(value)) {
        for (let key in value) {
            if (value[key]) {
                // 空格进行拼接
                res += key + " "
            }
        }
    }

    // 去除头尾的空格(在递归时也有用处)
    return res.trim()
}

export function isVNode(value: any): boolean {
    return value ? value.__v_isVNode === true : false
}

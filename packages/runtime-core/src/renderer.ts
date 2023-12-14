import { ShapeFlags } from "packages/shared/src/shapeFlags"
import { Fragment, Text, VNode } from "./vnode"
import { patchProp } from "packages/runtime-dom/src/patchProp"
import { EMPTY_OBJ, getSequence, isString } from "@vue/shared"
import { normalizeVnode } from "packages/runtime-dom/src/compomentRenderUtils"

// 将依赖于浏览器API(如DOM api)抽离成options，具有跨平台的能力
export interface RendererOptions {
    // 创建一个真实的dom结点
    createElement(type: string): Element
    // 用于修改dom的文本值
    setElementText(node: Element, text: string): void
    // 为dom插入子节点
    insert(child: any, parent: Element, anchor?: any): void
    // 移除dom节点
    removeChild(el: Element): void
    // 更新单个属性
    patchProp(el: Element, key: string, prevValue?: any, newValue?: any): void
    createText(text: string): Element
    createComment(text: string): Element
    setText(el: Element, text: string): void
}

export function createRenderer(options: RendererOptions) {
    return baseCreateRenderer(options)
}

function baseCreateRenderer(options: RendererOptions) {
    // 从options取出相关函数
    const {
        createElement,
        setElementText,
        removeChild,
        insert,
        createText,
        setText,
        createComment,
    } = options

    /**container._vnode
     *
     * @param vnode :新vnode
     * @param container:代挂载的容器
     */
    const render = (vnode: any, container: any) => {
        // 新的vnode为空
        if (!vnode) {
            // 卸载掉旧vnode
            if (container._vnode) {
                unmount(container._vnode)
            }
        } else {
            patch(container._vnode || null, vnode, container)
        }
        // 保存当前的vnode
        container._vnode = vnode
    }
    const unmount = (vnode: VNode) => {
        // Fragment需要将子节点一一卸载
        if (vnode.type === Fragment) {
            vnode.children.forEach((c: VNode) => {
                unmount(c)
                return
            })
        }
        const el = vnode.el
        removeChild(el)
    }
    /**
     * @param oldVnode 旧节点
     * @param newVnode 新结点
     * @param container
     * @param anchor 锚点
     */
    const isSameVnodeType = (oldVnode: VNode, newVnode: VNode) => {
        return oldVnode.type == newVnode.type
    }
    const patch = (oldVnode: VNode | null, newVnode: VNode, container: any, anchor = null) => {
        oldVnode = oldVnode ? oldVnode : container._vnode
        if (oldVnode === newVnode) {
            return
        }
        const { type, shapeFlag } = newVnode
        // 如果新旧节点的type不一致，没有打补丁的必要
        if (oldVnode && oldVnode.type !== type) {
            unmount(oldVnode)
            // 卸载后记得将oldVnode置空
            oldVnode = null
        }
        // 判断新结点类型
        switch (type) {
            case Text:
                processText(oldVnode, newVnode, container, anchor)
                break
            case Comment:
                processComment(oldVnode, newVnode, container, anchor)
                break
            case Fragment:
                // 对于Fragment类型的vnode来说,它的children存储的内容就是模板中所有根节点，因此在挂载和卸载时，只需要考虑子节点
                processFragment(oldVnode, newVnode, container, anchor)
                break
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(oldVnode, newVnode, container, anchor)
                } else if (shapeFlag & ShapeFlags.COMPONENT) {
                }
        }
    }
    const processComment = (
        oldVnode: VNode | null,
        newVnode: VNode,
        container: any,
        anchor = null
    ) => {
        if (!oldVnode) {
            newVnode.el = createComment(newVnode?.children)
            insert(newVnode?.el, container)
        } else {
            const el = oldVnode.el
            newVnode.el = el
            if (newVnode.children !== oldVnode.children) {
                // @ts-ignore
                setText(el, newVnode.children)
            }
        }
    }
    const processText = (
        oldVnode: VNode | null,
        newVnode: VNode,
        container: any,
        anchor = null
    ) => {
        if (!oldVnode) {
            newVnode.el = createText(newVnode?.children)
            insert(newVnode?.el, container)
        } else {
            const el = (newVnode.el = oldVnode.el)
            if (newVnode.children !== oldVnode.children) {
                // @ts-ignore
                setText(el, newVnode.children)
            }
        }
    }

    const processFragment = (
        oldVnode: VNode | null,
        newVnode: VNode,
        container: any,
        anchor = null
    ) => {
        if (!oldVnode) {
            newVnode.children.forEach((child: any) => {
                // 因为是挂载的是Fragment的子节点，可能存在纯文本的情况，还需进行统一处理
                let childToMount = normalizeVnode(child)
                patch(null, childToMount, container, null)
            })
        } else {
            patchChildren(oldVnode, newVnode, container, null)
        }
    }

    const processElement = (
        oldVnode: VNode | null,
        newVnode: VNode,
        container: any,
        anchor = null
    ) => {
        if (!oldVnode) {
            console.log("mount")
            // 直接挂载
            mountElement(newVnode, container, anchor)
        } else {
            console.log("patch")
            patchElement(oldVnode, newVnode, anchor)
        }
    }
    // 挂载element
    const mountElement = (vnode: VNode, container: any, anchor = null) => {
        const { type, shapeFlag, props } = vnode
        // 1. 创建element
        const el = (vnode.el = createElement(type))
        // 2. 挂载子节点
        // 文本
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            setElementText(el, vnode.children)
        }
        // 3. 设置props
        if (props) {
            for (let key in props) {
                patchProp(el, key, null, props[key])
            }
        }

        // 4.挂载到容器
        insert(el, container, anchor)

        if (vnode.children) {
            mountChildren(vnode.children, el, anchor)
        }
    }
    // @ts-ignore
    const mountChildren = (children, container, anchor) => {
        if (isString(children)) {
            children = children.split("")
        }
        for (let i = 0; i < children.length; i++) {
            const child = normalizeVnode(children[i])
            patch(null, child, container, anchor)
        }
    }
    // 为element打补丁
    const patchElement = (oldVnode: VNode, newVnode: VNode, anchor = null) => {
        const el = oldVnode.el as Element
        newVnode.el = el
        const oldProps = oldVnode.props || EMPTY_OBJ
        const newProps = newVnode.props || EMPTY_OBJ
        // 更新子节点
        patchChildren(oldVnode, newVnode, el, anchor)
        // 更新属性
        patchProps(el, newVnode, oldProps, newProps)
    }
    // 子节点更新
    const patchChildren = (oldVnode: VNode, newVnode: VNode, container: any, anchor = null) => {
        // 短路运算符 前面为true，取后面的值；前面为false，则取false
        const oldchild = oldVnode && oldVnode.children
        const newchild = newVnode && newVnode.children
        // 实际上执行到patchElement时，oldVnode和newVnode都是存在的
        const prevShapeflag = oldVnode.shapeFlag
        const { shapeFlag } = newVnode

        // 子节点有三种类型：空、文本、数组；新旧组合共有9种情况
        // 新子节点为文本
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 旧子节点为array
            if (prevShapeflag & ShapeFlags.ARRAY_CHILDREN) {
                // 一个个卸载
            }
            // 如果不是array或者为空，直接修改文本值即可
            if (oldchild !== newchild) {
                setElementText(container, newchild)
            }
        }
        // 新子节点为array
        else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 旧子节点也为array
            if (prevShapeflag & ShapeFlags.ARRAY_CHILDREN) {
                // diff算法进行更新
                patchKeyedChildren(oldchild, newchild, oldVnode.el)
            } else {
                // 那么旧子节点就为text或空，统一置空再重新挂载
                setElementText(container, "")
                newchild.forEach((child: any) => {
                    mountElement(child, container, null)
                })
            }
        }
        // 新子节点不存在
        else {
            // 旧子节点为数组
            if (prevShapeflag & ShapeFlags.ARRAY_CHILDREN) {
                // 一个个卸载
            } else {
                setElementText(container, "")
            }
        }
    }
    const patchKeyedChildren = (
        oldChildren: Array<any>,
        newChildren: Array<any>,
        container: any
    ) => {
        console.log("patchKeyedChildren")
        let j = 0
        let oldVNode = oldChildren[j]
        let newVNode = newChildren[j]
        while (oldVNode.key === newVNode.key) {
            patch(oldVNode, newVNode, container)
            j++
            console.log(newVNode.key)
            oldVNode = oldChildren[j]
            newVNode = newChildren[j]
        }

        let oldEnd = oldChildren.length - 1
        let newEnd = newChildren.length - 1

        oldVNode = oldChildren[oldEnd]
        newVNode = newChildren[newEnd]

        while (oldVNode.key === newVNode.key) {
            patch(oldVNode, newVNode, container)
            console.log(newVNode.key)
            oldEnd--
            newEnd--
            oldVNode = oldChildren[oldEnd]
            newVNode = newChildren[newEnd]
        }

        if (j > oldEnd && j <= newEnd) {
            const anchorIndex = newEnd + 1
            const anchor = anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null
            console.log("mountnew")
            while (j <= newEnd) {
                patch(null, newChildren[j++], container, anchor)
            }
        } else if (j > newEnd && j <= oldEnd) {
            console.log("unmount,old")
            while (j <= oldEnd) {
                unmount(oldChildren[j++])
            }
        } else {
            const count = newEnd - j + 1
            const source = new Array(count)
            source.fill(-1)

            const oldStart = j
            const newStart = j
            let moved = false
            let pos = 0
            const keyIndex = {}
            for (let i = newStart; i <= newEnd; i++) {
                // @ts-ignore
                keyIndex[newChildren[i].key] = i
            }
            let patched = 0
            for (let i = oldStart; i <= oldEnd; i++) {
                oldVNode = oldChildren[i]
                if (patched < count) {
                    // @ts-ignore
                    const k = keyIndex[oldVNode.key]
                    if (typeof k !== "undefined") {
                        newVNode = newChildren[k]
                        patch(oldVNode, newVNode, container)
                        patched++
                        source[k - newStart] = i
                        if (k < pos) {
                            moved = true
                        } else {
                            pos = k
                        }
                    } else {
                        unmount(oldVNode)
                    }
                } else {
                    unmount(oldVNode)
                }
            }
            console.log("end")
            if (moved) {
                console.log("moved")
                const seq = getSequence(source)
                let s = seq.length - 1
                let i = count - 1
                for (i; i >= 0; i--) {
                    if (source[i] === -1) {
                        const pos = i + newStart
                        const newVNode = newChildren[pos]
                        const nextPos = pos + 1
                        const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null
                        patch(null, newVNode, container, anchor)
                    } else if (i !== seq[j]) {
                        const pos = i + newStart
                        const newVNode = newChildren[pos]
                        const nextPos = pos + 1
                        const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null
                        insert(newVNode.el, container, anchor)
                    } else {
                        s--
                    }
                }
            }
        }
    }
    // 更新属性
    const patchProps = (el: Element, vnode: VNode, oldprops: any, newprops: any) => {
        if (oldprops !== newprops) {
            // 先循环newprops
            for (let key in newprops) {
                if (newprops[key] !== oldprops[key]) {
                    patchProp(el, key, oldprops[key], newprops[key])
                }
            }
            // 再循环oldprops 将不需要的属性卸载
            for (let key in oldprops) {
                if (!(key in newprops)) {
                    patchProp(el, key, oldprops[key], null)
                }
            }
        }
    }
    return {
        render,
    }
}

// @ts-nocheck
import { NodeTypes, createVNodeCall } from "../ast"

export const transformElement = (node, context) => {
    return function postTransformElement() {
        node = context.currentNode
        if (node.type !== NodeTypes.ELEMENT) {
            return
        }
        const { tag } = node

        let vnodeTag = `"${tag}"`
        let vnodeProps = []
        let vnodeChildren = node.children
        // 传入h函数所需的参数
        node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren)
    }
}

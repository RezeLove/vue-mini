// @ts-nocheck
import { NodeTypes } from "../ast"
import { isText } from "../utils"

/**
 *
 * 将相邻的文本结点和表达式合并
 * 如：<div>hello{{msg}}</div>，需要拿到msg对应的数据，然后进行拼接 'hello'+"msg"
 */
export const transformText = (node, context) => {
    if (
        node.type === NodeTypes.ROOT ||
        node.type === NodeTypes.ELEMENT ||
        node.type === NodeTypes.FOR ||
        node.type === NodeTypes.IF
    ) {
        return () => {
            const children = node.children
            let currentContainer
            for (let i = 0; i < children.length; i++) {
                const child = children[i]
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j]
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = createCompundExpression(
                                    [child],
                                    child.loc
                                )
                            }
                            currentContainer.children.push(`+`, next)
                            children.splice(j, 1)
                            j--
                        }
                        // 第二个节点不是text，不需要合并
                        else {
                            currentContainer = undefined
                            break
                        }
                    }
                }
            }
        }
    }
}

export function createCompundExpression(children, loc) {
    return {
        type: NodeTypes.COMPOUND_EXPRESSION,
        loc,
        children,
    }
}

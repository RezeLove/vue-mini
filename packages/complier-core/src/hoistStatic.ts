// @ts-nocheck
import { NodeTypes } from "./ast"

export function isSingleElementRoot(root, child) {
    const { children } = root
    // 单个根节点且是element类型
    return children.length === 1 && child.type === NodeTypes.ELEMENT
}

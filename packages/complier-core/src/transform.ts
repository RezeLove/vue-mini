// @ts-nocheck
import { NodeTypes } from "./ast"
import { isSingleElementRoot } from "./hoistStatic"

// root-ast
export function transform(root: object, options: object) {
    // 生成context
    const context = createTransformContext(root, options)
    // 遍历转化节点
    traverseNode(root, context)
    createRootCodegen(root)
    root.helpers = [...context.helpers.keys()]
    root.components = []
    root.directives = []
    root.imports = []
    root.hoists = []
    root.temps = []
    root.cached = []
}

export interface TransformContext {
    root: any
    parent: ParentNode | null
    childIndex: number
    currentNode: any
    helpers: Map<symbol, number>
    helper<T extends symbol>(name: T): T
    nodeTransforms: any
}

export function createTransformContext(root, { nodeTransforms = [] }) {
    const context: TransformContext = {
        nodeTransforms,
        root,
        helpers: new Map(),
        currentNode: root,
        parent: null,
        childIndex: 0,
        helper(name) {
            const count = context.helpers.get(name) || 0
            context.helpers.set(name, count + 1)
            return name
        },
    }
    return context
}

export function traverseNode(node, context: TransformContext) {
    /**
     * 深度优先 子->父进行转化
     * 1.进入阶段：存储所有节点的转化函数（转化为Javascript AST）到exitFns中
     * 2.退出阶段：执行exitFns中缓存的转化函数，并且倒序执行（栈，后入先出，保证深度优先的执行顺序）
     */
    context.currentNode = node
    const { nodeTransforms } = context
    const exitFns: any = []

    // 进入阶段
    // 父节点
    for (let i = 0; i < nodeTransforms.length; i++) {
        const onExit = nodeTransforms[i](node, context)
        if (onExit) {
            exitFns.push(onExit)
        }
    }

    // 处理子节点
    switch (node.type) {
        case NodeTypes.ELEMENT:
        case NodeTypes.ROOT:
            traverseChildren(node, context)
            break
    }

    // 退出阶段
    context.currentNode = node
    let i = exitFns.length
    // 依次执行保存的函数
    while (i--) {
        exitFns[i]()
    }
}

export function traverseChildren(parent, context: TransformContext) {
    // @ts-ignore
    parent.children.forEach((node, index) => {
        context.parent = parent
        context.childIndex = index
        // 递归处理子节点
        traverseNode(node, context)
    })
}

export function createRootCodegen(root) {
    const { children } = root
    // vue2仅支持单个根节点
    if (children.length === 1) {
        const child = children[0]
        if (isSingleElementRoot(root, child) && child.codegenNode) {
            root.codegenNode = child.codegenNode
        }
    }

    // vue3支持多个根节点
}

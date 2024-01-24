// @ts-nocheck
import { getNodeMajorVersion } from "typescript"
import { NodeTypes } from "./ast"
import { CREATE_ELEMENT_VNODE, CREATE_VNODE, helperNameMap } from "./runtimeHelpers"
import { isArray, isString } from "@vue/shared"

// 创建context对象
function createCodegenContext(ast: Object) {
    const context = {
        // 保存最终拼接的渲染函数
        code: "",
        runtimeGlobalName: "Vue",
        source: ast.loc.source,
        // 缩放级别,初始为0，没有缩进
        indentLevel: 0,
        isSSR: false,
        helper(key) {
            return `_${helperNameMap[key]}`
        },
        // 拼接字符串
        push(code) {
            context.code += code
        },
        // 换行
        newline() {
            context.code += "\n" + `  `.repeat(context.indentLevel)
        },
        // 缩进
        indent() {
            context.indentLevel++
            context.newline()
        },
        // 取消缩进
        deindent() {
            context.indentLevel--
            context.newline()
        },
    }
    return context
}

function genFunctionPreamble(context) {
    const { push, newline, indent, deindent, runtimeGlobalName } = context
    const VueBinding = runtimeGlobalName
    push(`const _Vue = ${VueBinding}\n`)
    newline()
    push(`return  `)
}

const aliasHelper = (s: symbol) => `${helperNameMap[s]}:_${helperNameMap[s]}`

function genNode(node, context) {
    /**
     * 处理三种场景：
     * 1. text
     * 2.
     * 3.
     */
    switch (node.type) {
        case NodeTypes.VNODE_CALL:
            genVNodeCall(node, context)
            break
        case NodeTypes.TEXT:
            genText(node, context)
            break
    }
}

function genText(node, context) {
    context.push(JSON.stringify(node.content), node)
}

function genVNodeCall(node, context) {
    const { push, helper } = context
    const {
        tag,
        props,
        children,
        patchFlag,
        dynamicProps,
        directives,
        isBlock,
        disableTracking,
        isComponent,
    } = node

    // helper对应的key
    const callHelper = getVNodeHelper(context.isSSR, isComponent)

    // 构建：_createElementVNode(
    push(helper(callHelper) + `(`)

    // 构建_createElementVNode的参数（h函数需要）
    const args = genNullableArgs([tag, props, children, patchFlag, dynamicProps])
    genNodeList(args, context)
    push(`)`)
}

function getVNodeHelper(ssr: boolean, isComponent: boolean) {
    return ssr || isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE
}

// 对传入的参数作预处理
function genNullableArgs(args: any[]) {
    let i = args.length
    while (i--) {
        if (args[i] != null) {
            break
        }
    }
    return args.slice(0, i + 1).map(arg => arg || `null`)
}

function genNodeList(nodes, context) {
    const { push, newline } = context
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (isString(node)) {
            push(node)
        }
        // 数组需要加上[]
        else if (isArray(node)) {
            genNodeListAsArray(node, context)
        }
        // 对象
        else {
            genNode(node, context)
        }
        // ,分割参数
        if (i < nodes.length - 1) {
            push(`,`)
        }
    }
}

function genNodeListAsArray(nodes, context) {
    context.push("[")
    // 递归处理，遍历nodes进行处理
    genNodeList(nodes, context)
    context.push("]")
}

export function generate(ast: Object) {
    // 1.  创建context上下文，保存最终生成的渲染函数，以及拼接字符串、格式代码用到的函数(换行、缩进等)
    const context = createCodegenContext(ast)
    /**
     * 目标格式：
     * const _Vue = Vue
     *
     * return function render(_ctx,_cache){
     *  const {createElementVNode:_createElementVNode} = _Vue
     *  return _createElementVNode("div",[],["hello world"])
     * }
     */
    const { push, newline, indent, deindent } = context
    // 函数前序
    genFunctionPreamble(context)

    // 开始生成render渲染函数
    const functionName = `render`
    const args = ["_ctx", "_cache"]
    // 拼接函数的参数
    const signature = args.join(",")
    push(`function ${functionName}(${signature}){`)
    // 换行+缩进
    indent()
    const hasHelpers = ast.helpers.length > 0
    // 构建：const {createElementVNode:_createElementVNode} = _Vue
    if (hasHelpers) {
        push(`const {${ast.helpers.map(aliasHelper).join(",")}} = _Vue   `)
        push("\n")
        newline()
    }
    newline()
    push(`return `)

    // 构建:_createElementVNode("div",[],["hello world"])
    if (ast.codegenNode) {
        genNode(ast.codegenNode, context)
    } else {
        push(`null`)
    }

    // 最后加上'}'
    deindent()
    push("}")
    return {
        ast,
        code: context.code,
    }
}

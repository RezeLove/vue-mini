import { ElementTypes, NodeTypes } from "./ast"

export interface ParserContext {
    source: string
}

const enum TagType {
    Start,
    End,
}

export function createParserContext(content: string): ParserContext {
    return {
        source: content,
    }
}
export function baseParse(content: string) {
    console.log("trigger")
    const context = createParserContext(content)
    const children = parseChildren(context, [])
    return createRoot(children)
}

function createRoot(children: object) {
    return {
        // 最外层的type是root/0
        type: NodeTypes.ROOT,
        children,
        loc: {},
    }
}

function parseChildren(context: ParserContext, ancestors: any) {
    const nodes = []
    while (!isEnd(context, ancestors)) {
        const s = context.source
        let node
        if (startsWith(s, "{{")) {
            // TODO:模版语法
        }
        // 开始标签
        else if (s[0] === "<") {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors)
            }
        }
        if (!node) {
            node = parseText(context)
        }
        nodes.push(node)
    }
    return nodes
}

function parseElement(context: ParserContext, ancestors: any) {
    // 读取开始标签，返回一个对象，并将游标移动到开始标签后
    let element = parseTag(context, TagType.Start)

    ancestors.push(element)
    // 处理子标签（递归开始标签后的context）
    const children = parseChildren(context, ancestors)
    ancestors.pop()
    // @ts-ignore
    element.children = children

    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, TagType.End)
    }
    return element
}

function parseTag(context: ParserContext, type: TagType) {
    const match: any = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source)
    const tag = match[1]

    // 游标右移，略过开始标签，如<div
    advanceBy(context, match[0].length)

    // 接下来需要判断是否为自闭合标签，如<img /> 还是非自闭合标签<div>
    let isSelfClosing = startsWith(context.source, "/>")
    // 是自闭合标签，移动2尾 />；不是的话移动一位>
    advanceBy(context, isSelfClosing ? 2 : 1)
    return {
        type: NodeTypes.ELEMENT,
        tag,
        tagType: ElementTypes.ELEMENT,
        props: [],
        children: [],
    }
}

function parseText(context: ParserContext) {
    const endTokens = ["<", "{{"]

    let endindex = context.source.length
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i], 1)
        if (index !== -1 && endindex > index) {
            endindex = index
        }
    }
    const content = parsetTextData(context, endindex)
    return {
        type: NodeTypes.TEXT,
        content: content,
    }
}

// 截出普通文本
function parsetTextData(context: ParserContext, length: number) {
    const rawText = context.source.slice(0, length)
    advanceBy(context, length)
    return rawText
}

function isEnd(context: ParserContext, ancestors: any) {
    const s = context.source
    if (startsWith(s, "</")) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            // </是否为结束标签的开头
            if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                return true
            }
        }
    }
    return !s
}

function startsWithEndTagOpen(source: string, tag: string) {
    return startsWith(source, "</")
}

function startsWith(s: string, searchString: string) {
    return s.startsWith(searchString)
}

// 游标右移
function advanceBy(context: ParserContext, numberOfCharacters: number) {
    const { source } = context
    context.source = source.slice(numberOfCharacters)
}

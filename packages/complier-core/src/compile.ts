// @ts-nocheck
import { generate } from "./codegen"
import { baseParse } from "./parse"
import { transform } from "./transform"
import { transformElement } from "./transforms/transformElement"
import { transformText } from "./transforms/transformText"
import { extend } from "@vue/shared"

export function baseComplie(template: string, options = {}) {
    const ast = baseParse(template)
    transform(
        // @ts-ignore
        ast,
        extend(options, {
            nodeTransforms: [transformElement, transformText],
        })
    )
    console.log(ast)
    // console.log(JSON.stringify(ast))

    /**
     *javascript AST生成渲染函数,渲染函数的形式如：
     function render(){
        return h('div',[h('p','this is a sentence')])
     }
     */
    return generate(ast)
}

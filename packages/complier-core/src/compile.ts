import { transform } from "typescript"
import { baseParse } from "./parse"
import { transformElement } from "./transforms/transformElement"
import { transformText } from "./transforms/transformText"
import { extend } from "@vue/shared"

export function baseComplie(template: string, options: object) {
    const ast = baseParse(template)
    transform(
        // @ts-ignore
        ast,
        extend(options, {
            nodeTransforms: [transformElement, transformText],
        })
    )
    console.log(JSON.stringify(ast))
    return {}
}

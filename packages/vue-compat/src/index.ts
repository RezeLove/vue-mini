// @ts-nocheck
import { compile } from "@vue/complier-core"

function compileToFunction(template, options?) {
    const { code } = compile(template, options)
    const render = new Function(code)()
    return render
}

export { compileToFunction as compile }

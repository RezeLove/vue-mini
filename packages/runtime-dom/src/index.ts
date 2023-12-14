// @ts-nocheck
import { createRenderer } from "packages/runtime-core/src/renderer"
import { nodeOps } from "./nodeOps"

let renderer
function ensureRenderer() {
    return renderer || createRenderer(nodeOps)
}
export const render = (...args) => {
    ensureRenderer().render(...args)
}

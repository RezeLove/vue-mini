import { mutableHandlers } from "./baseHandlers"
import { isObject } from "@vue/shared"
export const reactiveMap = new WeakMap<object, any>()

// enum枚举类型
export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive",
}

export function reactive(target: Object) {
    return createReactiveObject(target, mutableHandlers, reactiveMap)
}

function createReactiveObject(
    target: Object,
    baseHandlers: ProxyHandler<any>,
    proxyMap: WeakMap<object, any>
) {
    const existingProxy = proxyMap.get(target)
    if (existingProxy) {
        return existingProxy
    }
    const proxy = new Proxy(target, baseHandlers)
    proxy[ReactiveFlags.IS_REACTIVE] = true
    proxyMap.set(target, proxy)
    return proxy
}

export const toReactive = <T extends unknown>(value: T): T => {
    return isObject(value) ? reactive(value as Object) : value
}

export function isReactive(value: any): boolean {
    return value && value[ReactiveFlags.IS_REACTIVE] ? true : false
}

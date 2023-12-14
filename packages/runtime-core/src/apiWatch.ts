import { queuePreFlushCb } from "@vue/runtime-core"
import { EMPTY_OBJ, hasChanged, isArray, isFunction, isObject } from "@vue/shared"
import { ReactiveEffect } from "packages/reactivity/src/effect"
import { isReactive } from "packages/reactivity/src/reactive"
import { isRef } from "packages/reactivity/src/ref"

export interface WatchOptions<immediate = boolean> {
    immediate?: immediate
    deep?: boolean
}

export function watch(source: any, cb: Function, options?: WatchOptions) {
    return doWatch(source, cb, options)
}

function doWatch(source: any, cb: Function, { immediate, deep }: WatchOptions = EMPTY_OBJ) {
    let getter: () => any

    const job = () => {
        if (cb) {
            const newValue = effect.run()
            if (deep || hasChanged(newValue, oldValue)) {
                cb(newValue, oldValue)
                oldValue = newValue
            }
        }
    }

    if (isReactive(source)) {
        // getter是一个返回source的函数
        getter = () => source
        deep = true
    } else if (isRef(source)) {
        getter = () => source.value
    } else if (isFunction(source)) {
        // 如果是函数
        getter = () => source()
    }
    // else if (isArray(source)) {
    //     // 如果是数组，进行循环处理
    //     getter = () =>
    //         source.map((s: unknown) => {
    //             if (isRef(s)) {
    //                 return s.value
    //             } else if (isReactive(s)) {
    //                 return traverse(s)
    //             } else if (isFunction(s)) {
    //                 return s()
    //             }
    //         })
    // }
    else {
        getter = () => {}
    }

    // deep监听的是一个对象 需要进行深度侦听，遍历其每个属性，触发getter收集依赖
    if (cb && deep) {
        const baseGetter = getter
        // getter拿到
        getter = () => traverse(baseGetter())
    }

    let oldValue = {}

    // scheduler控制调度函数的执行时机
    /**
     * watch的options中有参数flush：pre(默认)|post|sync
     * sync:同步执行
     * post:通过queuePostFlushCb执行
     * pre:通过queuePreFlushCb执行
     */
    const scheduler = () => queuePreFlushCb(job)
    const effect = new ReactiveEffect(getter, scheduler)

    if (cb) {
        if (immediate) {
            job()
        } else {
            oldValue = effect.run()
        }
    } else {
        effect.run()
    }

    return () => {
        effect.stop()
    }
}

export function traverse(value: unknown) {
    if (!isObject(value)) {
        return value
    } else {
        // 遍历每个属性，触发proxy的getter，收集依赖
        for (const key in value as Object) {
            traverse((value as any)[key])
        }
    }
    return value
}

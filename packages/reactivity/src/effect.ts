import { extend } from "@vue/shared"
import { ComputedRefImpl } from "./computed"
import { createDep, Dep } from "./deps"

export interface ReactiveEffectOptions {
    lazy?: boolean
    scheduler: EffectSchedler
}

// <T>表示泛型
export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
    const _effect = new ReactiveEffect(fn)
    if (options) {
        // 将scheduler和lazy属性复制给了_effect对象
        extend(_effect, options)
    }
    // 懒执行 不立即执行 ||前面true则返回true；前面false则看后面
    if (!options || !options.lazy) {
        _effect.run()
    }
    // 等函数运行结束后，依赖已经收集完毕，此时置空activeEffect防止被不相关的key收集
    activeEffect = null
}

export let activeEffect: ReactiveEffect | undefined | null

export type EffectSchedler = (...args: any) => any

export class ReactiveEffect<T = any> {
    public computed?: ComputedRefImpl<T>
    // ts中成员默认为public，在构造函数的参数上使用public等同于创建了同名的成员变量
    constructor(public fn: () => T, public scheduler: EffectSchedler | null = null) {}
    run() {
        activeEffect = this
        return this.fn()
    }
    stop() {}
}

type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

// 收集依赖
export function track(target: object, key: unknown) {
    if (!activeEffect) return
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (dep?.has(activeEffect)) {
        return
    }
    if (!dep) {
        depsMap.set(key, (dep = createDep()))
    }
    // console.log(targetMap)
    trackEffects(dep)
}

export function trackEffects(deps: Dep) {
    // !可以排除undefined和null
    deps.add(activeEffect!)
}

// 触发依赖
export function trigger(target: object, key: unknown, newvalue: unknown) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        return
    }
    const dep: Dep | undefined = depsMap.get(key)

    if (!dep) {
        return
    }

    triggerEffects(dep)
}

export function triggerEffects(dep: Dep) {
    const effects = Array.isArray(dep) ? dep : [...dep]
    for (const effect of effects) {
        if (effect.computed) {
            triggerEffect(effect)
        }
    }
    for (const effect of effects) {
        if (!effect.computed) {
            triggerEffect(effect)
        }
    }
}

export function triggerEffect(effect: ReactiveEffect) {
    if (effect.scheduler) {
        effect.scheduler()
    } else {
        effect.run()
    }
}

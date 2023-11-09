import { createDep, Dep } from "./deps"
// <T>表示泛型
export function effect<T = any>(fn: () => T) {
    const _effect = new ReactiveEffect(fn)
    _effect.run()
    // 等函数运行结束后，依赖已经收集完毕，此时置空activeEffect防止被不相关的key收集
    activeEffect = null
}

export let activeEffect: ReactiveEffect | undefined | null

export class ReactiveEffect<T = any> {
    // ts中成员默认为public，在构造函数的参数上使用public等同于创建了同名的成员变量
    constructor(public fn: () => T) {}
    run() {
        activeEffect = this
        return this.fn()
    }
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
    console.log(targetMap)
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
        effect.run()
    }
}

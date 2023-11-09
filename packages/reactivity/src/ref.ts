import { hasChanged } from "@vue/shared"
import { Dep, createDep } from "./deps"
import { activeEffect, trackEffects, trigger, triggerEffects } from "./effect"
import { toReactive } from "./reactive"
export interface Ref<T = any> {
    value: T
}

export function ref(value?: unknown) {
    return createRef(value, false)
}

export function createRef(rawvalue: unknown, shallow: boolean) {
    if (isRef(rawvalue)) {
        return
    }
    return new RefImpl(rawvalue, shallow)
}

export function isRef(r: any) {
    // !!是强制转为布尔值 一个！会转化为布尔值，但结果会相反，因此再加一个
    return !!(r && r.__v_isRef === true)
}

export class RefImpl<T> {
    private _value: T
    private _rawvalue: T
    public readonly __v_isRef = true
    public dep?: Dep = undefined
    // _value表示私有属性
    constructor(value: T, readonly __v_isShallow: boolean) {
        this._rawvalue = value
        this._value = __v_isShallow ? value : toReactive(value)
    }

    // es6 get和set
    get value() {
        console.log("get")
        trackRefValue(this)
        return this._value
    }
    set value(newval) {
        console.log("set")
        // 如果是修改对象的某个属性并不会触发set,而是触发Proxy的setter
        if (hasChanged(this._rawvalue, newval)) {
            // 因为newval会经过toReactive的转换，因此这里记录下原始值
            this._rawvalue = newval
            this._value = toReactive(newval)
            triggerRefValue(this)
        }
    }
}

export function trackRefValue(ref: any) {
    if (activeEffect) {
        trackEffects(ref.dep || (ref.dep = createDep()))
    }
}

export function triggerRefValue(ref: any) {
    if (ref.dep) {
        triggerEffects(ref.dep)
    }
}

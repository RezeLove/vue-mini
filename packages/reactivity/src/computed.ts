import { isFunction } from "@vue/shared"
import { Dep } from "./deps"
import { ReactiveEffect, trigger } from "./effect"
import { trackRefValue, triggerRefValue } from "./ref"
export function computed(getterOrOptions: any) {
    let getter
    const only_getter = isFunction(getterOrOptions)
    if (only_getter) {
        getter = getterOrOptions
    }
    return new ComputedRefImpl(getter)
}

export class ComputedRefImpl<T> {
    // dep收集的是computed和effect的关系
    public dep?: Dep = undefined
    private _value!: T
    public readonly effect: ReactiveEffect<T>
    public readonly __v_isRef = true
    public _dirty = true
    constructor(getter: () => T) {
        this.effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true
                triggerRefValue(this)
            }
        })
        // effect生成后，建立了响应性数据与computed的关系
        // 数据发生变化->触发this.effect->触发triggerRefValue
        this.effect.computed = this
    }
    get value() {
        trackRefValue(this)
        if (this._dirty) {
            this._value = this.effect.run()
            this._dirty = false
        }
        return this._value
    }
}

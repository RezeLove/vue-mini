import { isFunction } from "@vue/shared"
import { Dep } from "./deps"
export function computed(getterOrOptions: unknown) {
    let getter
    const only_getter = isFunction(getterOrOptions)
    if (only_getter) {
        getter = getterOrOptions
    }
}

export class ComputedRefImpl<T> {
    public dep?: Dep = undefined
    // ！非空断言
    private _value!:<T>
    constructor(getter) {}
}

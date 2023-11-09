import { track, trigger } from "./effect"

function createGetter() {
    return function get(target: object, key: string | symbol, receiver: object) {
        const res = Reflect.get(target, key, receiver)
        console.log("track")
        track(target, key)
        return res
    }
}

function createSetter() {
    return function get(target: object, key: string | symbol, value: unknown, receiver: object) {
        const res = Reflect.set(target, key, value, receiver)
        console.log("trigger")
        trigger(target, key, value)
        return res
    }
}

const get = createGetter()
const set = createSetter()

export const mutableHandlers: ProxyHandler<object> = {
    get,
    set,
}

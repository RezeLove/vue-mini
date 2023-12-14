export const isObject = (val: unknown) => {
    return val !== null && typeof val === "object"
}

export const hasChanged = (value: unknown, oldvalue: unknown): boolean => {
    return !Object.is(value, oldvalue)
}

export const isFunction = (value: unknown): boolean => {
    return typeof value === "function"
}

export const isArray = (value: unknown): boolean => {
    return Array.isArray(value)
}

export const isString = (val: unknown) => {
    return typeof val === "string"
}

export const extend = (target: object, source: object) => {
    Object.assign(target, source)
}

const onRE = /^on/
export const isOn = (key: string) => {
    return onRE.test(key)
}
export const EMPTY_OBJ: { readonly [key: string]: any } = {}

export const getSequence = (arr: Array<number>) => {
    const p = arr.slice()
    const result = [0]
    let i, j, u, v, c
    const len = arr.length
    for (i = 0; i < len; i++) {
        const arrI = arr[i]

        if (arrI !== 0) {
            j = result[result.length - 1]

            if (arr[j] < arrI) {
                p[i] = j

                result.push(i)

                continue
            }

            u = 0

            v = result.length - 1

            while (u < v) {
                c = ((u + v) / 2) | 0

                if (arr[result[c]] < arrI) {
                    u = c + 1
                } else {
                    v = c
                }
            }

            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1]
                }

                result[u] = i
            }
        }
    }
    u = result.length
    v = result[u - 1]
    while (u-- > 0) {
        result[u] = v
        v = p[v]
    }
    return result
}

export const isObject = (val: unknown) => {
    return val !== null && typeof val === "object"
}

export const hasChanged = (value: unknown, oldvalue: unknown): boolean => {
    return !Object.is(value, oldvalue)
}

export const isFunction = (value: unknown): boolean => {
    return typeof value === "function"
}

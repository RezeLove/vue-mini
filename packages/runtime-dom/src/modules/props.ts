export const patchDOMProp = (el: Element, key: string, value: string | null) => {
    if (typeof key === "string" && value === null) {
        // @ts-ignore
        el[key] = true
    }
    // @ts-ignore
    el[key] = value
}

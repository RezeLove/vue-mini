export function patchClass(el: Element, value: string | null) {
    if (value) {
        el.className = value
    } else {
        el.removeAttribute("class")
    }
}

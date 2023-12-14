export function patchEvent(
    el: Element & { _vei?: Object },
    eventname: string,
    prev: any,
    next: any
) {
    const name = eventname.slice(2).toLowerCase()
    const invokers = el._vei || (el._vei = {})
    // @ts-ignore
    let invoker = el._vei[name]
    if (next) {
        // invoker不存在 表示旧节点不存在此事件 直接添加
        if (!invoker) {
            invoker = (e: Event) => {
                //e.timeStamp是事件触发的时间(内层元素) invoker.attached是事件绑定的时间
                if (e.timeStamp < invoker.attached) {
                    return
                }
                // 数组类型遍历执行
                if (Array.isArray(invoker.value)) {
                    invoker.value.forEach((fn: Function) => fn(e))
                } else {
                    // 直接执行value函数
                    invoker.value(e)
                }
            }
            // value绑定真正的函数
            invoker.value = next
            // 记录下绑定事件的时间
            invoker.attached = performance.now()
            el.addEventListener(name, invoker)
            // @ts-ignore
            el._vei[name] = invoker
        }
        // 旧invoker存在，更新即可
        invoker.value = next
    }
    // 旧invoker存在，新的不存在，需要卸掉
    else if (invoker) {
        el.removeEventListener(name, invoker)
    }
}

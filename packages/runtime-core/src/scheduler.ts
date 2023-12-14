let isFlushPending = false
// 生成一个Promise对象
const resolvedPromise = Promise.resolve() as Promise<any>

let currentFlushPromise: Promise<void> | null = null

const pendingPreFlushCbs: Function[] = []

export function queuePreFlushCb(cb: Function) {
    queueCb(cb, pendingPreFlushCbs)
}

/**
 *
 * @param cb：callback函数
 * @param pendingQueue : Function数组
 */
function queueCb(cb: Function, pendingQueue: Function[]) {
    pendingQueue.push(cb)
    queueFlush()
}

function queueFlush() {
    if (!isFlushPending) {
        isFlushPending = true
        // 让flushjobs成为一个异步的微任务
        currentFlushPromise = resolvedPromise.then(flushjobs)
    }
}

// 处理队列
function flushjobs() {
    isFlushPending = false
    flushPreFlushCbs()
}

export function flushPreFlushCbs() {
    if (pendingPreFlushCbs.length) {
        // 拷贝并去重，类似于一个深拷贝
        let activePreFlushCbs = [...new Set(pendingPreFlushCbs)]
        // 置空 便于下次使用
        pendingPreFlushCbs.length = 0

        // 依次执行cb函数
        for (let i = 0; i < activePreFlushCbs.length; i++) {
            activePreFlushCbs[i]()
        }
    }
}

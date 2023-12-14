var Vue = (function (exports) {
    'use strict';

    const isObject = (val) => {
        return val !== null && typeof val === "object";
    };
    const hasChanged = (value, oldvalue) => {
        return !Object.is(value, oldvalue);
    };
    const isFunction = (value) => {
        return typeof value === "function";
    };
    const isArray = (value) => {
        return Array.isArray(value);
    };
    const isString = (val) => {
        return typeof val === "string";
    };
    const extend = Object.assign;
    const onRE = /^on/;
    const isOn = (key) => {
        return onRE.test(key);
    };
    const EMPTY_OBJ = {};
    const getSequence = (arr) => {
        const p = arr.slice();
        const result = [0];
        let i, j, u, v, c;
        const len = arr.length;
        for (i = 0; i < len; i++) {
            const arrI = arr[i];
            if (arrI !== 0) {
                j = result[result.length - 1];
                if (arr[j] < arrI) {
                    p[i] = j;
                    result.push(i);
                    continue;
                }
                u = 0;
                v = result.length - 1;
                while (u < v) {
                    c = ((u + v) / 2) | 0;
                    if (arr[result[c]] < arrI) {
                        u = c + 1;
                    }
                    else {
                        v = c;
                    }
                }
                if (arrI < arr[result[u]]) {
                    if (u > 0) {
                        p[i] = result[u - 1];
                    }
                    result[u] = i;
                }
            }
        }
        u = result.length;
        v = result[u - 1];
        while (u-- > 0) {
            result[u] = v;
            v = p[v];
        }
        return result;
    };

    // Fragment、Text和Commment类型
    const Fragment = Symbol("Fragment");
    const Text$1 = Symbol("Text");
    const Comment$1 = Symbol("Comment");
    function createVnode(type, props, children) {
        if (props) {
            const { class: klass, style } = props;
            props.class = normalizeClass(klass);
        }
        const shapeFlag = isString(type)
            ? 1 /* ShapeFlags.ELEMENT */
            : // 如果type是一个对象，那么就表示是一个组件
                isObject(type)
                    ? 4 /* ShapeFlags.STATEFUL_COMPONENT */
                    : 0;
        const key = (props === null || props === void 0 ? void 0 : props.key) ? props.key : null;
        return createBaseVNode(type, props, children, shapeFlag, key);
    }
    function createBaseVNode(type, props, children, shapeFlag, key) {
        const vnode = {
            __v_isVNode: true,
            type,
            props,
            shapeFlag,
            key,
        };
        // children类型较多，可以是字符串、对象、数组等等，在解析成vnode时要处理成统一的结构
        normalizeChildren(vnode, children);
        return vnode;
    }
    function normalizeChildren(vnode, children) {
        let type = 0;
        if (!children) {
            children = null;
        }
        else if (isArray(children)) {
            type = 16 /* ShapeFlags.ARRAY_CHILDREN */;
        }
        else if (isObject(children)) ;
        else if (isFunction(children)) ;
        else {
            // 字符串
            children = String(children);
            // 文本节点
            type = 8 /* ShapeFlags.TEXT_CHILDREN */;
        }
        vnode.children = children;
        // 按位进行或运算 下式等于 vnode.shapeFlag = vnode.shapeFlag|type,vnode.shapeFlag与type会按位进行或运算，只要有1个1，结果就是1
        // shapeFlag是容器的类型，type是children的类型
        vnode.shapeFlag |= type;
    }
    // class统一处理为'class1 class2 class3'的形式，中间用空格拼接
    function normalizeClass(value) {
        let res = "";
        if (isString(value)) {
            res = value;
        }
        // 注意:这里要先判断是否为数组，因为array也是obj类型的
        // 绑定数组：<div :class="[activeClass, errorClass]"></div>
        else if (isArray(value)) {
            // 数组的元素可能是字符串或数组
            for (let cls of value) {
                const normalized = normalizeClass(cls);
                res += normalized + " ";
            }
        }
        // 绑定对象:class="{ active: isActive, 'text-danger': hasError }"
        else if (isObject(value)) {
            for (let key in value) {
                if (value[key]) {
                    // 空格进行拼接
                    res += key + " ";
                }
            }
        }
        // 去除头尾的空格(在递归时也有用处)
        return res.trim();
    }
    function isVNode(value) {
        return value ? value.__v_isVNode === true : false;
    }

    function patchClass(el, value) {
        if (value) {
            el.className = value;
        }
        else {
            el.removeAttribute("class");
        }
    }

    const patchDOMProp = (el, key, value) => {
        if (typeof key === "string" && value === null) {
            // @ts-ignore
            el[key] = true;
        }
        // @ts-ignore
        el[key] = value;
    };

    const patchAttr = (el, key, value) => {
        if (value) {
            el.setAttribute(key, value);
        }
        else {
            el.removeAttribute(key);
        }
    };

    function patchStyle(el, key, prev, next) {
        // @ts-ignore
        const style = el.style;
        // style属性的类型是obj或者array 这里只考虑obj类型
        const isCssString = isString(next);
        if (next && !isCssString) {
            for (let key in next) {
                setStyle(style, key, next[key]);
            }
        }
        else if (prev && isString(prev)) {
            for (let key in prev) {
                setStyle(style, key, "");
            }
        }
    }
    function setStyle(style, name, val) {
        // @ts-ignore
        style[name] = val;
    }

    function patchEvent(el, eventname, prev, next) {
        const name = eventname.slice(2).toLowerCase();
        el._vei || (el._vei = {});
        // @ts-ignore
        let invoker = el._vei[name];
        if (next) {
            // invoker不存在 表示旧节点不存在此事件 直接添加
            if (!invoker) {
                invoker = (e) => {
                    //e.timeStamp是事件触发的时间(内层元素) invoker.attached是事件绑定的时间
                    if (e.timeStamp < invoker.attached) {
                        return;
                    }
                    // 数组类型遍历执行
                    if (Array.isArray(invoker.value)) {
                        invoker.value.forEach((fn) => fn(e));
                    }
                    else {
                        // 直接执行value函数
                        invoker.value(e);
                    }
                };
                // value绑定真正的函数
                invoker.value = next;
                // 记录下绑定事件的时间
                invoker.attached = performance.now();
                el.addEventListener(name, invoker);
                // @ts-ignore
                el._vei[name] = invoker;
            }
            // 旧invoker存在，更新即可
            invoker.value = next;
        }
        // 旧invoker存在，新的不存在，需要卸掉
        else if (invoker) {
            el.removeEventListener(name, invoker);
        }
    }

    const patchProp = (el, key, prev, newv) => {
        // 处理class
        if (key === "class") {
            patchClass(el, newv);
        }
        // 处理style
        else if (key === "style") {
            patchStyle(el, key, prev, newv);
        }
        // 处理事件
        else if (isOn(key)) {
            patchEvent(el, key, prev, newv);
        }
        // 通过属性名挂载属性
        else if (shouldSetAsProps(el, key)) {
            patchDOMProp(el, key, newv);
        }
        // 通过setAttribute挂载属性
        else {
            patchAttr(el, key, newv);
        }
    };
    function shouldSetAsProps(el, key, newv) {
        // form是只读的属性
        if (key === "form" && el.tagName === "INPUT") {
            return false;
        }
        // input list必须通过setAttribute设定
        if (key === "list" && el.tagName === "INPUT") {
            return false;
        }
        if (key === "type" && el.tagName === "INPUT") {
            return false;
        }
        // el是否有这个key，如果有则可以通过DOM properties设置；如果没有只能通过setAttr进行设置
        return key in el;
    }

    function normalizeVnode(child) {
        // vnode或者数组
        if (typeof child == "object") {
            return child;
        }
        // 文本
        else {
            return createVnode(Text, null, String(child));
        }
    }

    function createRenderer(options) {
        return baseCreateRenderer(options);
    }
    function baseCreateRenderer(options) {
        // 从options取出相关函数
        const { createElement, setElementText, removeChild, insert, createText, setText, createComment, } = options;
        /**container._vnode
         *
         * @param vnode :新vnode
         * @param container:代挂载的容器
         */
        const render = (vnode, container) => {
            // 新的vnode为空
            if (!vnode) {
                // 卸载掉旧vnode
                if (container._vnode) {
                    unmount(container._vnode);
                }
            }
            else {
                patch(container._vnode || null, vnode, container);
            }
            // 保存当前的vnode
            container._vnode = vnode;
        };
        const unmount = (vnode) => {
            // Fragment需要将子节点一一卸载
            if (vnode.type === Fragment) {
                vnode.children.forEach((c) => {
                    unmount(c);
                    return;
                });
            }
            const el = vnode.el;
            removeChild(el);
        };
        const patch = (oldVnode, newVnode, container, anchor = null) => {
            oldVnode = oldVnode ? oldVnode : container._vnode;
            if (oldVnode === newVnode) {
                return;
            }
            const { type, shapeFlag } = newVnode;
            // 如果新旧节点的type不一致，没有打补丁的必要
            if (oldVnode && oldVnode.type !== type) {
                unmount(oldVnode);
                // 卸载后记得将oldVnode置空
                oldVnode = null;
            }
            // 判断新结点类型
            switch (type) {
                case Text$1:
                    processText(oldVnode, newVnode, container, anchor);
                    break;
                case Comment:
                    processComment(oldVnode, newVnode, container, anchor);
                    break;
                case Fragment:
                    // 对于Fragment类型的vnode来说,它的children存储的内容就是模板中所有根节点，因此在挂载和卸载时，只需要考虑子节点
                    processFragment(oldVnode, newVnode, container, anchor);
                    break;
                default:
                    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                        processElement(oldVnode, newVnode, container, anchor);
                    }
            }
        };
        const processComment = (oldVnode, newVnode, container, anchor = null) => {
            if (!oldVnode) {
                newVnode.el = createComment(newVnode === null || newVnode === void 0 ? void 0 : newVnode.children);
                insert(newVnode === null || newVnode === void 0 ? void 0 : newVnode.el, container);
            }
            else {
                const el = oldVnode.el;
                newVnode.el = el;
                if (newVnode.children !== oldVnode.children) {
                    // @ts-ignore
                    setText(el, newVnode.children);
                }
            }
        };
        const processText = (oldVnode, newVnode, container, anchor = null) => {
            if (!oldVnode) {
                newVnode.el = createText(newVnode === null || newVnode === void 0 ? void 0 : newVnode.children);
                insert(newVnode === null || newVnode === void 0 ? void 0 : newVnode.el, container);
            }
            else {
                const el = (newVnode.el = oldVnode.el);
                if (newVnode.children !== oldVnode.children) {
                    // @ts-ignore
                    setText(el, newVnode.children);
                }
            }
        };
        const processFragment = (oldVnode, newVnode, container, anchor = null) => {
            if (!oldVnode) {
                newVnode.children.forEach((child) => {
                    // 因为是挂载的是Fragment的子节点，可能存在纯文本的情况，还需进行统一处理
                    let childToMount = normalizeVnode(child);
                    patch(null, childToMount, container, null);
                });
            }
            else {
                patchChildren(oldVnode, newVnode, container, null);
            }
        };
        const processElement = (oldVnode, newVnode, container, anchor = null) => {
            if (!oldVnode) {
                console.log("mount");
                // 直接挂载
                mountElement(newVnode, container, anchor);
            }
            else {
                console.log("patch");
                patchElement(oldVnode, newVnode, anchor);
            }
        };
        // 挂载element
        const mountElement = (vnode, container, anchor = null) => {
            const { type, shapeFlag, props } = vnode;
            // 1. 创建element
            const el = (vnode.el = createElement(type));
            // 2. 挂载子节点
            // 文本
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                setElementText(el, vnode.children);
            }
            // 3. 设置props
            if (props) {
                for (let key in props) {
                    patchProp(el, key, null, props[key]);
                }
            }
            // 4.挂载到容器
            insert(el, container, anchor);
            if (vnode.children) {
                mountChildren(vnode.children, el, anchor);
            }
        };
        // @ts-ignore
        const mountChildren = (children, container, anchor) => {
            if (isString(children)) {
                children = children.split("");
            }
            for (let i = 0; i < children.length; i++) {
                const child = normalizeVnode(children[i]);
                patch(null, child, container, anchor);
            }
        };
        // 为element打补丁
        const patchElement = (oldVnode, newVnode, anchor = null) => {
            const el = oldVnode.el;
            newVnode.el = el;
            const oldProps = oldVnode.props || EMPTY_OBJ;
            const newProps = newVnode.props || EMPTY_OBJ;
            // 更新子节点
            patchChildren(oldVnode, newVnode, el, anchor);
            // 更新属性
            patchProps(el, newVnode, oldProps, newProps);
        };
        // 子节点更新
        const patchChildren = (oldVnode, newVnode, container, anchor = null) => {
            // 短路运算符 前面为true，取后面的值；前面为false，则取false
            const oldchild = oldVnode && oldVnode.children;
            const newchild = newVnode && newVnode.children;
            // 实际上执行到patchElement时，oldVnode和newVnode都是存在的
            const prevShapeflag = oldVnode.shapeFlag;
            const { shapeFlag } = newVnode;
            // 子节点有三种类型：空、文本、数组；新旧组合共有9种情况
            // 新子节点为文本
            if (shapeFlag & 8 /* ShapeFlags.TEXT_CHILDREN */) {
                // 如果不是array或者为空，直接修改文本值即可
                if (oldchild !== newchild) {
                    setElementText(container, newchild);
                }
            }
            // 新子节点为array
            else if (shapeFlag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 旧子节点也为array
                if (prevShapeflag & 16 /* ShapeFlags.ARRAY_CHILDREN */) {
                    // diff算法进行更新
                    patchKeyedChildren(oldchild, newchild, oldVnode.el);
                }
                else {
                    // 那么旧子节点就为text或空，统一置空再重新挂载
                    setElementText(container, "");
                    newchild.forEach((child) => {
                        mountElement(child, container, null);
                    });
                }
            }
            // 新子节点不存在
            else {
                // 旧子节点为数组
                if (prevShapeflag & 16 /* ShapeFlags.ARRAY_CHILDREN */) ;
                else {
                    setElementText(container, "");
                }
            }
        };
        const patchKeyedChildren = (oldChildren, newChildren, container) => {
            console.log("patchKeyedChildren");
            let j = 0;
            let oldVNode = oldChildren[j];
            let newVNode = newChildren[j];
            while (oldVNode.key === newVNode.key) {
                patch(oldVNode, newVNode, container);
                j++;
                console.log(newVNode.key);
                oldVNode = oldChildren[j];
                newVNode = newChildren[j];
            }
            let oldEnd = oldChildren.length - 1;
            let newEnd = newChildren.length - 1;
            oldVNode = oldChildren[oldEnd];
            newVNode = newChildren[newEnd];
            while (oldVNode.key === newVNode.key) {
                patch(oldVNode, newVNode, container);
                console.log(newVNode.key);
                oldEnd--;
                newEnd--;
                oldVNode = oldChildren[oldEnd];
                newVNode = newChildren[newEnd];
            }
            if (j > oldEnd && j <= newEnd) {
                const anchorIndex = newEnd + 1;
                const anchor = anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null;
                console.log("mountnew");
                while (j <= newEnd) {
                    patch(null, newChildren[j++], container, anchor);
                }
            }
            else if (j > newEnd && j <= oldEnd) {
                console.log("unmount,old");
                while (j <= oldEnd) {
                    unmount(oldChildren[j++]);
                }
            }
            else {
                const count = newEnd - j + 1;
                const source = new Array(count);
                source.fill(-1);
                const oldStart = j;
                const newStart = j;
                let moved = false;
                let pos = 0;
                const keyIndex = {};
                for (let i = newStart; i <= newEnd; i++) {
                    // @ts-ignore
                    keyIndex[newChildren[i].key] = i;
                }
                let patched = 0;
                for (let i = oldStart; i <= oldEnd; i++) {
                    oldVNode = oldChildren[i];
                    if (patched < count) {
                        // @ts-ignore
                        const k = keyIndex[oldVNode.key];
                        if (typeof k !== "undefined") {
                            newVNode = newChildren[k];
                            patch(oldVNode, newVNode, container);
                            patched++;
                            source[k - newStart] = i;
                            if (k < pos) {
                                moved = true;
                            }
                            else {
                                pos = k;
                            }
                        }
                        else {
                            unmount(oldVNode);
                        }
                    }
                    else {
                        unmount(oldVNode);
                    }
                }
                console.log("end");
                if (moved) {
                    console.log("moved");
                    const seq = getSequence(source);
                    seq.length - 1;
                    let i = count - 1;
                    for (i; i >= 0; i--) {
                        if (source[i] === -1) {
                            const pos = i + newStart;
                            const newVNode = newChildren[pos];
                            const nextPos = pos + 1;
                            const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null;
                            patch(null, newVNode, container, anchor);
                        }
                        else if (i !== seq[j]) {
                            const pos = i + newStart;
                            const newVNode = newChildren[pos];
                            const nextPos = pos + 1;
                            const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null;
                            insert(newVNode.el, container, anchor);
                        }
                        else ;
                    }
                }
            }
        };
        // 更新属性
        const patchProps = (el, vnode, oldprops, newprops) => {
            if (oldprops !== newprops) {
                // 先循环newprops
                for (let key in newprops) {
                    if (newprops[key] !== oldprops[key]) {
                        patchProp(el, key, oldprops[key], newprops[key]);
                    }
                }
                // 再循环oldprops 将不需要的属性卸载
                for (let key in oldprops) {
                    if (!(key in newprops)) {
                        patchProp(el, key, oldprops[key], null);
                    }
                }
            }
        };
        return {
            render,
        };
    }

    const doc = document;
    const nodeOps = {
        createElement(type) {
            return doc.createElement(type);
        },
        setElementText(node, text) {
            node.textContent = text;
        },
        removeChild(el) {
            const parent = el.parentNode;
            if (parent) {
                parent.removeChild(el);
            }
        },
        insert(child, parent, anchor) {
            console.log(anchor);
            parent.insertBefore(child, anchor);
        },
        // 处理复杂，单独写为一个文件
        patchProp,
        createText(text) {
            const el = doc.createTextNode(text);
            return el;
        },
        createComment(text) {
            const el = doc.createComment(text);
            return el;
        },
        setText(el, text) {
            el.nodeValue = text;
        },
    };

    // @ts-nocheck
    function ensureRenderer() {
        return createRenderer(nodeOps);
    }
    const render = (...args) => {
        ensureRenderer().render(...args);
    };

    // ?表示不一定存在
    const createDep = (effects) => {
        return new Set(effects);
    };

    // <T>表示泛型
    function effect(fn, options) {
        const _effect = new ReactiveEffect(fn);
        if (options) {
            // 将scheduler和lazy属性复制给了_effect对象
            extend(_effect, options);
        }
        // 懒执行 不立即执行 ||前面true则返回true；前面false则看后面
        if (!options || !options.lazy) {
            _effect.run();
        }
        // 等函数运行结束后，依赖已经收集完毕，此时置空activeEffect防止被不相关的key收集
        activeEffect = null;
    }
    let activeEffect;
    class ReactiveEffect {
        // ts中成员默认为public，在构造函数的参数上使用public等同于创建了同名的成员变量
        constructor(fn, scheduler = null) {
            this.fn = fn;
            this.scheduler = scheduler;
        }
        run() {
            activeEffect = this;
            return this.fn();
        }
        stop() { }
    }
    const targetMap = new WeakMap();
    // 收集依赖
    function track(target, key) {
        if (!activeEffect)
            return;
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (dep === null || dep === void 0 ? void 0 : dep.has(activeEffect)) {
            return;
        }
        if (!dep) {
            depsMap.set(key, (dep = createDep()));
        }
        // console.log(targetMap)
        trackEffects(dep);
    }
    function trackEffects(deps) {
        // !可以排除undefined和null
        deps.add(activeEffect);
    }
    // 触发依赖
    function trigger(target, key, newvalue) {
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            return;
        }
        const dep = depsMap.get(key);
        if (!dep) {
            return;
        }
        triggerEffects(dep);
    }
    function triggerEffects(dep) {
        const effects = Array.isArray(dep) ? dep : [...dep];
        for (const effect of effects) {
            if (effect.computed) {
                triggerEffect(effect);
            }
        }
        for (const effect of effects) {
            if (!effect.computed) {
                triggerEffect(effect);
            }
        }
    }
    function triggerEffect(effect) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }

    function createGetter() {
        return function get(target, key, receiver) {
            const res = Reflect.get(target, key, receiver);
            console.log("track");
            track(target, key);
            return res;
        };
    }
    function createSetter() {
        return function get(target, key, value, receiver) {
            const res = Reflect.set(target, key, value, receiver);
            console.log("trigger");
            trigger(target, key);
            return res;
        };
    }
    const get = createGetter();
    const set = createSetter();
    const mutableHandlers = {
        get,
        set,
    };

    const reactiveMap = new WeakMap();
    function reactive(target) {
        return createReactiveObject(target, mutableHandlers, reactiveMap);
    }
    function createReactiveObject(target, baseHandlers, proxyMap) {
        const existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }
        const proxy = new Proxy(target, baseHandlers);
        proxy["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */] = true;
        proxyMap.set(target, proxy);
        return proxy;
    }
    const toReactive = (value) => {
        return isObject(value) ? reactive(value) : value;
    };
    function isReactive(value) {
        return value && value["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */] ? true : false;
    }

    function ref(value) {
        return createRef(value, false);
    }
    function createRef(rawvalue, shallow) {
        if (isRef(rawvalue)) {
            return;
        }
        return new RefImpl(rawvalue, shallow);
    }
    function isRef(r) {
        // !!是强制转为布尔值 一个！会转化为布尔值，但结果会相反，因此再加一个
        return !!(r && r.__v_isRef === true);
    }
    class RefImpl {
        // _value表示私有属性
        constructor(value, __v_isShallow) {
            this.__v_isShallow = __v_isShallow;
            this.__v_isRef = true;
            this.dep = undefined;
            this._rawvalue = value;
            this._value = __v_isShallow ? value : toReactive(value);
        }
        // es6 get和set
        get value() {
            console.log("get");
            trackRefValue(this);
            return this._value;
        }
        set value(newval) {
            console.log("set");
            // 如果是修改对象的某个属性并不会触发set,而是触发Proxy的setter
            if (hasChanged(this._rawvalue, newval)) {
                // 因为newval会经过toReactive的转换，因此这里记录下原始值
                this._rawvalue = newval;
                this._value = toReactive(newval);
                triggerRefValue(this);
            }
        }
    }
    function trackRefValue(ref) {
        if (activeEffect) {
            trackEffects(ref.dep || (ref.dep = createDep()));
        }
    }
    function triggerRefValue(ref) {
        if (ref.dep) {
            triggerEffects(ref.dep);
        }
    }

    function computed(getterOrOptions) {
        let getter;
        const only_getter = isFunction(getterOrOptions);
        if (only_getter) {
            getter = getterOrOptions;
        }
        return new ComputedRefImpl(getter);
    }
    class ComputedRefImpl {
        constructor(getter) {
            // dep收集的是computed和effect的关系
            this.dep = undefined;
            this.__v_isRef = true;
            this._dirty = true;
            this.effect = new ReactiveEffect(getter, () => {
                if (!this._dirty) {
                    this._dirty = true;
                    triggerRefValue(this);
                }
            });
            // effect生成后，建立了响应性数据与computed的关系
            // 数据发生变化->触发this.effect->触发triggerRefValue
            this.effect.computed = this;
        }
        get value() {
            trackRefValue(this);
            if (this._dirty) {
                this._value = this.effect.run();
                this._dirty = false;
            }
            return this._value;
        }
    }

    let isFlushPending = false;
    // 生成一个Promise对象
    const resolvedPromise = Promise.resolve();
    const pendingPreFlushCbs = [];
    function queuePreFlushCb(cb) {
        queueCb(cb, pendingPreFlushCbs);
    }
    /**
     *
     * @param cb：callback函数
     * @param pendingQueue : Function数组
     */
    function queueCb(cb, pendingQueue) {
        pendingQueue.push(cb);
        queueFlush();
    }
    function queueFlush() {
        if (!isFlushPending) {
            isFlushPending = true;
            // 让flushjobs成为一个异步的微任务
            resolvedPromise.then(flushjobs);
        }
    }
    // 处理队列
    function flushjobs() {
        isFlushPending = false;
        flushPreFlushCbs();
    }
    function flushPreFlushCbs() {
        if (pendingPreFlushCbs.length) {
            // 拷贝并去重，类似于一个深拷贝
            let activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
            // 置空 便于下次使用
            pendingPreFlushCbs.length = 0;
            // 依次执行cb函数
            for (let i = 0; i < activePreFlushCbs.length; i++) {
                activePreFlushCbs[i]();
            }
        }
    }

    function watch(source, cb, options) {
        return doWatch(source, cb, options);
    }
    function doWatch(source, cb, { immediate, deep } = EMPTY_OBJ) {
        let getter;
        const job = () => {
            if (cb) {
                const newValue = effect.run();
                if (deep || hasChanged(newValue, oldValue)) {
                    cb(newValue, oldValue);
                    oldValue = newValue;
                }
            }
        };
        if (isReactive(source)) {
            // getter是一个返回source的函数
            getter = () => source;
            deep = true;
        }
        else if (isRef(source)) {
            getter = () => source.value;
        }
        else if (isFunction(source)) {
            // 如果是函数
            getter = () => source();
        }
        // else if (isArray(source)) {
        //     // 如果是数组，进行循环处理
        //     getter = () =>
        //         source.map((s: unknown) => {
        //             if (isRef(s)) {
        //                 return s.value
        //             } else if (isReactive(s)) {
        //                 return traverse(s)
        //             } else if (isFunction(s)) {
        //                 return s()
        //             }
        //         })
        // }
        else {
            getter = () => { };
        }
        // deep监听的是一个对象 需要进行深度侦听，遍历其每个属性，触发getter收集依赖
        if (cb && deep) {
            const baseGetter = getter;
            // getter拿到
            getter = () => traverse(baseGetter());
        }
        let oldValue = {};
        // scheduler控制调度函数的执行时机
        /**
         * watch的options中有参数flush：pre(默认)|post|sync
         * sync:同步执行
         * post:通过queuePostFlushCb执行
         * pre:通过queuePreFlushCb执行
         */
        const scheduler = () => queuePreFlushCb(job);
        const effect = new ReactiveEffect(getter, scheduler);
        if (cb) {
            if (immediate) {
                job();
            }
            else {
                oldValue = effect.run();
            }
        }
        else {
            effect.run();
        }
        return () => {
            effect.stop();
        };
    }
    function traverse(value) {
        if (!isObject(value)) {
            return value;
        }
        else {
            // 遍历每个属性，触发proxy的getter，收集依赖
            for (const key in value) {
                traverse(value[key]);
            }
        }
        return value;
    }

    function h(type, propsOrChildren, children) {
        const l = arguments.length;
        // 如果l的长度为2，需要判断传入的是children还是props
        /**
         * children有多种类型：1-array 2-object 即VNode 3-string 4-函数（组件是使用）。传入createVnode时都处理为array
         * props只有一种类型：对象
         */
        if (l === 2) {
            if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
                if (isVNode(propsOrChildren)) {
                    // 处理为array
                    return createVnode(type, null, [propsOrChildren]);
                }
                else {
                    // 说明参数为props
                    return createVnode(type, propsOrChildren, null);
                }
            }
            else {
                // childre为string、array或者函数
                return createVnode(type, null, propsOrChildren);
            }
        }
        else {
            if (l > 3) {
                // slice只有一个参数，切取从start开始的全部元素
                children = Array.prototype.slice.call(arguments, 2);
            }
            else if (l === 3) {
                if (isVNode(children)) {
                    children = [children];
                }
            }
            return createVnode(type, propsOrChildren, children);
        }
    }

    function createParserContext(content) {
        return {
            source: content,
        };
    }
    function baseParse(content) {
        console.log("trigger");
        const context = createParserContext(content);
        const children = parseChildren(context, []);
        return createRoot(children);
    }
    function createRoot(children) {
        return {
            // 最外层的type是root/0
            type: 0 /* NodeTypes.ROOT */,
            children,
            loc: {},
        };
    }
    function parseChildren(context, ancestors) {
        const nodes = [];
        while (!isEnd(context, ancestors)) {
            const s = context.source;
            let node;
            if (startsWith(s, "{{")) ;
            // 开始标签
            else if (s[0] === "<") {
                if (/[a-z]/i.test(s[1])) {
                    node = parseElement(context, ancestors);
                }
            }
            if (!node) {
                node = parseText(context);
            }
            nodes.push(node);
        }
        return nodes;
    }
    function parseElement(context, ancestors) {
        // 读取开始标签，返回一个对象，并将游标移动到开始标签后
        let element = parseTag(context);
        ancestors.push(element);
        // 处理子标签（递归开始标签后的context）
        const children = parseChildren(context, ancestors);
        ancestors.pop();
        // @ts-ignore
        element.children = children;
        if (startsWithEndTagOpen(context.source, element.tag)) {
            parseTag(context);
        }
        return element;
    }
    function parseTag(context, type) {
        const match = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source);
        const tag = match[1];
        // 游标右移，略过开始标签，如<div
        advanceBy(context, match[0].length);
        // 接下来需要判断是否为自闭合标签，如<img /> 还是非自闭合标签<div>
        let isSelfClosing = startsWith(context.source, "/>");
        // 是自闭合标签，移动2尾 />；不是的话移动一位>
        advanceBy(context, isSelfClosing ? 2 : 1);
        return {
            type: 1 /* NodeTypes.ELEMENT */,
            tag,
            tagType: 0 /* ElementTypes.ELEMENT */,
            props: [],
            children: [],
        };
    }
    function parseText(context) {
        const endTokens = ["<", "{{"];
        let endindex = context.source.length;
        for (let i = 0; i < endTokens.length; i++) {
            const index = context.source.indexOf(endTokens[i], 1);
            if (index !== -1 && endindex > index) {
                endindex = index;
            }
        }
        const content = parsetTextData(context, endindex);
        return {
            type: 2 /* NodeTypes.TEXT */,
            content: content,
        };
    }
    // 截出普通文本
    function parsetTextData(context, length) {
        const rawText = context.source.slice(0, length);
        advanceBy(context, length);
        return rawText;
    }
    function isEnd(context, ancestors) {
        const s = context.source;
        if (startsWith(s, "</")) {
            for (let i = ancestors.length - 1; i >= 0; i--) {
                // </是否为结束标签的开头
                if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                    return true;
                }
            }
        }
        return !s;
    }
    function startsWithEndTagOpen(source, tag) {
        return startsWith(source, "</");
    }
    function startsWith(s, searchString) {
        return s.startsWith(searchString);
    }
    // 游标右移
    function advanceBy(context, numberOfCharacters) {
        const { source } = context;
        context.source = source.slice(numberOfCharacters);
    }

    function baseComplie(template, options) {
        const ast = baseParse(template);
        console.log(JSON.stringify(ast));
        return {};
    }

    function compile(template) {
        return baseComplie(template);
    }

    exports.Comment = Comment$1;
    exports.Fragment = Fragment;
    exports.Text = Text$1;
    exports.compile = compile;
    exports.computed = computed;
    exports.effect = effect;
    exports.h = h;
    exports.queuePreFlushCb = queuePreFlushCb;
    exports.reactive = reactive;
    exports.ref = ref;
    exports.render = render;
    exports.watch = watch;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=vue.js.map

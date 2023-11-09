var Vue = (function (exports) {
    'use strict';

    // ?表示不一定存在
    const createDep = (effects) => {
        return new Set(effects);
    };

    // <T>表示泛型
    function effect(fn) {
        const _effect = new ReactiveEffect(fn);
        _effect.run();
        // 等函数运行结束后，依赖已经收集完毕，此时置空activeEffect防止被不相关的key收集
        activeEffect = null;
    }
    let activeEffect;
    class ReactiveEffect {
        // ts中成员默认为public，在构造函数的参数上使用public等同于创建了同名的成员变量
        constructor(fn) {
            this.fn = fn;
        }
        run() {
            activeEffect = this;
            return this.fn();
        }
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
        console.log(targetMap);
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

    const isObject = (val) => {
        return val !== null && typeof val === "object";
    };
    const hasChanged = (value, oldvalue) => {
        return !Object.is(value, oldvalue);
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
        proxyMap.set(target, proxy);
        return proxy;
    }
    const toReactive = (value) => {
        return isObject(value) ? reactive(value) : value;
    };

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

    exports.effect = effect;
    exports.reactive = reactive;
    exports.ref = ref;

    return exports;

})({});
//# sourceMappingURL=vue.js.map

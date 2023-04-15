class Observer {
    constructor(data) {
        // 在构造函数中对传入的数据进行响应式处理
        this.walk(data);
    }

    // 对数据进行遍历，将每一个属性都转化为getter/setter的形式
    walk(data) {
        if (!data || typeof data !== "object") {
            return;
        }
        Object.keys(data).forEach((key) => {
            this.defineReactive(data, key, data[key]);
        });
    }

    // 将一个属性转化为getter/setter的形式，以便于监听属性的读取和变化
    defineReactive(obj, key, val) {
        // 每个属性都有一个订阅器 dep，用于收集属性变化的 watcher，当属性变化时通知 watcher 更新
        let dep = new Dep();
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get: function () {
                if (Dep.target) {
                    dep.depend();
                }
                return val;
            },
            set: function (newVal) {
                if (val === newVal) {
                    return;
                }
                val = newVal;
                // 当该属性被修改时，通知该属性的订阅器 dep 更新所有已订阅该属性变化的 watcher
                dep.notify();
            }
        })
    }
}

// 订阅器，用于收集 watcher，并在属性变化时通知 watcher 更新
class Dep {
    constructor() {
        this.subs = [];
    }

    // 添加一个 watcher
    addSub(sub) {
        this.subs.push(sub)
    }

    // 移除一个 watcher
    removeSub(sub) {
        let index = this.subs.indexOf(sub);
        if (index > -1) {
            this.subs.splice(index, 1)
        }
    }

    // 如果当前有正在执行的 watcher，将该 watcher 添加到订阅器 dep 中
    depend() {
        Dep.target.addDep(this);
    }

    notify() {
        this.subs.forEach((sub) => {
            sub.update()
        })
    }

}

// 全局唯一的正在执行的 watcher，用于在属性被读取时收集订阅器 dep
Dep.target = null

// 定义观察者类，用于将依赖的数据绑定到回调函数中
class Watcher {
    constructor(vm, expOrFn, cb) {
        this.vm = vm; // Vue实例
        this.expOrFn = expOrFn; // 表达式或函数
        this.cb = cb; // 回调函数
        this.depIds = {}; // 依赖的ID列表

        // 根据表达式或函数设置getter
        if (typeof expOrFn === "function") {
            this.getter = expOrFn;
        } else {
            this.getter = this.parseGetter(expOrFn);
        }

        // 保存获取到的值
        this.value = this.get();
    }

    // 添加依赖
    addDep(dep) {
        // 如果依赖的ID不在依赖的ID列表中，则将该依赖添加到列表中
        if (!this.depIds.hasOwnProperty(dep.id)) {
            dep.addSub(this); // 添加观察者到依赖中
            this.depIds[dep.id] = dep; // 将依赖的ID添加到依赖的ID列表中
        }
    }

    // 获取值
    get() {
        // 设置Dep.target为当前观察者
        Dep.target = this;
        // 通过调用getter获取数据
        // const value = this.getter.call(this.vm, this.vm);
        const value = this.vm.data[this.expOrFn]
        // 将Dep.target设置为null
        Dep.target = null;
        // 返回获取到的值
        return value;
    }

    update() {
        let oldValue = this.value;
        this.value = this.get(); // 获取新的值
        // 调用回调函数，并传入新旧值
        this.cb.call(this.vm, this.value, oldValue);
    }

    // 解析getter
    parseGetter(exp) {
        const segments = exp.split(".");
        return function (obj) {
            for (let i = 0; i < segments.length; i++) {
                if (!obj) {
                    return;
                }
                obj = obj[segments[i]];
            }
            return obj;
        };
    }
}

class Compiler {
    // 构造函数，接收一个参数 vm，代表 Vue 实例
    constructor(vm) {
        // 将 vm 实例保存到实例的 vm 属性中
        this.vm = vm;
        // 将 vm 实例的 el 属性保存到实例的 el 属性中
        this.el = vm.el;
        // 调用 compile 方法，传入 el 参数
        this.compile(this.el);
    }

    compile(node) {
        console.log(node, node.nodeType, 'node................')
        if (node.nodeType === 1) {//是元素节点
            this.compileElement(node)//解析节点上的属性
            node.childNodes.forEach(childNode => {
                this.compile(childNode)
            })
        } else if (node.nodeType === 3) {//文本节点
            this.compileText(node)
        }
    }

    compileElement(node) {
        const attrs = node.attributes;
        console.log(attrs, '属性')
        console.log(Array.from(attrs), '数组')
        Array.from(attrs).forEach((attr) => {
            // 获取属性名和属性值
            const attrName = attr.name;
            const attrValue = attr.value;
            // 判断属性名是否以 "v-" 开头
            if (attrName.startsWith("v-")) {
                // 获取指令名
                const dir = attrName.substring(2);
                // 根据指令名调用相应的方法进行处理
                if (dir === "bind") {
                    // this.bindText(node, attrValue);
                } else if (dir === "model") {
                    this.bindModel(node, attrValue);
                } else if (dir === "for") {
                    // this.bindFor(node, attrValue);
                } else if (dir === "if") {
                    this.bindIf(node, attrValue);
                }
            }

        })
    }

    bindText(node, exp) {
        const updateFn = (value) => {
            node.textContent = value;
        };
        new Watcher(this.vm, exp, updateFn);
    }

    compileText(node) {
        let reg = /{{(.*)}}/;
        if (reg.test(node.nodeValue)) {
            let match = reg.exec(node.nodeValue)
            const exp = match[0] //带双括号的变量名
            const key = match[1].trim(); //不带双括号的变量名
            //将表达式替换为data里的变量值
            node.nodeValue = node.nodeValue.replace(exp, this.vm.data[key])

            this.bindText(node, key)
        }
    }

    bindModel(node, exp) {  // 处理 'v-model' 指令
        node.value = this.vm.data[exp];

        const updateFn = (value) => {  // 定义更新视图的函数
            node.value = value;  // 更新节点的 value 属性
        };
        node.addEventListener("input", (event) => {  // 监听 input 事件，当节点的 value 属性发生变化时触发
            this.vm.data[exp] = event.target.value;  // 更新数据
        });
        new Watcher(this.vm, exp, updateFn);  // 创建 Watcher
    }

    bindIf(node, exp) {
        // 获取父节点并创建一个占位符节点
        let parentNode = node.parentNode;
        //创建一个注释节点
        let placeholder = document.createComment("v-if");
        let isShow = false;

        // 定义更新方法，根据表达式的值来显示或隐藏该节点
        const updateFn = (value) => {
            if (value && !isShow) {
                // 显示节点
                isShow = true;
                parentNode.insertBefore(node, placeholder.nextSibling);
            } else if (!value && isShow) {
                // 隐藏节点
                isShow = false;
                parentNode.removeChild(node);
            }
        };

        // 在节点前插入占位符节点
        parentNode.insertBefore(placeholder, node);

        // 获取data中的数值, 如果是false 直接删除节点
        if(!this.vm.data[exp]) {
            parentNode.removeChild(node);
        }
        // 创建一个新的 Watcher 实例，监听表达式的变化，并在变化时调用 updateFn 方法更新 DOM
        new Watcher(this.vm, exp, updateFn);
    }

}

class Vue {
    constructor(options) {
        // 将 options 中的 data 属性赋值给 this.data
        this.data = options.data;
        // 将 options 中的 el 属性赋值给 this.el
        this.el = document.querySelector(options.el)
        // 调用 init 方法
        this.init();
    }

    init() {
        // 使用 Observer 对数据进行监听
        new Observer(this.data);
        // 使用 Compiler 对模板进行编译
        new Compiler(this);
    }
}

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
                // 当该属性被读取时，如果当前有正在执行的 watcher，那么将该 watcher 添加到属性的订阅器 dep 中，以便于在属性变化时更新该 watcher
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


/**
 * 在Vue中，dep是依赖收集器的简称，其作用是在数据对象和Watcher对象之间建立联系，
 * 用于跟踪哪些组件依赖于哪些数据，以便在数据发生变化时，能够通知到所有依赖于该数据的组件进行相应的更新操作。
 * Vue中的dep更新机制是基于观察者模式实现的，其实现过程如下：

 在组件的render()函数中，访问数据对象的属性时，会触发该属性的get()方法；
 在get()方法中，会将当前的Watcher对象添加到该属性的依赖收集器（即dep对象）的订阅列表中；
 在组件销毁时，会将该组件中所有的Watcher对象从其依赖的数据对象中的所有dep对象的订阅列表中移除；
 当数据对象的属性发生变化时，会触发该属性的set()方法；
 在set()方法中，会遍历该属性的依赖收集器中所有的Watcher对象，并调用它们的update()方法，以通知所有依赖于该属性的组件进行更新操作。
 简单来说，Vue的dep更新机制主要有两个关键步骤：收集依赖和通知更新。在收集依赖阶段中，Vue会在组件的render()函数中访问数据对象的属性时，将当前的Watcher对象添加到该属性的依赖收集器中，从而建立数据对象和Watcher对象之间的联系；在通知更新阶段中，Vue会在数据对象的属性发生变化时，遍历该属性的依赖收集器中所有的Watcher对象，并调用它们的update()方法，从而通知所有依赖于该属性的组件进行更新操作。

 通过dep更新机制，Vue能够高效地跟踪组件之间的数据依赖关系，从而实现组件的实时响应和更新。
 */
// 订阅器，用于收集 watcher，并在属性变化时通知 watcher 更新
class Dep {
    constructor() {
        this.subscribers = [];
    }

    // 添加一个 watcher
    addSubscriber(subscriber) {
        this.subscribers.push(subscriber)
    }

    // 移除一个 watcher
    removeSubscriber(subscriber) {
        let index = this.subscribers.indexOf(subscriber);
        if (index > -1) {
            this.subscribers.splice(index, 1)
        }
    }

    // 如果当前有正在执行的 watcher，将该 watcher 添加到订阅器 dep 中
    depend() {
        Dep.target.addDep(this);
    }

    // 通知所有已订阅该属性变化的 watcher 更新
    notify() {
        this.subscribers.forEach((subscriber) => {
            subscriber.update()
        })
    }
}

// 全局唯一的正在执行的 watcher，用于在属性被读取时收集订阅器 dep
Dep.target = null

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
        if (node.nodeType === 1) {//是元素节点
            this.compileElement(node)//解析节点上的属性
            //遍历该元素的所有子元素,并递归调用
            node.childNodes.forEach(childNode => {
                this.compile(childNode)
            })
        } else if (node.nodeType === 3) {//文本节点
            this.compileText(node)
        }
    }

    // 定义 compileElement 方法，接收一个参数 node，代表当前处理的元素节点
    compileElement(node) {
        // 获取当前元素节点的所有属性
        const attrs = node.attributes;
        // 将 attrs 类数组转为数组，遍历数组中的每个属性
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
                    this.bind(node, attrValue);
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

    bind(node, exp) {

    }

    bindText(node, exp, key) {
        //将表达式替换为data里的变量值
        node.nodeValue = node.nodeValue.replace(exp, this.vm.data[key])

        // 定义 updateFn 函数，用于更新文本节点的内容
        const updateFn = (value) => {
            node.textContent = value;
        };
        // 创建 Watcher 实例，传入 vm、key 和 updateFn 三个参数
        new Watcher(this.vm, key, updateFn);
    }

    // 定义 compileText 方法，接收一个参数 node，代表当前处理的文本节点
    compileText(node) {
        //正则: 用来匹配包含在两个花括号之间的任意字符
        let reg = /{{(.*)}}/;

        // 如果文本内容中包含插值表达式，则获取表达式，并调用 bindText 方法进行处理
        if (reg.test(node.nodeValue)) {
            //exec() 方法返回的数组包含匹配到的子串以及任何捕获组中捕获到的子串的信息。
            // 返回的数组的第一个元素是匹配到的完整文本，
            // 而后续元素则是由正则表达式中定义的捕获组所匹配到的文本
            let match = reg.exec(node.nodeValue)
            const exp = match[0] //带双括号的变量名
            const key = match[1].trim(); //不带双括号的变量名
            this.bindText(node, exp, key)
        }
    }

    bindModel(node, exp) {  // 处理 'v-model' 指令
        //将v-model 所在dom元素的值改为 v-model 绑定的data中数据的值
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
        if (!this.vm.data[exp]) {
            parentNode.removeChild(node);
        }
        // 创建一个新的 Watcher 实例，监听表达式的变化，并在变化时调用 updateFn 方法更新 DOM
        new Watcher(this.vm, exp, updateFn);
    }

}

// 定义观察者类，用于将依赖的数据绑定到回调函数中
class Watcher {
    constructor(vm, expOrFn, callBack) {
        this.vm = vm; // Vue实例
        this.expOrFn = expOrFn; // 表达式或函数
        this.callBack = callBack; // 回调函数
        this.depIds = {}; // 依赖的ID列表

        // 保存获取到的值
        this.value = this.get();
    }

    // 添加依赖
    addDep(dep) {
        // 如果依赖的ID不在依赖的ID列表中，则将该依赖添加到列表中
        if (!this.depIds.hasOwnProperty(dep.id)) {
            dep.addSubscriber(this); // 添加观察者到依赖中
            this.depIds[dep.id] = dep; // 将依赖的ID添加到依赖的ID列表中
        }
    }

    // 获取值
    get() {
        // 设置Dep.target为当前观察者
        Dep.target = this;
        // 通过调用getter获取数据
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
        this.callBack.call(this.vm, this.value, oldValue);
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

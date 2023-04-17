# SimpleVue
Write a simple Vue framework by yourself and implement its reactivity feature !


这个简单的响应式JavaScript框架实现了以下功能：

- 观察者模式：Observer类定义了一个对象的观察者，可以在属性值改变时通知订阅者，订阅者可以更新视图。
- 发布订阅模式：Dep类作为一个发布者，维护一个订阅者数组，可以增加或删除订阅者，通知所有订阅者更新视图。
- 监听属性变化：defineReactive方法使用Object.defineProperty实现属性的get和set方法，使得当属性值变化时可以通知订阅者更新视图。
- 计算属性：Watcher类的构造函数可以接收一个函数作为第二个参数，该函数可以计算出一个新值，然后在属性改变时更新视图。
- 指令：Compiler类根据指令类型处理指令，例如v-bind、v-model和v-if等指令。
- 双向绑定：对于v-model指令，实现了双向数据绑定，当表单元素的值改变时，会同步更新数据模型，反之亦然。
- 模板编译：Compiler类使用递归算法编译模板，将模板中的表达式解析为JavaScript代码，并生成一个更新视图的函数，并将该函数添加到订阅者数组中，从而实现响应式的视图更新。

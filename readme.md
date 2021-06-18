## qnn-object-ast-handle 字面的对象 AST 节点操作插件

> 使操作 javascript 字面量对象 AST 节点如同呼吸一样简单，支持查询和修改字面量对象中的某个属性，满足一切对字面量对象的操作。

### 本插件建立在以下插件基础之上（感激之心不言于表）

-   gogocode https://github.com/thx/gogocode#readme
-   @babel/types https://babeljs.io/docs/en/babel-types

### 安装

    yarn add qnn-object-ast-handle | yarn i qnn-object-ast-handle

### 使用案例

    // 从整个文件中查询出字面量对象ast代码推荐直接使用 gogocode 插件
    import { getObjectAttr, setObjectAttr } from 'qnn-object-ast-handle';
    const $ = require('gogocode');

    const matchs = $(`
        window.configs = {
            name:"test",
            obj:{
                wang:'hh',
                zong:{
                    foo:11
                }
            },
            person:[ "王" ],
            personObj:[ { name:"王", age:24 } ]
        }
    `).find('window.configs = $_$');

    // 字面量对象 ast 节点
    const objectAst = matchs.match[0][0].node;

    // 传入 ast 节点，修改属性。返回新的 ast 节点
    const newObjectAst = setObjectAttr(objectAst, 'obj.zong.foo', "张三");

    // 获取 ast 节点中的某个属性
    const attrVal = getObjectAttr(objectAst, 'obj.zong.foo');  // 张三

### 修改属性

    // 修改指定的某一项属性
    setObjectAttr(objectAst, "name", "hhh");
    setObjectAttr(objectAst, "obj.zong", "张三");
    setObjectAttr(objectAst, "obj.zong.foo", "张三");

    // 修改指定的某一项属性为对象、数组
    setObjectAttr(objectAst, "obj", { name: "张三" });

    // 修改数组的限制，
    // 1、不允许修改具体的某项，必须直接修改整个数组数据
    // 2、数组属性不允许使用 . 嵌套，如果需要改变结构需要像下面一样改变右侧值结构即可
    setObjectAttr(objectAst, "person", ["李四"]);
    setObjectAttr(objectAst, "person", { foo: [{ name: "李四" }] });

### 新增属性

    // 指定属性新增
    setObjectAttr(objectAst, "aaa", "wang");
    setObjectAttr(objectAst, "aaa.bb", "wang");
    setObjectAttr(objectAst, "aaa.bb.c", "wang");

    // 新增字面量对象属性
    setObjectAttr(objectAst, "info", { age: 1 });
    setObjectAttr(objectAst, "info", { age: { one:"111" } });
    setObjectAttr(objectAst, "info", { age: 1, other:{ one:"111" } });

### 新增数组类型属性

    // 非对象类型的数组项新增
    setObjectAttr(objectAst, "hob", ["吃饭", "睡觉"]);
    setObjectAttr(objectAst, "info", { detail: ["吃饭", "睡觉"] });
    setObjectAttr(objectAst, "info.hob", ["吃饭", "睡觉"]);
    setObjectAttr(objectAst, "info.hob", { detail: ["吃饭", "睡觉"] });

    // 对象类型数组项新增
    setObjectAttr(objectAst, "info", [ { name: "吃饭", time: 1234568477711 } ]);
    setObjectAttr(objectAst, "info.list", [ { name: "吃饭", time: 1234568477711 } ]);
    setObjectAttr(objectAst, "info", {
        list: [ { name: "吃饭", time: 1234568477711 }  ]
    });
    setObjectAttr(objectAst, "info", [
        [{ name: "吃饭", time: 1234568477711 }], [{ name: "睡觉", time: 1234568477711 }]
    ]);

### 获取整个字面量对象

    const obj = getObjectAttr(objectAst); // { /.../ }

### 获取指定的属性

> 可用 . 表达嵌套: appInfo、appInfo.id、 download.0、 download.0.name、wxSdk.jsApiList.1 ...

    const attrVal = getObjectAttr(objectAst, "person"); // [ "王" ]

    const attrVal2 = getObjectAttr(objectAst, "personObj.0"); // { name:"王", age:24 }

### 和 gogoCode 这类插件的区别？

区别在于本插件只专注于对字面量对象的操作，用操作 js 字面量对象的手法来操作 ast 节点。

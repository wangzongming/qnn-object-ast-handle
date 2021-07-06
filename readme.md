## qnn-object-ast-handle 字面的对象 AST 节点操作插件
   
[![](https://img.shields.io/badge/issues-brightgreen)](https://github.com/wangzongming/qnn-object-ast-handle/issues)
[![](https://img.shields.io/badge/npm-brightgreen)](https://www.npmjs.com/package/qnn-object-ast-handle)


> 操作 字面量对象 AST 节点如同呼吸一样简单，支持查询、修改、删除对象中的某个属性或者数组中的某个元素。 


### 本插件建立在以下插件基础之上

- gogocode https://github.com/thx/gogocode#readme
- @babel/types https://babeljs.io/docs/en/babel-types


### 安装

    yarn add qnn-object-ast-handle | yarn i qnn-object-ast-handle

### 使用案例

    // 从整个文件中查询出字面量对象ast代码推荐直接使用 gogocode 插件
    const $ = require('gogocode');
    const { getObjectAttr, setObjectAttr, delObjectAttr } = require('qnn-object-ast-handle');
  
    const matchs: any = $(` 
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
    setObjectAttr(objectAst, "person", { name: "张三" });
 
    setObjectAttr(objectAst, "person", ["李四"]); 
    setObjectAttr(objectAst, "personObj.0.name","李四");   


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
 

### 删除指定的属性

    const matchs: any = gogocode(` 
        window.configs = { 
            name:"test",
            obj:{
                wang:'hh',
                zong:{
                    foo:11
                }
            },
            // 这是 person 注释
            person:[ "王" ],
            personObj:[ { name:"王", age:24, table:{ title:"王" }  } ]
        } 
    `).find('window.configs = $_$');

    // 字面量对象 ast 节点
    const objectAst = matchs.match[0][0].node;

    // 传入 ast 节点，修改属性。返回新的 ast 节点
    // 全部删除, 返回 null
    // const newObjectAst = delObjectAttr(objectAst);
    // 删除某个属性 
    // const newObjectAst = delObjectAttr(objectAst, "name");
    // const newObjectAst = delObjectAttr(objectAst, "obj.wang");
    // const newObjectAst = delObjectAttr(objectAst, 'obj.zong');
    // const newObjectAst = delObjectAttr(objectAst, 'obj.zong.foo');
    // 数组操作
    // const newObjectAst = delObjectAttr(objectAst, 'person');
    // const newObjectAst = delObjectAttr(objectAst, 'person.0');
    // const newObjectAst = delObjectAttr(objectAst, 'personObj.0.name');
    const newObjectAst = delObjectAttr(objectAst, 'personObj.0.table.title');
    console.log('delObjectAttr:', gogocode(newObjectAst).generate())

### 和 gogoCode 这类插件的区别？

区别在于本插件只专注于对字面量对象的操作，用操作 js 字面量对象的手法来操作 ast 节点。
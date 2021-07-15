## qnn-object-ast-handle 代码文件中的js字面量对象操作插件
   
[![](https://img.shields.io/badge/issues-brightgreen)](https://github.com/wangzongming/qnn-object-ast-handle/issues)
[![](https://img.shields.io/badge/npm-brightgreen)](https://www.npmjs.com/package/qnn-object-ast-handle)


<br />

### <a href="https://github.com/wangzongming/qnn-object-ast-handle/blob/master/readme-english.md">Englist</a>  | <a href="https://github.com/wangzongming/qnn-object-ast-handle/blob/master/readme.md">简体中文</a>

<br />

### 简介

如果你正在进行低代码等需要操作解析代码的工作那本插件将非常适合于你。本插件用 javascript 操作 对象数据的方式来进行代码操作。即使你完全不懂 ast 也可直接调用提供的 api 对你的代码文件进行操作。

该组件只负责对代码文件中定义的字面量对象进行操作。也就是说这个组件的功能只专注于操作字面量对象或者数组。

除了上面所说外，另外希望读者能顺手点个 star ~ 非常感谢。

### 本插件建立在以下插件基础之上

- @babel/types https://babeljs.io/docs/en/babel-types
- gogocode https://github.com/thx/gogocode#readme


### 安装

    yarn add qnn-object-ast-handle | yarn i qnn-object-ast-handle

### 快速开始

    // 从整个文件中查询出字面量对象ast代码推荐直接使用 gogocode 插件
    const $ = require('gogocode');
    const { getObjectAttr, setObjectAttr, delObjectAttr } = require('qnn-object-ast-handle');
    
    // 假如这是从某个代码文件中读取出来的代码内容
    const code = ` 
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
    `;
    
    // ==== 需求1：修改 window.configs.obj.zong.foo 为 "张三" ==== 

    // 拿到字面量对象 ast 节点
    const matchs: any = $(code).find('window.configs = $_$');
    const objectAst = matchs.match[0][0].node;

    // 传入 ast 节点，修改属性。返回新的 ast 节点
    const newObjectAst = setObjectAttr(objectAst, 'obj.zong.foo', "张三");  
    // 使用 gogocode 替换 ast 节点并且生成新的代码文件内容
    const curAttrCodeStr: string = $(newObjectAst).generate(); 
    const newCode = $(code).replace(`window.configs = $_$`, `${protoStr} = ${curAttrCodeStr}`).generate();

    // 修改后的 code 如下
    ` 
        window.configs = { 
            name:"test",
            obj:{
                wang:'hh',
                zong:{
                    foo:"张三"
                }
            },
            person:[ "王" ],
            personObj:[ { name:"王", age:24 } ]
        } 
    `;


    // ==== 需求2：要从一段代码文件中准确获取某个属性 ==== 

    // 获取 ast 节点中的某个属性
    const attrVal = getObjectAttr(objectAst, 'obj.zong.foo');  // 张三
 


    // ==== 需求3：要从一段代码文件中准确删除某个属性 ==== 
  
    const newObjectAstByDeled = delObjectAttr(objectAst, "name");

    // 使用 gogocode 替换 ast 节点并且生成新的代码文件内容
    const curAttrCodeStr: string = $(newObjectAstByDeled).generate(); 
    const newCode = $(code).replace(`window.configs = $_$`, `${protoStr} = ${curAttrCodeStr}`).generate();


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

    // 传入 ast 节点，修改属性。返回新的 ast 节点
    // 全部删除, 返回 null
    const newObjectAst = delObjectAttr(objectAst);

    // 删除某个属性 
    const newObjectAst = delObjectAttr(objectAst, "name");
    const newObjectAst = delObjectAttr(objectAst, "obj.wang");
    const newObjectAst = delObjectAttr(objectAst, 'obj.zong');
    const newObjectAst = delObjectAttr(objectAst, 'obj.zong.foo');

    // 数组操作
    const newObjectAst = delObjectAttr(objectAst, 'person');
    const newObjectAst = delObjectAttr(objectAst, 'person.0');
    const newObjectAst = delObjectAttr(objectAst, 'personObj.0.name');
    const newObjectAst = delObjectAttr(objectAst, 'personObj.0.table.title');
    console.log('delObjectAttr:', gogocode(newObjectAst).generate())

### 和 gogoCode 这类插件的区别？

区别在于本插件只专注于对字面量对象的操作，用操作 js 字面量对象的手法来操作 ast 节点。
更加简单，更加灵活！
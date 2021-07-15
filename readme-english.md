## qnn-object-ast-handle  JS literal object manipulation plug-in in code file
   
[![](https://img.shields.io/badge/issues-brightgreen)](https://github.com/wangzongming/qnn-object-ast-handle/issues)
[![](https://img.shields.io/badge/npm-brightgreen)](https://www.npmjs.com/package/qnn-object-ast-handle)


<br />

### <a href="https://github.com/wangzongming/qnn-object-ast-handle/blob/master/readme-english.md">English</a>  | <a href="https://github.com/wangzongming/qnn-object-ast-handle/blob/master/readme.md">简体中文</a>

<br />

### Intro

If you are working on low code or other tasks that require parsing code, this plugin will be perfect for you. This plug-in uses JavaScript to manipulate object data for code manipulation. Even if you don't know anything about AST, you can use the provided API directly to manipulate your code files.

This component is only responsible for manipulating literal objects defined in the code file. This means that the functionality of this component is only focused on manipulating literal objects or arrays.

In addition to the above mentioned, in addition to hope that readers can easily click STAR ~, thinks you.

### This plug-in is based on the following plug-ins

- @babel/types https://babeljs.io/docs/en/babel-types
- gogocode https://github.com/thx/gogocode#readme


### Install

    yarn add qnn-object-ast-handle | yarn i qnn-object-ast-handle

### QUICK START

    // Querying literal objects from the entire file is recommended by using the GoGoCode plugin directly
    const $ = require('gogocode');
    const { getObjectAttr, setObjectAttr, delObjectAttr } = require('qnn-object-ast-handle');
    
    // Suppose this is the content of the code read from some code file
    const code = ` 
        window.configs = { 
            name:"test",
            obj:{
                wang:'hh',
                zong:{
                    foo:11
                }
            },
            person:[ "jonas" ],
            personObj:[ { name:"jonas", age:24 } ]
        } 
    `;
    
    // ==== Requirement 1： modification window.configs.obj.zong.foo as "evening" ==== 

    // Get the literal object ast node
    const matchs: any = $(code).find('window.configs = $_$');
    const objectAst = matchs.match[0][0].node;

    // Pass in the AST node and modify the properties.Returns the new AST node
    const newObjectAst = setObjectAttr(objectAst, 'obj.zong.foo', "evening");  
    // Replace the AST node with GoGoCode and generate the new code file contents
    const curAttrCodeStr: string = $(newObjectAst).generate(); 
    const newCode = $(code).replace(`window.configs = $_$`, `${protoStr} = ${curAttrCodeStr}`).generate();

    // The modified code is as follows
    ` 
        window.configs = { 
            name:"test",
            obj:{
                wang:'hh',
                zong:{
                    foo:"evening"
                }
            },
            person:[ "jonas" ],
            personObj:[ { name:"jonas", age:24 } ]
        } 
    `;


    // ==== Requirement 2：To get a property exactly from a code file ==== 

    // Gets an attribute in the AST node
    const attrVal = getObjectAttr(objectAst, 'obj.zong.foo');  // evening
 


    // ==== Requirement 3：To remove a property exactly from a code file ==== 
  
    const newObjectAstByDeled = delObjectAttr(objectAst, "name");

    // Replace the AST node with GoGoCode and generate the new code file contents
    const curAttrCodeStr: string = $(newObjectAstByDeled).generate(); 
    const newCode = $(code).replace(`window.configs = $_$`, `${protoStr} = ${curAttrCodeStr}`).generate();


### edit object attribute

    // Modifies one of the specified attributes
    setObjectAttr(objectAst, "name", "hhh"); 
    setObjectAttr(objectAst, "obj.zong", "evening");
    setObjectAttr(objectAst, "obj.zong.foo", "evening");

    // Modifies one of the specified properties to an object, an array
    setObjectAttr(objectAst, "obj", { name: "evening" });
    setObjectAttr(objectAst, "person", { name: "evening" });
 
    setObjectAttr(objectAst, "person", ["jeo"]); 
    setObjectAttr(objectAst, "personObj.0.name","jeo");   


### Add New Attribute   

    // Specify attribute new
    setObjectAttr(objectAst, "aaa", "wang");
    setObjectAttr(objectAst, "aaa.bb", "wang");
    setObjectAttr(objectAst, "aaa.bb.c", "wang"); 

    // Added literal object properties
    setObjectAttr(objectAst, "info", { age: 1 }); 
    setObjectAttr(objectAst, "info", { age: { one:"111" } }); 
    setObjectAttr(objectAst, "info", { age: 1, other:{ one:"111" } }); 

### New array type property    
    
    // New array entries of non-object types
    setObjectAttr(objectAst, "hob", ["eat", "sleep"]);  
    setObjectAttr(objectAst, "info", { detail: ["eat", "sleep"] }); 
    setObjectAttr(objectAst, "info.hob", ["eat", "sleep"]); 
    setObjectAttr(objectAst, "info.hob", { detail: ["eat", "sleep"] }); 
   
    // Object type array entry new
    setObjectAttr(objectAst, "info", [ { name: "eat", time: 1234568477711 } ]); 
    setObjectAttr(objectAst, "info.list", [ { name: "eat", time: 1234568477711 } ]); 
    setObjectAttr(objectAst, "info", {
        list: [ { name: "eat", time: 1234568477711 }  ]
    });
    setObjectAttr(objectAst, "info", [
        [{ name: "eat", time: 1234568477711 }], [{ name: "sleep", time: 1234568477711 }]
    ]);

### Gets the entire literal object 

    const obj = getObjectAttr(objectAst); // { /.../ } 


### getAttribute
> 可用 . 表达嵌套: appInfo、appInfo.id、 download.0、 download.0.name、wxSdk.jsApiList.1 ...

    const attrVal = getObjectAttr(objectAst, "person"); // [ "jonas" ]

    const attrVal2 = getObjectAttr(objectAst, "personObj.0"); // { name:"jonas", age:24 }
 

### Deletes the specified attribute 

    // Pass in the AST node and modify the properties.Returns the new AST node
    // Delete all, return null
    const newObjectAst = delObjectAttr(objectAst);

    // Delete a property 
    const newObjectAst = delObjectAttr(objectAst, "name");
    const newObjectAst = delObjectAttr(objectAst, "obj.wang"); 
    const newObjectAst = delObjectAttr(objectAst, 'obj.zong.foo');

    // Array Operations
    const newObjectAst = delObjectAttr(objectAst, 'person');
    const newObjectAst = delObjectAttr(objectAst, 'person.0');
    const newObjectAst = delObjectAttr(objectAst, 'personObj.0.name');
    const newObjectAst = delObjectAttr(objectAst, 'personObj.0.table.title'); 

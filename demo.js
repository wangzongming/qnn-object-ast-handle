const $ = require("gogocode");
const { getObjectAttr, setObjectAttr } = require("./dist/es");

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
    `).find("window.configs = $_$");

// 字面量对象 ast 节点
const objectAst = matchs.match[0][0].node;

// 传入 ast 节点，修改属性。返回新的 ast 节点
// const newObjectAst = setObjectAttr(objectAst, "obj.zong.foo", "张三");

// 获取 ast 节点中的某个属性
const attrVal = getObjectAttr(objectAst, "obj.zong.foo"); // 张三
console.log(attrVal)

import { ObjectExpression } from "@babel/types";
const $ = require('gogocode');
export type GetObjectAttrRes = boolean | string | number | any[] | { [field: string]: any } | undefined;

/**
 * 将字面量对象AST节点传入获取对象中的某个属性
 * 可用.表达嵌套: appInfo、appInfo.id、 download.0、 download.0.name、wxSdk.jsApiList.1 ...
 * @astNode 对象的ast节点 
 * @name    要获取的对象属性
*/
export type GetObjectAttr<T = GetObjectAttrRes> = (astNode: ObjectExpression, name?: string) => T;
const getObjectAttr: GetObjectAttr = (astNode, name) => {
    // 不传入name的情况下获取整个对象，必须传入字面量对象代码节点 ObjectExpression
    if (!name) {
        const obj: any = {};
        if (astNode.properties) {
            astNode.properties.forEach((item: any) => {
                const key: string = item.key?.name || item.key?.value;
                const value: any = item.value?.value;
                const type: any = item.value?.type;
                switch (type) {
                    case "StringLiteral":
                    case "BooleanLiteral":
                    case "NumericLiteral":
                        obj[key] = value;
                        break;
                    case "ObjectExpression":
                        obj[key] = getObjectAttr(item.value);
                        break;
                    case "ArrayExpression":
                        const elements: any[] = item.value.elements?.map?.((item: any) => getObjectAttr(item));
                        obj[key] = elements;
                        break;
                    case "MemberExpression":
                        // 引用的变量属性，需要层层递归 value.property 和 value.object
                        // eg: window.configs.apis.getUseInfo,
                        // console.log(item)
                        // obj[key] = value;
                        console.error('暂不支持读取该类型：', type)
                        break;
                    default:
                        console.error('暂不支持读取该类型：', type)
                        break;
                }
            });
        }
        return obj;
    };

    const nameArr: string[] = name.split('.');
    const nameArrLen: number = nameArr.length - 1;

    let arrtVal: GetObjectAttrRes = undefined;
    // pre 是ast对象
    nameArr.reduce(($pre: any, cur: string | number, index: number) => {
        // 中杠时候记住需要加引号
        const curAttr: string | number = (`${cur}`).search('-') > -1 ? `"${cur}"` : cur;
        let curASTNode;
        try {
            if (!isNaN(((cur as number) - 0))) {
                // 获取数组中的某一项 
                // 如果是获取数组的某一项的话直接返回值就行，如果数组是个字面量对象数组，那就需要继续解析
                // 数组项如果为非字符串时候需要继续解析
                const curItem: any = $pre.match[0][0].node.elements[cur];
                if (index === nameArrLen) {
                    if (curItem.type === "StringLiteral") {
                        curASTNode = curItem.value;
                    }
                    else if (curItem.type === "ObjectExpression") {
                        arrtVal = {};
                        if (curItem.properties) {
                            curItem.properties.forEach((item: any) => {
                                const key: string = item.key?.name;
                                const value: any = item.value?.value;
                                const type: any = item.value?.type;
                                if (type === "StringLiteral") {
                                    (arrtVal as any)[key] = value;
                                } else {
                                    // 非字符串，需要解析 
                                    (arrtVal as any)[key] = getObjectAttr(item.node);
                                }
                            });
                        }
                        return;
                    } else if (curItem.type === "ArrayExpression") {
                        console.error('暂不支持解析二维数组')
                    }
                } else {
                    curASTNode = $(curItem)
                }
            } else {
                curASTNode = $pre.find(`${curAttr}: $_$ `);
            }

            if (!curASTNode) {
                arrtVal = undefined;
                return $pre; // 这时候不会再有子集了，所以直接返回自己避免报错
            }
            if (index === nameArrLen) {
                if (typeof curASTNode === 'string') {
                    arrtVal = curASTNode
                } else {
                    const exgNode: any = curASTNode.match?.[0]?.[0]?.node;

                    // 如果是数组 
                    if (exgNode?.type === "ArrayExpression") {
                        // 数组可能是两种情况，一种是 string[]  另一种是 object[]
                        const arrys = $(exgNode).find(`[$_$]`);
                        arrtVal = [];
                        if (arrys.match[0]) {
                            arrys.match[0].forEach((item: any) => {
                                if (item.node.type === "StringLiteral") {
                                    (arrtVal as string[]).push(item.value)
                                } else if (item.node.type === "ObjectExpression") {
                                    (arrtVal as any[]).push(getObjectAttr(item.node))
                                }
                            });
                        }
                    }
                    else if (exgNode?.type === "ObjectExpression") {
                        // 对象的话解析属性即可
                        arrtVal = {};
                        if (exgNode.properties) {
                            exgNode.properties.forEach((item: any) => {
                                const key: string = item.key?.name;
                                const value: any = item.value?.value;
                                const type: any = item.value?.type;
                                if (type === "StringLiteral") {
                                    (arrtVal as any)[key] = value;
                                } else {
                                    // 非字符串，需要解析
                                    (arrtVal as any)[key] = getObjectAttr(item.node);
                                }
                            });
                        }
                    } else {
                        curASTNode.each((item: any) => {
                            arrtVal = item.match[0][0].value;
                        })
                    }

                }
            } else {
                return curASTNode
            }

        } catch (err) {
            // find 找不到只会会抛出错误
            // console.log('err', err)
        }

    }, $(astNode))

    return arrtVal;

}

export default getObjectAttr;

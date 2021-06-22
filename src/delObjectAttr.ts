import { Node, ObjectExpression } from "@babel/types";
// import createPropertie, { RealValue } from "./method/createPropertie";
import createLiteral from "./method/createLiteral";
// const $ = require("gogocode");

/**
 * 删除对象ast节点, 返回设置后的AST节点
 * 可用.表达嵌套: appInfo、appInfo.id、 download.0、 download.0.name、wxSdk.jsApiList.1 ...
 * @astNode ast节点
 * @name    要删除的对象属性
 *
 * 返回新的 ast 节点
 */
export type DelObjectAttr = (astNode: Node, name?: string) => any;
const delObjectAttr: DelObjectAttr = (astNode, name) => {
	if (!name) return createLiteral(undefined);

	const astNodeType = astNode.type;
	const nameArr: string[] = name.split(".");
	const nameArrLen: number = nameArr.length - 1;
	switch (astNodeType) {
		case "ObjectExpression":
			// 操作对象
			return nameArr.reduce(
				(pre: any, cur: string, index) => {
					const root = pre.root;
					const realCur = pre.parent || root;
					const { type, properties, elements } = realCur;
					// 根据不同的类型具体进行删除操作
					if (nameArrLen === index) {
						switch (type) {
							case "ObjectExpression":
								realCur.properties = properties.filter((item: any) => {
									return item.key.name !== cur;
								});
								return root;
							case "ArrayExpression":
								// 删除数组某项，因为是最后的删除，肯定是删除某一项，而不涉及属性
								delete realCur.elements[+cur];
								return root;
							default:
								console.error(`[delObjectAttr.ts] 暂不支持删除该类型：${type}`);
								break;
						}
						return pre;
					} else {
						// 需要继续读取属性
						switch (type) {
							case "ObjectExpression":
								const nextItemByObj = properties.filter((item: any) => {
									return item.key.name === cur;
								});
								return { parent: nextItemByObj[0]?.["value"], root: root };
							case "ArrayExpression":
								// 这里的逻辑一定是需要删除数组项中的某项中的某个属性  
								return { parent: elements[+cur], root: root };
							default:
								console.error(`[delObjectAttr.ts] 暂不支持删除该类型：${type}`);
								break;
						}

						console.log(realCur);
					}
				},
				{ root: astNode }
			);
		default:
			console.error(`[delObjectAttr.ts] 暂不支持删除该类型：${astNodeType}`);
			break;
	}
};

export default delObjectAttr;

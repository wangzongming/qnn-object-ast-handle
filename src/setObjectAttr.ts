import { objectProperty, identifier, objectExpression, Node, ObjectProperty, ObjectExpression, BooleanLiteral, ArrayExpression } from "@babel/types";
import createPropertie, { RealValue } from "./method/createPropertie";
import createLiteral from "./method/createLiteral";
const $ = require("gogocode");

/**
 * 传入字面量对象AST节点，函数设置完毕对象中的属性, 返回设置后的AST节点
 * 可用.表达嵌套: appInfo、appInfo.id、 download.0、 download.0.name、wxSdk.jsApiList.1 ...
 * @astNode ast节点
 * @name    要设置的对象属性
 */
export type SetObjectAttr = (astNode: Node, name: string, value: RealValue) => Node;
const setObjectAttr: SetObjectAttr = (astNode, name, value) => {
	const astNodeType = astNode.type;
	const nameArr: string[] = name.split(".");
	const nameArrLen: number = nameArr.length - 1;

	if (astNodeType === "ArrayExpression") {
		const curName = nameArr[0] || `${nameArr[0]}` === "0" ? Number(nameArr[0]) : undefined;
		const { elements } = astNode as ArrayExpression;
		const targetAst = elements[curName];
		const valueLevel = nameArr.splice(1, nameArr.length - 1);
		// console.log("直接替换", nameArr, curName);
		if (!curName && curName !== 0) {
			// 直接替换属性
			return createLiteral(value);
		} else {
			if (!targetAst) {
				// 为数组新增一个元素
				elements.push(createLiteral(value));
				return astNode;
			} else {
				// 修改数组中的某个元素
				elements[curName] = setObjectAttr(elements[curName], valueLevel.join("."), value) as any;
			}
		}
	}

	// 没有name的情况下直接替换整个对象
	if (!name) {
		return createLiteral(value);
	}

	const newAstNode = nameArr.reduce(
		($pre: { parent: Node | BooleanLiteral; root: Node }, cur: string | number, index: number) => {
			let { parent, root } = $pre;
			// 中杠时候需要为属性加引号
			// 其他情况下，属性名统一去除单引号和双引号
			const curAttr: string | number = `${cur}`.search("-") > -1 ? `"${cur}"` : cur;

			// 每个层级都需要查询是否有这个数据，没有的话需要创建属性
			// 如果为非最后层那属性为空对象，最后一层则为具体值
			let properties = (parent as ObjectExpression).properties || [];
			const findTargetAttr: ObjectProperty = properties.find((item: any) => item.key.name === curAttr || item.key.value === curAttr) as ObjectProperty;

			if (parent.type === "ObjectProperty" || parent.type === "ObjectExpression") {
				if (!findTargetAttr) {
					if (index === nameArrLen) {
						// 说明找不到属性，需要新建属性。 这里需要分为以下两种情况
						// 1、操作对象属性时候
						// 2、操作数组项时候, 数组项又分为对象和单纯类型
						$(parent).append("properties", createPropertie(curAttr as string, value));
						return { parent: root, root };
					} else {
						// 说明找不到属性，需要新建属性，并且属性有下级, 需要新增一个对象
						// 这里需要手动创建一个空字面量对象属性节点
						$(parent).append("properties", objectProperty(identifier(curAttr as string), objectExpression([])));
						return { parent: $(parent).find(`${curAttr}: $_$ `).match[0][0].node, root };
					}
				}
			} else if (parent.type === "ArrayExpression") {
				// 数组项操作
				const elements = parent?.["elements"] || [];
				if (elements[Number(cur)]) {
					// 修改数组项
					return { parent: parent["elements"][Number(cur)], root };
				} else {
					// 新增数组项
					// 暂时只支持新增 字面量对象 的数组项
					let newItem = objectExpression([]);
					parent["elements"].push(newItem);
					// console.log('新增数组项', cur, parent);
					return { parent: parent["elements"][Number(cur)], root };
				}
			}

			const parentType = parent.type;
			if (index === nameArrLen) {
				switch (parentType) {
					case "StringLiteral":
					case "NumericLiteral":
					case "NullLiteral":
					case "BooleanLiteral":
						(parent as any).value = value;
						return { parent, root };
					default:
						// 下面操作逻辑为替换属性
						// 不使用 gogoCode 是因为 gogoCode 的属性使用引号和不使用引号是严格区分的： "name": $_$ !== name: $_$
						properties = properties.map((item: any) => {
							if (item.key.name === curAttr || item.key.value === curAttr) {
								item.value = createLiteral(value);
							}
							return item;
						});
						(parent as ObjectExpression).properties = properties;
						return { parent, root };
				}
			} else {
				return { parent: findTargetAttr.value, root };
			}
		},
		{ parent: astNode, root: astNode }
	);
	return newAstNode.root;
};

export default setObjectAttr;

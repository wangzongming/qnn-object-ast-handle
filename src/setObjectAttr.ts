import { objectProperty, identifier, objectExpression, Node, ObjectProperty, ObjectExpression, BooleanLiteral, ArrayExpression } from "@babel/types";
import createPropertie, { RealValue } from "./method/createPropertie";
import createLiteral from "./method/createLiteral";
const $ = require("gogocode");

/**
 * 传入字面量对象AST节点，函数设置完毕对象中的属性, 返回设置后的AST节点
 * 可用.表达嵌套: appInfo、appInfo.id、 download.0、 download.0.name、wxSdk.jsApiList.1 ...
 * @astNode ast节点
 * @name    要设置的对象属性
 * @value   要设置的数据
 * @option  其他控制属性，如：像数组的某一个索引插入一条数据
 */
export type Option = {
	/**
	 * 对数组的操作：向数组的某个位置插入一条数据
	 * 如果没有这个配置将会采用替换的方式去操作数组项
	 */

	isInset?: boolean;

	/**
	 * 对数组的操作：使用 id 去匹配数组项，而不是使用索引（默认使用的是索引）
	 */
	arrayItemKey?: string;

	/**
	 * 对数组的操作：使用 id 去匹配数组项的情况新增时插入数据的索引，默认往最后插入
	 */
	insetIndex?: number;
};
export type SetObjectAttr = (astNode: Node, name: string, value: RealValue, option?: Option) => Node;
const setObjectAttr: SetObjectAttr = (astNode, name, value, option = {}) => {
	if (!astNode) {
		console.warn(`setObjectAttr 函数必须传入 astNode`);
		return;
	}
	const astNodeType = astNode.type;
	const nameArr: string[] = name.split(".");
	const nameArrLen: number = nameArr.length - 1;
	const { isInset, arrayItemKey = "_id", insetIndex } = option;
	if (astNodeType === "ArrayExpression") {
		const curName = nameArr[0] || `${nameArr[0]}` === "0" ? Number(nameArr[0]) : undefined;
		const { elements } = astNode as ArrayExpression;
		const targetAst = elements[curName];
		const valueLevel = nameArr.splice(1, nameArr.length - 1);
		if (!curName && curName !== 0) {
			// 直接替换属性
			return createLiteral(value);
		} else {
			if (!targetAst) {
				// 为数组新增一个元素
				elements.push(createLiteral(value));
				return astNode;
			} else {
				// console.log('nameArrLen', nameArrLen)
				// 首层情况下只会等于 2
				if (isInset && nameArrLen === 0) {
					// 新增数组项
					// console.log('新增数组项', curName, value);
					elements.splice(Number(curName), 0, createLiteral(value));
				} else {
					// 修改数组中的某个元素
					elements[curName] = setObjectAttr(elements[curName], valueLevel.join("."), value, option) as any;
				}
			}
		}
	}

	// 没有name的情况下直接替换整个对象
	if (!name) return createLiteral(value);

	const newAstNode = nameArr.reduce(
		($pre: { parent: Node | BooleanLiteral; root: Node; stop?: boolean }, cur: string | number, index: number) => {
			const arrayItemKeyReg = /^(\[\w{1,}\])$/;
			const numberReg = /^(\d+)$/g; // 注意下面的重复引用
			let { parent, root, stop } = $pre;
			// console.log("cur", cur, $pre);
			if (stop) return $pre;
			// 中杠时候需要为属性加引号
			// 其他情况下，属性名统一去除单引号和双引号
			const curAttr: string | number = `${cur}`.search("-") > -1 ? `"${cur}"` : cur;

			// 每个层级都需要查询是否有这个数据，没有的话需要创建属性
			// 如果为非最后层那属性为空对象，最后一层则为具体值
			let properties = (parent as ObjectExpression)?.properties || [];
			const findTargetAttr: ObjectProperty = properties.find((item: any) => {
				// 这里判断时候要去除掉上面手动加的引号
				let _curAttr = curAttr;
				if (typeof curAttr === "string") {
					_curAttr = `${curAttr}`.replace(/'|"/g, "");
				}
				return item.key.name === _curAttr || item.key.value === _curAttr;
			}) as ObjectProperty;

			// console.log("findTargetAttr", cur, parent, findTargetAttr);
			if (parent.type === "ObjectProperty" || parent.type === "ObjectExpression") {
				// 新建属性时候需要处理
				// 修改时这里不 return 即可。交由最下面的逻辑处理
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
						// 如果下一级为一个数组，那就不能创建对象而是创建数组

						// 下一级的话应该是 index + 1 才对，当时为什么这么写？
						// 如果这里这么写，那非底层也是空并且不是数组值时将会出问题，会导致它变成数组
						// const nextLevelName = nameArr[nameArrLen];
						const nextLevelName = nameArr[index + 1];
						const isIdArrItem = arrayItemKeyReg.test(`${nextLevelName}`);
						if (isIdArrItem) {
							// console.log('没有当前层级：', nextLevelName, cur)
							$(parent).append("properties", objectProperty(identifier(curAttr as string), createLiteral([])));
						} else {
							$(parent).append("properties", objectProperty(identifier(curAttr as string), objectExpression([])));
						}

						// 这里不能查找子集里面的，必须一级一级查下去，否在只要存在相同的名字，前面嵌套的也会被优先使用，所以这里不能使用 gogoCode
						// return { parent: $(parent).find(`${curAttr}: $_$ `).match[0][0].node, root };
						let curLevelMatch = properties.find(({ key }: any) => {
							return key.name === curAttr;
						});
						if (!curLevelMatch) {
							curLevelMatch = objectProperty(identifier(curAttr as string), objectExpression([]));
						}
						// console.log("curAttr", index, curAttr, parent, curLevelMatch);
						return { parent: (curLevelMatch as ObjectProperty).value, root };
					}
				}
			} else if (parent.type === "ArrayExpression") {
				// 数组项操作，数组项操作分两种：
				// 1、基于索引操作，cur 就是数组项索引位置
				// 2、基于id操作，使用 [] 包括 id 健名
				const elements = parent?.["elements"] || [];
				if (arrayItemKeyReg.test(`${cur}`)) {
					const itemId = `${cur}`.replace(/(\[|\])/g, "");
					// 基于 id 修改, 二维数组暂不支持
					const editItem = parent["elements"].filter((item) => {
						const { type, properties = [] } = item as ObjectExpression;
						if (type === "ObjectExpression") {
							const filterAttr = properties.filter((attrItem: any) => {
								if (attrItem["key"]["name"] === arrayItemKey && attrItem["value"]["value"] === itemId) {
									return true;
								}
								return false;
							});
							return !!filterAttr.length;
						} else {
							console.error(`id方式修改数组项暂不支持修改非字面量类型的数组项`);
						}
						return false;
					});

					if (editItem.length) {
						// 修改数组项
						return { parent: editItem[0], root };
					} else {
						// 新增数组项
						// 暂时只支持新增 字面量对象 的数组项,
						if (!(value as any)[arrayItemKey]) {
							console.error(`id方式新增数组项必须在新增的数据中添加一个：_id 属性`);
						}
						let newItem = createLiteral(value);
						if (insetIndex || insetIndex === 0) {
							parent["elements"].splice(insetIndex, 0, newItem);
							return { parent: parent["elements"][insetIndex], root };
						} else {
							parent["elements"].push(newItem);
							// console.log("新增后的数组：", parent["elements"], parent["elements"][elements.length - 1]);
							// 这里默认只能向后添加了
							return { parent: parent["elements"][elements.length - 1], root };
						}
					}
				} else {
					// 基于 索引 修改
					if (elements[Number(cur)]) {
						// 修改数组项
						return { parent: parent["elements"][Number(cur)], root };
					} else {
						if (new RegExp(numberReg).test(`${cur}`)) {
							// 根据索引新增数组项
							// 暂时只支持新增 字面量对象 的数组项
							let newItem = createLiteral(value);
							parent["elements"].push(newItem);
							return { parent: parent["elements"][Number(cur)], root };
						}else{
							// 说明不是新增数组项，返回对象接口， 这种情况会有吗？
							console.error(`AST 组件遇到了一个为止 bug: 001`)
							// let newItem = createLiteral(value);
							// parent["elements"].push(newItem);
							// console.log("===", cur, parent, value);
							return { parent: undefined, root };
						}
					}
				}
			}

			// 向数组的某个位置插入一条数据
			// 是最后一项匹配，并且匹配的项是数组
			// 因为设置数组项一定是 array.n 所以 nameArrLen - 1 （在array层去设置，而不是具体项去设置）
			if (index === nameArrLen - 1 && findTargetAttr && findTargetAttr?.value?.type === "ArrayExpression" && isInset) {
				findTargetAttr.value.elements.splice(+nameArr[nameArrLen], 0, createLiteral(value));
				return { parent, root, stop: true };
			}

			// 替换某个数组项的情况：
			// 是最后一项匹配，并且匹配的项是数组
			// 因为设置数组项一定是 array.n 所以 nameArrLen - 1 （在array层去设置，而不是具体项去设置）
			if (index === nameArrLen - 1 && findTargetAttr && findTargetAttr?.value?.type === "ArrayExpression" && !isInset) {
				// id 的方式操作某个数组项
				const nextLevelName = nameArr[nameArrLen];
				const isIdArrItem = arrayItemKeyReg.test(`${nextLevelName}`);
				// console.log("nextLevelName", nextLevelName);
				if (isIdArrItem) {
					// id 方式修改数组项
					const itemId = `${nextLevelName}`.replace(/(\[|\])/g, "");
					// console.log(itemId);
					// 基于 id 修改, 二维数组暂不支持
					const editItemIndex = findTargetAttr.value.elements.findIndex((item) => {
						const { type, properties = [] } = item as ObjectExpression;
						if (type === "ObjectExpression") {
							const filterAttr = properties.filter((attrItem: any) => {
								if (attrItem["key"]["name"] === arrayItemKey && attrItem["value"]["value"] === itemId) {
									return true;
								}
								return false;
							});
							return !!filterAttr.length;
						} else {
							console.error(`id方式修改数组项暂不支持修改非字面量类型的数组项`);
						}
						return false;
					});

					findTargetAttr.value.elements.splice(editItemIndex === -1 ? findTargetAttr.value.elements.length : editItemIndex, 0, createLiteral(value));
					return { parent, root, stop: true };
				} else {
					// 索引方式修改数组项
					findTargetAttr.value.elements[+nextLevelName] = createLiteral(value);
				}

				return { parent, root, stop: true };
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
								const oldVal = { ...item.value };
								item.value = createLiteral(value);
								item.value.extra = { ...item.value };
								// 将一些代码文件信息也放进去
								item.value = { ...oldVal, ...item.value };
							}
							return item;
						});
						// console.log('设置====', parentType, properties, parent);
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

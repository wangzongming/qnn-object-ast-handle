import { ObjectExpression, MemberExpression, UnaryExpression, ArrayExpression, StringLiteral, NumericLiteral, BooleanLiteral, NullLiteral } from "@babel/types";
const $ = require("gogocode");
export type GetObjectAttrRes = boolean | string | number | any[] | { [field: string]: any } | undefined;

// 获取原型链接
type GetProtoType = (node: MemberExpression) => any;
const getProtoType: GetProtoType = (node) => {
	let protots: any = [];
	let isArray: boolean = true;
	const loopFn = (node: any): void => {
		if (node.type === "MemberExpression") {
			const { property, object } = node;
			const objectType: "MemberExpression" | "ThisExpression" = object?.type;
			protots.push((property as any).name);
			if (object && objectType !== "ThisExpression") {
				loopFn(object);
			} else if (objectType === "ThisExpression") {
				protots.push("this");
			}
		} else if (node.type === "ObjectExpression") {
			isArray = false;
			protots = getObjectAttr(node);
		} else {
			isArray = false;
			protots = "__disabled__";
			// console.error(`[getObjectAttr.ts] 暂不支持的属性解析：${node.type}`);
		}
	};

	if (!node) {
		isArray = false;
		protots = "__disabled__";
	} else {
		loopFn(node);
	}
	return isArray ? protots.reverse().join(".") : protots;
};

export type Option = {
	/**
	 * 对数组的操作：使用 id 去匹配数组项，而不是使用索引（默认使用的是索引）
	 */
	arrayItemKey?: string;
};
/**
 * 将字面量对象AST节点传入获取对象中的某个属性
 * 可用.表达嵌套: appInfo、appInfo.id、 download.0、 download.0.name、wxSdk.jsApiList.1 ...
 * @astNode 对象的ast节点
 * @name    要获取的对象属性
 */
export type GetObjectAttr<T = GetObjectAttrRes> = (astNode: ObjectExpression | ArrayExpression, name?: string | number, option?: Option) => T;
const getObjectAttr: GetObjectAttr = (astNode, name, option = {}) => {
	const nameArr: string[] = name ? (name as string).split(".") : [];
	const nameArrLen: number = nameArr.length - 1;
	if (!astNode) {
		console.warn(`getObjectAttr 函数必须传入 astNode`);
		return;
	}
	const { arrayItemKey = "_id" } = option;
	const astNodeType = astNode.type;
	// 如果是数组
	if (astNodeType === "ArrayExpression") {
		const curName = Number(nameArr[0]);
		const { elements } = astNode as ArrayExpression;
		if (curName || curName === 0) {
			const targetAst = elements[curName];
			// console.log(targetAst, elements, curName)
			const nextAttr = nameArr.splice(1, nameArr.length - 1).join(".");
			// 这个类型除了为对象就是数组，所以直接as为对象
			return getObjectAttr(targetAst as ObjectExpression, nextAttr);
		} else { 
			// 这里注意：支持 string[]  Object[]  any[][]
			return elements.map((item) => {
				switch (item.type) {
					case "StringLiteral":
					case "NumericLiteral":
					case "BooleanLiteral":
						return item.value;
					case "NullLiteral":
						return null;
					default:
						return getObjectAttr(item as ObjectExpression);
				}
			});
		}
	}
	// 如果是函数
	// 不传入name的情况下获取整个对象，必须传入字面量对象代码节点 ObjectExpression
	if (!name && name !== 0) {
		const obj: any = {};
		if ((astNode as ObjectExpression).properties) {
			(astNode as ObjectExpression).properties.forEach((item: any) => {
				const key: string = item.key?.name || item.key?.value;
				const value: any = item.value?.value;
				const type: any = item.value?.type || item.type;
				const expression: any = item.expression;

				// console.log(`${key} 的类型：`, type);
				switch (type) {
					case "StringLiteral":
					case "BooleanLiteral":
					case "NumericLiteral":
					case "NullLiteral":
						obj[key] = value;
						break;
					case "ObjectExpression":
						obj[key] = getObjectAttr(item.value);
						break;
					case "ArrayExpression":
						const elements: any[] = item.value.elements?.map?.(
							(item: ArrayExpression | ObjectExpression | StringLiteral | NumericLiteral | BooleanLiteral | NullLiteral | UnaryExpression) => {
								const { type } = item;
								switch (type) {
									case "ObjectExpression":
										return getObjectAttr(item as ObjectExpression);
									case "StringLiteral":
										// console.log("数组类型", item)
										return (item as StringLiteral).value;
									case "NumericLiteral":
										return (item as NumericLiteral).value;
									case "BooleanLiteral":
										return (item as BooleanLiteral).value;
									case "NullLiteral":
										return null;
									case "UnaryExpression":
										// 表达式，注意的是：+ - 这两个表达式是一个数字，并不看成表达式
										if (["+", "-"].includes(item.operator)) {
											return item.operator === "-" ? 0 - (item.argument as NumericLiteral).value : (item.argument as NumericLiteral).value;
										}
										console.error(`[getObjectAttr.ts] 暂不支持读取数组属性 ${key} 的类型，复杂表达式无法读取：`, type);
										return "__disabled__";
									default:
										console.error(`[getObjectAttr.ts] 暂不支持读取数组属性 ${key} 的类型：`, type);
										return "__disabled__";
								}
							}
						);
						obj[key] = elements;
						break;
					case "UnaryExpression":
						// 表达式，注意的是：+ - 这两个表达式是一个数字，并不看成表达式
						if (["+", "-"].includes(item.value.operator)) {
							obj[key] = item.value.operator === "-" ? 0 - (item.value.argument as NumericLiteral).value : (item.value.argument as NumericLiteral).value;
						} else {
							console.error(`[getObjectAttr.ts] 暂不支持读取属性 ${key} 的类型，复杂表达式无法读取：`, type);
							obj[key] = "__disabled__";
						}
						break;
					case "MemberExpression":
						// 引用的变量属性，需要层层递归 value.property 和 value.object
						// eg: window.configs.apis.getUseInfo,
						obj[key] = getProtoType(expression || item?.value);
						break;
					case "ArrowFunctionExpression":
					case "FunctionExpression":
					case "ObjectMethod":
						// 不支持解析的使用 __disabled__ 标注
						obj[key] = "__disabled__";
						break;
					case "Identifier":
						// 变量引用 name: name // 这里name没有引号，为变量
						// undefined 也是这个类型
						if (item.value?.name === "undefined") {
							obj[key] = undefined;
						} else {
							obj[key] = "__disabled__";
						}
						break;
					case "NewExpression":
						// new 表达式 eg: new Date()
						obj[key] = "__disabled__";
						break;
					case "JSXElement":
						// eg: <div>111</div>
						obj[key] = "__disabled__";
						break;
					default:
						obj[key] = "__disabled__";
						// console.error(`[getObjectAttr.ts] 暂不支持读取属性 ${key} 的类型：`, type);
						break;
				}
			});
		}
		return JSON.parse(JSON.stringify(obj));
	}
	let arrtVal: GetObjectAttrRes = undefined;
	// console.log(nameArr, astNode)
	// pre 是ast对象
	nameArr.reduce(($pre: any, cur: string | number, index: number) => {
		// 中杠时候记住需要加引号
		const curAttr: string | number = `${cur}`.search("-") > -1 ? `"${cur}"` : cur;
		let curASTNode;
		try {
			const arrayItemKeyReg = /^(\[\w{1,}\])$/;
			if (!isNaN((cur as number) - 0) || arrayItemKeyReg.test(`${cur}`)) {
				// 获取数组中的某一项
				// 如果是获取数组的某一项的话直接返回值就行，如果数组是个字面量对象数组，那就需要继续解析
				// 数组项如果为非字符串时候需要继续解析;
				let curItem: any;
				// console.log('cur',  $pre)
				// 理论上不存在后面那种情况了，等后期将 gogoCode 移除后彻底废弃
				const elements = $pre.type === "ArrayExpression" ? $pre.elements : $pre.match[0][0].node.elements;
				if (arrayItemKeyReg.test(`${cur}`)) {
					// 按 id 找数组项
					const itemId = `${cur}`.replace(/(\[|\])/g, "");
					elements.forEach((item: ObjectExpression) => {
						const { type, properties = [] } = item;
						if (type === "ObjectExpression") {
							properties.forEach((attrItem: any) => {
								if (attrItem["key"]["name"] === arrayItemKey && attrItem["value"]["value"] === itemId) {
									curItem = item;
								}
							});
						} else {
							console.error(`id方式修改数组项暂不支持修改非字面量类型的数组项`);
						}
					});
				} else {
					// 按索引找数组项
					curItem = elements[cur];
					// console.log("curItem", curItem);
				}

				if (index === nameArrLen) {
					if (curItem.type === "StringLiteral") {
						curASTNode = curItem.value;
					} else if (curItem.type === "ObjectExpression") {
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
									// item.node  忘记了...
									// item.value 是字面量属性的属性为一个字面量对象时
									(arrtVal as any)[key] = getObjectAttr(item.node || item.value);
								}
							});
						}
						// 这里为啥直接打断了？
						return;
					} else if (curItem?.type === "ArrayExpression") {
						console.error("[getObjectAttr.ts] 暂不支持解析二维数组");
					}
				} else {
					curASTNode = $(curItem);
				}
			} else {
				// curASTNode = $pre.find(`${curAttr}: $_$ `); // 这么写相同的属性全部会被查出来
				// 这里不能查找子集里面的，必须一级一级查下去，否在只要存在相同的名字，前面嵌套的也会被优先使用(并且不止一个)，所以这里不能使用 gogoCode
				// const properties = $pre.type ? : $pre["0"]?.["nodePath"]?.["node"]?.["properties"] || [];
				let properties: any[] = [];
				if ($pre.type) {
					switch ($pre.type) {
						case "ObjectExpression":
							properties = $pre?.properties;
							break;
						default:
							break;
					}
				} else {
					properties = $pre["0"]?.["nodePath"]?.["node"]?.["properties"] || [];
				}
				curASTNode = properties.find(({ key }: any) => key.name === curAttr)?.value; // 这里需要返回 value
			}
			if (!curASTNode) {
				arrtVal = undefined;
				return $pre; // 这时候不会再有子集了，所以直接返回自己避免报错
			}
			if (index === nameArrLen) {
                // console.log("cur:", name)
				name === "canChangeProject" && console.log("", curASTNode)
				if (typeof curASTNode === "string") {
					arrtVal = curASTNode;
				} else if (["StringLiteral", "BooleanLiteral", "NumericLiteral", "NullLiteral"].includes(curASTNode.type)) {
					// 上面那种 直接等于 string 情况应该使用 gogocode 才会出现，所以存在的意义已经不大了
					arrtVal = curASTNode.value;
				} else {
					// 有时候不是使用 gogocode 解析的
					const exgNode: any = curASTNode.expando ? curASTNode.match?.[0]?.[0]?.node : curASTNode;
					// name === "option" && console.log("curASTNode", exgNode);

					// 如果是数组
					if (exgNode?.type === "ArrayExpression") {
						// 数组可能是两种情况，一种是 string[]  另一种是 object[]
						const arrys = $(exgNode).find(`[$_$]`);
						arrtVal = [];
						if (arrys.match?.[0]) {
							arrys.match[0].forEach((item: any) => {
								if (item.node.type === "StringLiteral") {
									(arrtVal as string[]).push(item.value);
								} else if (item.node.type === "ObjectExpression") {
									(arrtVal as any[]).push(getObjectAttr(item.node));
								}
							});
						}
					} else if (exgNode?.type === "ObjectExpression") {
						// 对象的话解析属性即可(为对象的属性也一样，对象的属性是个字面量对象的情况下)
						arrtVal = {};
						if (exgNode.properties) {
							exgNode.properties.forEach((item: any) => {
								const key: string = item.key?.name || item.key?.value;
								const value: any = item.value?.value;
								const type: any = item.value?.type;
								if (type === "StringLiteral") {
									(arrtVal as any)[key] = value;
								} else {
									// 非字符串，需要解析
									(arrtVal as any)[key] = getObjectAttr(item.node || item.value);
									// name === "option" && console.log("===", item.node || item.value, (arrtVal as any)[key]);
								}
							});
						}
					} else {
						curASTNode.each &&
							curASTNode.each((item: any) => {
								switch (item.match?.[0]?.[0]?.node?.type) {
									case "ArrowFunctionExpression":
									case "FunctionExpression":
									case "ObjectMethod":
									case "Identifier":
									case "NewExpression":
									case "JSXElement":
										arrtVal = "__disabled__";
										break;
									default:
										arrtVal = item.match[0][0].value;
										break;
								}
							});
					}
				}
			} else {
				return curASTNode;
			}
		} catch (err) {
			// find 找不到只会会抛出错误
			// console.info("寻找下一级出错：", err);
		}
	}, $(astNode));

	// if (name === "option") {
	// 	console.log("最后获取值：", arrtVal);
	// }
	// return obj;
	return arrtVal;
};

export default getObjectAttr;

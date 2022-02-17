import { ObjectExpression, MemberExpression, ArrayExpression, StringLiteral, NumericLiteral, BooleanLiteral, NullLiteral } from "@babel/types";
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
			console.error(`[getObjectAttr.ts] 暂不支持的属性解析：${node.type}`);
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

/**
 * 将字面量对象AST节点传入获取对象中的某个属性
 * 可用.表达嵌套: appInfo、appInfo.id、 download.0、 download.0.name、wxSdk.jsApiList.1 ...
 * @astNode 对象的ast节点
 * @name    要获取的对象属性
 */
export type GetObjectAttr<T = GetObjectAttrRes> = (astNode: ObjectExpression | ArrayExpression, name?: string | number) => T;
const getObjectAttr: GetObjectAttr = (astNode, name) => {
	const nameArr: string[] = name ? (name as string).split(".") : [];
	const nameArrLen: number = nameArr.length - 1;
	if (!astNode) {
		console.warn(`getObjectAttr 函数必须传入 astNode`);
		return;
	}
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
			// 这个类型除了为对象就是数组，所以直接as为对象
			return elements.map((item) => getObjectAttr(item as ObjectExpression));
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
						const elements: any[] = item.value.elements?.map?.((item: ArrayExpression | ObjectExpression | StringLiteral | NumericLiteral | BooleanLiteral | NullLiteral) => {
							const { type } = item;
							switch (type) {
								case "ObjectExpression":
									return getObjectAttr(item as ObjectExpression);
								case "StringLiteral":
									return (item as StringLiteral).value;
								case "NumericLiteral":
									return (item as NumericLiteral).value;
								case "BooleanLiteral":
									return (item as BooleanLiteral).value;
								case "NullLiteral": 
									return null;
								default:
									console.error(`[getObjectAttr.ts] 暂不支持读取数组属性 ${key} 的类型：`, type);
									return "__disabled__";
							}
						});
						obj[key] = elements;
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
						obj[key] = "__disabled__";
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
		return obj;
	}
	let arrtVal: GetObjectAttrRes = undefined;
	// console.log(nameArr, astNode)
	// pre 是ast对象
	nameArr.reduce(($pre: any, cur: string | number, index: number) => {
		// 中杠时候记住需要加引号
		const curAttr: string | number = `${cur}`.search("-") > -1 ? `"${cur}"` : cur;
		let curASTNode;
		try {
			if (!isNaN((cur as number) - 0)) {
				// 获取数组中的某一项
				// 如果是获取数组的某一项的话直接返回值就行，如果数组是个字面量对象数组，那就需要继续解析
				// 数组项如果为非字符串时候需要继续解析
				const curItem: any = $pre.match[0][0].node.elements[cur];
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
									(arrtVal as any)[key] = getObjectAttr(item.node);
								}
							});
						}
						return;
					} else if (curItem.type === "ArrayExpression") {
						console.error("[getObjectAttr.ts] 暂不支持解析二维数组");
					}
				} else {
					curASTNode = $(curItem);
				}
			} else {
				curASTNode = $pre.find(`${curAttr}: $_$ `);
			}

			if (!curASTNode) {
				arrtVal = undefined;
				return $pre; // 这时候不会再有子集了，所以直接返回自己避免报错
			}

			if (index === nameArrLen) {
				if (typeof curASTNode === "string") {
					arrtVal = curASTNode;
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
									(arrtVal as string[]).push(item.value);
								} else if (item.node.type === "ObjectExpression") {
									(arrtVal as any[]).push(getObjectAttr(item.node));
								}
							});
						}
					} else if (exgNode?.type === "ObjectExpression") {
						// 对象的话解析属性即可
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
								}
							});
						}
					} else {
						curASTNode.each((item: any) => {
							switch (item.match[0][0].node?.type) {
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
			// console.log('err', err)
		}
	}, $(astNode));

	return arrtVal;
};

export default getObjectAttr;

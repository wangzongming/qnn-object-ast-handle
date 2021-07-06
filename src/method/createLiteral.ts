// 创建属性值
import { stringLiteral, booleanLiteral, numericLiteral, objectExpression, arrayExpression, nullLiteral, StringLiteral, BooleanLiteral, NumericLiteral, ObjectExpression, ObjectProperty, ArrayExpression, NullLiteral } from "@babel/types";
import createPropertie from "./createPropertie";

type Value = string | boolean | number;
export type ArrayValue = Value[];
export type ObjectValue = { [field: string]: Value };
type Res = StringLiteral | BooleanLiteral | NumericLiteral | ObjectExpression | ArrayExpression | NullLiteral;
type CreateLiteral = (value: Value | ArrayValue | ObjectValue | ObjectValue[]) => Res;

const createLiteral: CreateLiteral = (value) => {
	let objectNode: Res;

	if (value === null || value === undefined) {
		objectNode = nullLiteral();
		return objectNode;
	}
	switch (typeof value) { 
		case "string":
			objectNode = stringLiteral(value);
			break;
		case "boolean":
			objectNode = booleanLiteral(value);
			break;
		case "number":
			objectNode = numericLiteral(value);
			break;
		case "object":
			if (Array.isArray(value)) {
				// 二维数组
				const elements: ArrayExpression["elements"] = [];
				(value as ArrayValue).forEach((element) => elements.push(createLiteral(element)));
				objectNode = arrayExpression(elements);
			} else {
				// 字面量对象
				const properties: ObjectExpression["properties"] = [];
				for (const key in value as ObjectValue) {
					const propertie: ObjectProperty = createPropertie(key, (value as ObjectValue)[key]);
					properties.push(propertie);
				}
				objectNode = objectExpression(properties);
			}
			break;
		default:
			console.error("[createLiteral.js] 暂不支持的处理类型：", typeof value);
			break;
	}

	return objectNode;
};

export default createLiteral;

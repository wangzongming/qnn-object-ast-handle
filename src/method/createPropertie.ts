import { objectProperty, identifier } from "@babel/types";
import createLiteral from "./createLiteral";

export type Value = string | boolean | number;
export type ArrayValue = Value[];
export type ObjectValue = { [field: string]: Value };
export type RealValue = Value | ArrayValue | ObjectValue | ObjectValue[];
type CreatePropertie = (field: string, value: RealValue) => any;

const createPropertie: CreatePropertie = (field, value) => {
	let objectNode: any;
	switch (typeof value) {
		case "string":
		case "boolean":
		case "number":
		case "object":
		case "undefined":
			objectNode = objectProperty(identifier(field), createLiteral(value));
			break;
		default:
			console.error("[createPropertie.js] 暂不支持的处理类型：", typeof value);
			break;
	}

	return objectNode;
};
export default createPropertie;

/* eslint-disable @typescript-eslint/naming-convention */
import traverse from "@babel/traverse";
import { parse } from "@typescript-eslint/typescript-estree";
import { Node } from "@babel/types";
import * as t from "@babel/types";
import { UseTFuncReference, UseTranslationReference } from "./types";
import Cache from "./cache";

const toBabel = require("estree-to-babel");

export function i18nJavascriptTraverse(text: string) {
  const ast = toBabel(parse(text, { jsx: true, loc: true })) as Node;
  const list: (UseTranslationReference | UseTFuncReference)[] = [];
  traverse(ast, {
    VariableDeclarator(path) {
      if (path.isUseTranslationDeclarator()) {
        list.push(UseTranslationReference.getFromStringLiteralNodePath(path));
      }
    },
    CallExpression(path) {
      if (path.isTFuncCallExpression()) {
        //
        list.push(UseTFuncReference.getFromStringLiteralNodePath(path));
      }
    },
  });
  console.log(list);
}

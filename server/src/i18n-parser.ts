/* eslint-disable @typescript-eslint/naming-convention */
import traverse from "@babel/traverse";
import { parse } from "@typescript-eslint/typescript-estree";
import { Node, SourceLocation } from "@babel/types";
import { LocBased, UseTranslationReference } from "./types";

const toBabel = require("estree-to-babel");

export async function i18nJavascriptTraverse(text: string) {
  const ast = toBabel(parse(text, { jsx: true, loc: true })) as Node;
  const refTree: UseTranslationReference[] = [];
  const locList: LocBased[] = [];

  traverse(ast, {
    VariableDeclarator(path) {
      if (path.isUseTranslationDeclarator()) {
        const ref = UseTranslationReference.getFromStringLiteralNodePath(path);
        refTree.push(ref);
        locList.push(ref);
      }
    },
    CallExpression(path) {
      if (path.isTFuncCallExpression()) {
        const tVarName = path.node.callee.name,
          useTransRef = refTree.find((i) => i.tVarName === tVarName);
        if (!useTransRef) {
          throw new Error(`${tVarName} not found!`);
        }
        const ref = useTransRef.addTFuncReferenceFromNodePath(path);
        locList.push(ref);
      }
    },
  });

  // fetch json file uri
  await Promise.all(refTree.map((r) => r.fetchJsonFileUri()));

  return { refTree, locList };
}

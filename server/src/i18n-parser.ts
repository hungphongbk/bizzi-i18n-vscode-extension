/* eslint-disable @typescript-eslint/naming-convention */
import traverse, { Scope, NodePath, Hub } from "@babel/traverse";
import { parse } from "@typescript-eslint/typescript-estree";
import { Node, SourceLocation } from "@babel/types";
import { LangJsonReference, LocBased, UseTranslationReference } from "./types";
import { URI } from "vscode-languageserver/node";
import { connection } from "connection";
import { ExtensionRequestType } from "../../shared/enums";
import jsonParse, { ObjectNode } from "json-to-ast";

const toBabel = require("estree-to-babel");

export async function i18nJavascriptTraverse(text: string) {
  const originAst = parse(text, {
    jsx: true,
    loc: true,
    errorOnTypeScriptSyntacticAndSemanticIssues: false,
  });
  const ast = toBabel(originAst) as Node;
  const refTree: UseTranslationReference[] = [];
  const locList: LocBased[] = [];

  traverse(ast, {
    noScope: true,
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

  // fetch json file uris
  await Promise.all(refTree.map((r) => r.fetchJsonFileUri()));
  console.log("done");
  return { ast, refTree, locList };
}

export async function langJsonTraverse(uri: URI) {
  const text = (await connection.sendRequest(
    ExtensionRequestType.readJsonFile,
    uri
  )) as string;

  const locList: LocBased[] = [];

  const json = JSON.parse(text);
  const jsonAst = jsonParse(text, { loc: true }) as ObjectNode;
  const jsonRef = new LangJsonReference(jsonAst, uri, json);
  locList.push(jsonRef, ...jsonRef.items);

  return { ast: jsonAst, jsonRef, locList, json };
}

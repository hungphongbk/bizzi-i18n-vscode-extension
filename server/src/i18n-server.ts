import {
  InitializeParams,
  InitializeResult,
  Location,
  Position,
  Range,
  TextDocumentSyncKind,
  WorkspaceFolder,
} from "vscode-languageserver/node";

import Cache from "./cache";
import { i18nJavascriptTraverse } from "./i18n-parser";
import { SourceLocation } from "@babel/types";
import { UseTFuncReference, UseTranslationReference } from "./types";
import { connection, document } from "./connection";
import { retry } from "@shared";
import { checkPositionInsideLoc } from "utils";

let workspaceFolders: WorkspaceFolder[] | null | undefined;

// function workspace<T, R>(func: (workspaceUri: URI, _1: T) => R): (_1: T) => R;
// function workspace<T, T2, R>(
//   func: (workspaceUri: URI, _1: T, _2: T2) => R
// ): (_1: T, _2: T2) => R;
// function workspace<T, T2, T3, R>(
//   func: (workspaceUri: URI, _1: T, _2: T2, _3: T3) => R
// ): (_1: T, _2: T2, _3: T3) => R;
// function workspace(func: Function) {
//   return function (...args: any[]) {
//     const uri = args[0].textDocument.uri as string,
//       workspaceFolder = workspaceFolders?.find((ws) => uri.includes(ws.uri));
//     return func.apply(null, [workspaceFolder?.uri, ...args]);
//   };
// }

connection.onInitialize((params: InitializeParams) => {
  workspaceFolders = params.workspaceFolders;
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      definitionProvider: true,
    },
  };
  return result;
});

document.onDidChangeContent(async (change) => {
  const { document } = change;
  const timeLabel = `element passed of ${document.uri}`;
  console.time(timeLabel);
  if (
    ["javascript", "javascriptreact", "typescript", "typescriptreact"].some(
      (l) => l === document.languageId
    )
  ) {
    const { refTree, locList } = await retry(() =>
      i18nJavascriptTraverse(document.getText())
    );
    console.log("cache set");
    Cache.instance.set(document.uri, {
      languageId: document.languageId as
        | "javascript"
        | "javascriptreact"
        | "typescript"
        | "typescriptreact",
      ref: refTree,
      locList,
    });
  }
  console.timeEnd(timeLabel);
  console.log(Cache.instance.cache.keys());
});

connection.onDidOpenTextDocument((p1) => console.log(p1));

connection.onDefinition(async ({ textDocument, position }) => {
  console.log(position);
  if (!/\.lang\.json$/.test(textDocument.uri)) {
    console.time("def");
    const cached = Cache.instance.get(textDocument.uri)!,
      locBasedNode = cached?.locList.find((l) =>
        checkPositionInsideLoc(position, l.loc)
      );
    console.log(locBasedNode ? "found" : "not found");
    console.timeEnd("def");

    if (locBasedNode instanceof UseTranslationReference) {
      return [
        Location.create(
          (<UseTranslationReference>locBasedNode).langJsonReference.uri,
          Range.create(0, 0, 0, 0)
        ),
      ];
    } else if (<UseTFuncReference>locBasedNode instanceof UseTFuncReference) {
      const ref = (<UseTFuncReference>locBasedNode).langJsonItemRef;
      console.log(ref);
      if (!ref) {
        return null;
      }
      return [
        Location.create(
          (<UseTFuncReference>locBasedNode).useTranslationRef.langJsonReference
            .uri,
          Range.fromSourceLoc(ref.loc)
        ),
      ];
    }
  }
  return null;
});

document.listen(connection);
connection.listen();

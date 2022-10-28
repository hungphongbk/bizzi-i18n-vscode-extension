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
import { UseTFuncReference, UseTranslationReference } from "./types";
import { connection, document } from "./connection";
import { ExtensionRequestType, retry } from "@shared";
import { checkPositionInsideLoc } from "utils";
import { extractI18nFromSelected } from "handlers";

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
      hoverProvider: true,
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
    const { refTree, ...payload } = await retry(() =>
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
      ...payload,
    });
  }
  console.timeEnd(timeLabel);
  console.log(Cache.instance.cache.keys());
});

connection.onDidOpenTextDocument((p1) => console.log(p1));

connection.onDefinition(async ({ textDocument, position }) => {
  // console.log(position);
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
    } else if (locBasedNode instanceof UseTFuncReference) {
      const ref = (<UseTFuncReference>locBasedNode).langJsonItemRef;
      // console.log(ref);
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

connection.onHover(async ({ textDocument, position }) => {
  if (!/\.lang\.json$/.test(textDocument.uri)) {
    console.time("def");
    const cached = Cache.instance.get(textDocument.uri)!,
      locBasedNode = cached?.locList.find((l) =>
        checkPositionInsideLoc(position, l.loc)
      );

    if (locBasedNode instanceof UseTFuncReference) {
      const node = locBasedNode as UseTFuncReference;
      return {
        contents: {
          kind: "markdown",
          value: [
            `- **Vietnam**: ${
              node.langJsonItemRef?.lang("vi") ?? "_undefined_"
            }`,
            `- **English**: ${
              node.langJsonItemRef?.lang("en") ?? "_undefined_"
            }`,
          ].join("\n"),
        },
      };
    }
  }
  return null;
});

connection.onRequest(
  ExtensionRequestType.extractI18nFromSelected,
  extractI18nFromSelected
);

document.listen(connection);
connection.listen();

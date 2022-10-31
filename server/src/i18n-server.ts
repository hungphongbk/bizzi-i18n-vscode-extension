import {
  InitializeParams,
  InitializeResult,
  Location,
  Position,
  Range,
  TextDocumentSyncKind,
  WorkspaceFolder,
  TextDocumentChangeEvent,
} from "vscode-languageserver/node";

import Cache, { CacheValue } from "./cache";
import { i18nJavascriptTraverse } from "./i18n-parser";
import { UseTFuncReference, UseTranslationReference } from "./types";
import { connection, document } from "./connection";
import { delay, ExtensionRequestType, isTypescript, retry } from "@shared";
import { checkPositionInsideLoc } from "utils";
import { extractI18nFromSelected } from "handlers";
import { TextDocument } from "vscode-languageserver-textdocument";
import { flatten } from "lodash";

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

async function onDidChangeContentEventHandler(
  change: TextDocumentChangeEvent<TextDocument>
) {
  const { document } = change;
  const timeLabel = `element passed of ${document.uri}`;
  console.time(timeLabel);
  let cached: CacheValue | undefined = undefined;
  if (
    ["javascript", "javascriptreact", "typescript", "typescriptreact"].some(
      (l) => l === document.languageId
    )
  ) {
    const { refTree, ...payload } = await retry(() =>
      i18nJavascriptTraverse(document.getText())
    );
    console.log("cache set");
    cached = {
      languageId: document.languageId as
        | "javascript"
        | "javascriptreact"
        | "typescript"
        | "typescriptreact",
      ref: refTree,
      ...payload,
    };
    Cache.instance.set(document.uri, cached);
  }
  console.timeEnd(timeLabel);
  // console.log(Cache.instance.cache.keys());
  return cached;
}
document.onDidChangeContent((change) => {
  Cache.instance.setPromise(
    change.document.uri,
    onDidChangeContentEventHandler(change)
  );
});
connection.onRequest(
  ExtensionRequestType.annotationRequest,
  async ({ documentUri, lang }: { documentUri: string; lang: string }) => {
    console.log(documentUri);
    while (!Cache.instance.getPromise(documentUri)) {
      await delay(1);
    }
    const cached = (await Cache.instance.getPromise(documentUri)) as CacheValue;
    // console.log(ExtensionRequestType.annotationRequest);
    // console.log(cached);
    if (isTypescript(cached.languageId)) {
      const rs = flatten(
        (cached.ref as UseTranslationReference[]).map((useTransRef) =>
          useTransRef.tFuncReferences.map((tFunRef) => ({
            range: Range.fromSourceLoc(tFunRef.fnLoc),
            renderOptions: {
              after: {
                color: "#aaa",
                contentText: `"${tFunRef.lang(lang)}"`,
                fontStyle: "normal",
                border: "0.5px solid #444;border-radius:2px;",
              },
            },
          }))
        )
      );
      console.log(JSON.stringify(rs, null, 2));
      return rs;
    }

    return undefined;
  }
);

// connection.onDidOpenTextDocument((p1) => console.log(p1));

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

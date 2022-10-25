import {
  createConnection,
  InitializeParams,
  InitializeResult,
  Position,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import Cache from "./cache";
import { i18nJavascriptTraverse } from "./i18n-parser";
import { SourceLocation } from "@babel/types";

const connection = createConnection(ProposedFeatures.all);
Cache.initialize(connection);

const document: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialize((_: InitializeParams) => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      definitionProvider: true,
    },
  };
  return result;
});

document.onDidChangeContent((change) => {
  const { document } = change;
  const timeLabel = `element passed of ${document.uri}`;
  console.time(timeLabel);
  if (
    ["javascript", "javascriptreact", "typescript", "typescriptreact"].some(
      (l) => l === document.languageId
    )
  ) {
    const { refTree, locList } = i18nJavascriptTraverse(document.getText());
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
});

function checkPositionInsideLoc(
  position: Position,
  loc: SourceLocation
): boolean {
  if (position.line < loc.start.line - 1 || position.line > loc.end.line - 1) {
    return false;
  }
  if (
    position.line === loc.start.line - 1 &&
    position.character < loc.start.column - 1
  ) {
    return false;
  }
  if (
    position.line === loc.end.line - 1 &&
    position.character > loc.end.column - 1
  ) {
    return false;
  }
  return true;
}

connection.onDefinition(({ textDocument, position }) => {
  console.log(position);
  if (!/\.lang\.json$/.test(textDocument.uri)) {
    console.time("def");
    const cached = Cache.instance.get(textDocument.uri)!,
      locBasedNode = cached?.locList.find((l) =>
        checkPositionInsideLoc(position, l.loc)
      );
    console.log(locBasedNode ? "found" : "not found");
    console.timeEnd("def");
  }
  return null;
});

document.listen(connection);
connection.listen();

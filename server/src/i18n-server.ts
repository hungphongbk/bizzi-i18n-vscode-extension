import {
  createConnection,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import Cache from "./cache";
import { i18nJavascriptTraverse } from "./i18n-parser";

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
  i18nJavascriptTraverse(document.getText());
  console.timeEnd(timeLabel);
});

document.listen(connection);
connection.listen();

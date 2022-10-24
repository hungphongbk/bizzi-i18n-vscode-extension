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
  Cache.instance.set(document.uri, {
    document,
  });
});

document.listen(connection);
connection.listen();

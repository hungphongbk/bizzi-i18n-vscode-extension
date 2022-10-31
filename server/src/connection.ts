import { TextDocument } from "vscode-languageserver-textdocument";
import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
} from "vscode-languageserver/node";
import Cache from "./cache";

const connection = createConnection(ProposedFeatures.all);
Cache.initialize(connection);

const document: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

export { connection, document };

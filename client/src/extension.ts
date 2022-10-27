// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as path from "path";
// import { extractI18nFromSelected } from "./commands";
// import I18nDefinitionProvider from "./engine/I18nDefinitionProvider";
// import I18nExtensionVisitor from "./visitor/I18nExtensionVisitor";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { ExtensionRequestType } from "@shared";
import { getWorkspaceFolder } from "utils";
import readLangJsonFile from "handler/read-lang-json";

let client: LanguageClient;

async function getJsonResourceFile(ns: string): Promise<string> {
  let uri: vscode.Uri | undefined = undefined;
  console.log(vscode.window.activeTextEditor!.document.uri);
  const rootUri = getWorkspaceFolder();
  try {
    uri = vscode.Uri.joinPath(rootUri!, `${ns}.lang.json`);
    await vscode.workspace.fs.stat(uri);
  } catch (e) {
    uri = vscode.Uri.joinPath(
      rootUri!,
      `${ns + "/" + ns.substring(ns.lastIndexOf("/"))}.lang.json`
    );
    console.log(uri);
  }

  return uri.toString();
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(
    path.join("server", "out", "server.js")
  );
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language clients
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [
      ...["javascript", "javascriptreact", "typescript", "typescriptreact"].map(
        (language) => ({ scheme: "file", language })
      ),
      { scheme: "file", language: "json", pattern: "**/*.lang.json" },
    ],
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    "bizzi-i18n-server",
    "Bizzi I18n Server",
    serverOptions,
    clientOptions
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  // let disposable = vscode.commands.registerCommand(
  //   "bizzi-i18n-vscode-extension.extractI18NFromSelected",
  //   extractI18nFromSelected
  // );

  // context.subscriptions.push(disposable);

  // const definitionProvider = new I18nDefinitionProvider(false),
  //   tsDefinitionProvider = new I18nDefinitionProvider(true);
  // context.subscriptions.push(
  //   vscode.languages.registerDefinitionProvider(
  //     { scheme: "file", language: "javascript" },
  //     definitionProvider
  //   )
  // );
  // context.subscriptions.push(
  //   vscode.languages.registerDefinitionProvider(
  //     { scheme: "file", language: "typescript" },
  //     tsDefinitionProvider
  //   )
  // );
  // context.subscriptions.push(
  //   vscode.languages.registerDefinitionProvider(
  //     { scheme: "file", language: "typescriptreact" },
  //     tsDefinitionProvider
  //   )
  // );

  // I18nExtensionVisitor.init(context);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "bizzi-i18n-vscode-extension.restart",
      () => {
        client
          .restart()
          .catch((error) =>
            client.error(`Restarting client failed`, error, "force")
          );
      }
    )
  );

  // Start the client. This will also launch the server
  client
    .start()
    .then(() => {
      // Use the console to output diagnostic information (console.log) and errors (console.error)
      // This line of code will only be executed once when your extension is activated
      console.log(
        'Congratulations, your extension "bizzi-i18n-vscode-extension" is now active!'
      );

      client.onRequest(
        ExtensionRequestType.getJsonFileFromNs,
        (payload: string): Promise<string | undefined> => {
          console.log(payload);
          return getJsonResourceFile(payload);
        }
      );

      client.onRequest(ExtensionRequestType.readJsonFile, readLangJsonFile);
    })
    .catch((error) =>
      client.error(`Starting the server failed.`, error, "force")
    );
}

// this method is called when your extension is deactivated
export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

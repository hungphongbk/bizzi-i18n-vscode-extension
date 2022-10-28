// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
// import { extractI18nFromSelected } from "./commands";
// import I18nDefinitionProvider from "./engine/I18nDefinitionProvider";
// import I18nExtensionVisitor from "./visitor/I18nExtensionVisitor";

import { LanguageClient } from "vscode-languageclient/node";
import { ExtensionRequestType } from "@shared";
import { getWorkspaceFolder } from "utils";
import I18nLanguageClient from "i18n-client";

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
  // Create the language client and start the client.
  client = new I18nLanguageClient(context);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "bizzi-i18n-vscode-extension.extractI18NFromSelected",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor?.selection) {
        return;
      }
      await client.sendRequest(ExtensionRequestType.extractI18nFromSelected, {
        textDocument: {
          uri: editor.document.uri.toString(),
        },
        selection: editor.selection,
      });
    }
  );

  context.subscriptions.push(disposable);

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

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { extractI18nFromSelected } from "./commands";
import I18nDefinitionProvider from "./engine/I18nDefinitionProvider";
import I18nExtensionVisitor from "./visitor/I18nExtensionVisitor";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "bizzi-i18n-vscode-extension" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "bizzi-i18n-vscode-extension.extractI18NFromSelected",
    extractI18nFromSelected
  );

  context.subscriptions.push(disposable);

  const definitionProvider = new I18nDefinitionProvider(false),
    tsDefinitionProvider = new I18nDefinitionProvider(true);
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { scheme: "file", language: "javascript" },
      definitionProvider
    )
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { scheme: "file", language: "typescript" },
      tsDefinitionProvider
    )
  );
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { scheme: "file", language: "typescriptreact" },
      tsDefinitionProvider
    )
  );

  I18nExtensionVisitor.init(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}

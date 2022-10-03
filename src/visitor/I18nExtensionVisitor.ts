/* eslint-disable @typescript-eslint/naming-convention */
import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import { JSXText, StringLiteral } from "@babel/types";
import * as vscode from "vscode";

type TextNodes = StringLiteral | JSXText;

export default class I18nExtensionVisitor {
  private context: vscode.ExtensionContext;
  textEditor?: vscode.TextEditor;
  ast: any;

  static __instance: I18nExtensionVisitor;
  static init(context: vscode.ExtensionContext) {
    this.__instance = new I18nExtensionVisitor(context);
  }
  static get instance(): I18nExtensionVisitor {
    return this.__instance;
  }

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;

    this.textEditor = vscode.window.activeTextEditor;
    this.parse();
    this.context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.textEditor = editor;
          this.parse();
        }
      })
    );
  }

  async parse() {
    if (!this.textEditor) {
      return;
    }
    this.ast = parser.parse(this.textEditor.document.getText(), {
      sourceType: "module",
      plugins: ["jsx"],
    });
  }

  traverse(selection: vscode.Selection) {
    const self = this;
    return new Promise<NodePath<TextNodes>>((resolve) => {
      traverse(this.ast, {
        StringLiteral(path) {
          self.pickElement(path, selection, resolve);
        },
        JSXText(path) {
          self.pickElement(path, selection, resolve);
        },
      });
    });
  }
  private pickElement<T extends TextNodes>(
    path: NodePath<T>,
    selection: vscode.Selection,
    resolve: (value: NodePath<T>) => void
  ) {
    const range = new vscode.Range(
      path.node.loc!.start.line - 1,
      path.node.loc!.start.column,
      path.node.loc!.end.line - 1,
      path.node.loc!.end.column
    );
    if (range.contains(selection)) {
      resolve(path);
    }
  }
}

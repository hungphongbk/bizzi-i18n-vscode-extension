/* eslint-disable @typescript-eslint/naming-convention */
import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as vscode from "vscode";
import TDecl from "./TDecl";
import TPair from "./TPair";
import TPath from "./TPath";
import { TextNodes } from "./types";
import { debounce } from "lodash";
import retry from "async-await-retry";

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
    this.context.subscriptions.push(
      vscode.window.onDidChangeTextEditorSelection(
        debounce((e: vscode.TextEditorSelectionChangeEvent) => {
          if (e.textEditor) {
            this.textEditor = e.textEditor;
            this.parse();
          }
        }, 200)
      )
    );
  }

  async parse() {
    if (!this.textEditor) {
      return;
    }
    await retry(this._parse.bind(this));
  }
  private async _parse() {
    this.ast = parser.parse(this.textEditor!.document.getText(), {
      sourceType: "module",
      plugins: ["jsx"],
    });
  }

  traverse(selection: vscode.Selection) {
    const self = this;
    return new Promise<TPair>((resolve, reject) => {
      const handler = setTimeout(() => {
        reject(new Error("timeout"));
      }, 200);
      const enhancedResolve: typeof resolve = (val) => {
        clearTimeout(handler);
        resolve(val);
      };
      type Payload = { path?: NodePath<TextNodes>; tDecl?: TDecl };
      const payload: Payload = {};
      const collect = (arg: Payload) => {
        Object.assign(payload, arg);
        if (
          typeof payload.path !== "undefined" &&
          typeof payload.tDecl !== "undefined"
        ) {
          self.pickElement(
            payload.path,
            payload.tDecl,
            selection,
            enhancedResolve
          );
        }
      };

      traverse(this.ast, {
        StringLiteral(path) {
          collect({ path });
        },
        JSXText(path) {
          collect({ path });
        },
        VariableDeclarator(path) {
          const tDecl = TDecl.from(path);
          if (tDecl) {
            collect({ tDecl });
          }
        },
      });
    });
  }
  private pickElement(
    path: NodePath<TextNodes>,
    tDecl: TDecl,
    selection: vscode.Selection,
    resolve: (value: TPair) => void
  ) {
    const tPath = new TPath(path);
    if (tPath.vscodeRange.contains(selection)) {
      resolve(new TPair(tPath, tDecl));
    }
  }
}

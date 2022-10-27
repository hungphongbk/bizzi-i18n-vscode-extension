import * as vscode from "vscode";
import { NodePath } from "@babel/traverse";
import { TextNodes } from "./types";

export default class TPath<
  T extends TextNodes = TextNodes
> extends NodePath<T> {
  constructor(path: NodePath<T>) {
    super(path.hub, path.parent);
    Object.assign(this, path);
  }

  get vscodeRange() {
    return new vscode.Range(
      this.node.loc!.start.line - 1,
      this.node.loc!.start.column,
      this.node.loc!.end.line - 1,
      this.node.loc!.end.column
    );
  }
}

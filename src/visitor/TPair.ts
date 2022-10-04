import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import TDecl from "./TDecl";
import TPath from "./TPath";
import * as t from "@babel/types";

const fs = vscode.workspace.fs;

export default class TPair {
  path: TPath;
  tDecl: TDecl;
  constructor(path: TPath, tDecl: TDecl) {
    this.path = path;
    this.tDecl = tDecl;
  }

  async getJsonFileUriFromTDecl(uri: URI): Promise<URI> {
    let jsonFileUri = Utils.joinPath(
      uri,
      `${this.tDecl.tLangSource}.lang.json`
    );
    try {
      await fs.stat(jsonFileUri);
    } catch {
      const moduleName = this.tDecl.tLangSource.split("/").pop();
      jsonFileUri = Utils.joinPath(
        uri,
        `${this.tDecl.tLangSource}/${moduleName}.lang.json`
      );
    }
    return jsonFileUri;
  }

  async replaceWithTKey(newKey: string): Promise<void> {
    const range = this.path.vscodeRange;

    const editor = vscode.window.activeTextEditor;
    await editor!.edit((edit) => {
      if (t.isJSXElement(this.path.parent)) {
        edit.replace(range, `{${this.tDecl.tVar}("${newKey}")}`);
      } else {
        edit.replace(range, `${this.tDecl.tVar}("${newKey}")`);
      }
    });
  }
}

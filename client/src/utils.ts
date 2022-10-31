import I18nLanguageClient from "i18n-client";
import * as vscode from "vscode";

const fs = vscode.workspace.fs;

export const THROTTLE_DELAY = 800;
export const EXT_NAMESPACE = "bizzi-i18n";

export const readFileAsUtf8 = async (file: vscode.Uri) => {
  const buf = await fs.readFile(file);
  return Buffer.from(buf).toString("utf8");
};

export const writeJson = async (file: vscode.Uri, json: object) => {
  const buf = Buffer.from(JSON.stringify(json, null, 2), "utf8");
  await fs.writeFile(file, buf);
};

export const getWorkspaceFolder = () =>
  vscode.workspace.getWorkspaceFolder(
    vscode.window.activeTextEditor!.document.uri
  )?.uri;

import { ExtensionContext, Disposable } from "vscode";

export interface ExtensionModule {
  (ctx: ExtensionContext, client: I18nLanguageClient): Disposable[];
}

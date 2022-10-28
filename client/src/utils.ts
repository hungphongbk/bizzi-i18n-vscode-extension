import * as vscode from "vscode";

const fs = vscode.workspace.fs;

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

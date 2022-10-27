import * as vscode from "vscode";

const fs = vscode.workspace.fs;

export const readFileAsUtf8 = async (file: vscode.Uri) => {
  const buf = await fs.readFile(file);
  return Buffer.from(buf).toString("utf8");
};

export const getWorkspaceFolder = () =>
  vscode.workspace.getWorkspaceFolder(
    vscode.window.activeTextEditor!.document.uri
  )?.uri;

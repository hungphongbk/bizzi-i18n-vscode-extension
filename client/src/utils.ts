import * as vscode from "vscode";

const fs = vscode.workspace.fs;

export const readFile = async (file: vscode.Uri) => {
  const buf = await fs.readFile(file);
  return Buffer.from(buf).toString("utf8");
};

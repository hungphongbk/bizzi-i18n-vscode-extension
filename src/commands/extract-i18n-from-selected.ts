import * as vscode from "vscode";

import { Utils } from "vscode-uri";
import I18nExtensionVisitor from "../visitor/I18nExtensionVisitor";

const fs = vscode.workspace.fs;

const readFile = async (file: vscode.Uri) => {
  const buf = await fs.readFile(file);
  return Buffer.from(buf).toString("utf8");
};

const readJson = async (file: vscode.Uri) => {
  return JSON.parse(await readFile(file));
};
const writeJson = async (file: vscode.Uri, json: object) => {
  const buf = Buffer.from(JSON.stringify(json, null, 2), "utf8");
  await fs.writeFile(file, buf);
};

export async function extractI18nFromSelected() {
  const editor = vscode.window.activeTextEditor;
  if (!editor?.selection) {
    return;
  }
  try {
    const pair = await I18nExtensionVisitor.instance.traverse(editor.selection);
    const selectedText = pair.path.node.value.trim();
    console.log(selectedText);

    const { uri: workspaceUri } = vscode.workspace.getWorkspaceFolder(
      editor.document.uri
    )!;

    const jsonFileUri = await pair.getJsonFileUriFromTDecl(workspaceUri);
    console.log(jsonFileUri.fsPath);

    const content = (await readJson(jsonFileUri)) as { [key: string]: any };
    console.log(content);

    const keyObj = Object.entries(content).filter(
      ([_, { vi }]) => vi === selectedText
    ) ?? [[]];
    const key = keyObj?.[0]?.[0];
    console.log(key);

    if (typeof key === "string") {
      await pair.replaceWithTKey(key);
    } else {
      const newKey = (await vscode.window.showInputBox({
        prompt: "Enter new key?",
      })) as string;
      content[newKey] = {
        vi: selectedText,
        en: selectedText,
      };
      //   content.en[newKey] = selectedText;
      //   content.vi[newKey] = selectedText;
      await writeJson(jsonFileUri, content);
      await pair.replaceWithTKey(newKey);
    }
  } catch (e) {
    console.error(e);
  }
}

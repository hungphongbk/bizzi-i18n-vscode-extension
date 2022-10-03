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
  const { node } = await I18nExtensionVisitor.instance.traverse(
    editor.selection
  );
  console.log(node);
  //   const selectedText = editor.document.getText(editor.selection);
  //   const fileUri = editor.document.uri;
  //   const moduleName = Utils.basename(fileUri);
  //   let jsonFileUri;
  //   try {
  //     jsonFileUri = Utils.joinPath(
  //       Utils.dirname(fileUri),
  //       `${moduleName}.lang.json`
  //     );
  //     await fs.stat(jsonFileUri);
  //   } catch {
  //     jsonFileUri = Utils.joinPath(
  //       Utils.dirname(fileUri),
  //       `${Utils.basename(fileUri).replace(/\.js/, "")}.lang.json`
  //     );
  //   }
  //   //   console.log(editor?.document.fileName);
  //   //   console.log(selectedText);

  //   const content = (await readJson(jsonFileUri)) as unknown as {
  //     vi: any;
  //     en: any;
  //   };

  //   const [key] =
  //     Object.entries(content.vi).filter(([_, val]) => val === selectedText)[0] ??
  //     [];

  //   const selectionToBeReplaced = editor.selection.with(
  //     editor.selection.start.translate(0, -1),
  //     editor.selection.end.translate(0, 1)
  //   );

  //   if (typeof key === "string") {
  //     await editor.edit((edit) => {
  //       edit.replace(selectionToBeReplaced, `t("${key}")`);
  //     });
  //   } else {
  //     const newKey = (await vscode.window.showInputBox({
  //       prompt: "Enter new key?",
  //     })) as string;
  //     content.en[newKey] = selectedText;
  //     content.vi[newKey] = selectedText;
  //     await writeJson(jsonFileUri, content);

  //     await editor.edit((edit) => {
  //       edit.replace(selectionToBeReplaced, `t("${newKey}")`);
  //     });
  // }
}

/* eslint-disable @typescript-eslint/naming-convention */
import traverse, { NodePath } from "@babel/traverse";
import { isJSXElement, JSXText, StringLiteral } from "@babel/types";
import Cache, { CacheValue } from "cache";
import { connection } from "connection";
import { UseTranslationReference } from "types";
import { checkPositionInsideLoc } from "utils";
import {
  Range,
  TextDocumentPositionParams,
  TextEdit,
  WorkspaceEdit,
} from "vscode-languageserver/node";
import { ExtensionRequestType } from "@shared";

type Selection = ReturnType<typeof Range.create>;
type ExtractI18nFromSelectedRequest = Pick<
  TextDocumentPositionParams,
  "textDocument"
> & {
  selection: Selection;
};

type LiteralNodePath = NodePath<StringLiteral | JSXText>;
function doTraverse(cached: CacheValue, selection: Selection) {
  return new Promise<LiteralNodePath | undefined>((resolve) => {
    if (cached && cached.languageId !== "json") {
      const pick = (path: LiteralNodePath) => {
        if (
          checkPositionInsideLoc(selection.start, path.node.loc!) &&
          checkPositionInsideLoc(selection.end, path.node.loc!)
        ) {
          resolve(path);
        }
      };
      traverse(cached?.ast, {
        StringLiteral: pick,
        JSXText: pick,
        noScope: true,
      });
      resolve(undefined);
    } else {
      resolve(undefined);
    }
  });
}
export async function extractI18nFromSelected({
  textDocument,
  selection,
}: ExtractI18nFromSelectedRequest): Promise<string[] | undefined> {
  console.time("extract");
  const cached = Cache.instance.get(textDocument.uri);
  if (!cached) {
    return;
  }
  const nodePath = await doTraverse(cached, selection);
  if (!nodePath) {
    return;
  }

  if (cached.languageId !== "json") {
    const langRefs = cached.ref;
    let langRef: UseTranslationReference;
    if (langRefs.length === 1) {
      langRef = langRefs[0];
    } else {
      langRef = langRefs[0];
    }

    const langFileRef = langRef.langJsonReference,
      langItemRef = langFileRef.findItemByText(nodePath.node.value);

    let extractedKey: string,
      isNewKey = false;
    if (!langItemRef) {
      isNewKey = true;
      extractedKey = await connection.sendRequest(
        ExtensionRequestType.extractRequireKeyName
      );
      // console.log(extractedKey);
    } else {
      extractedKey = langItemRef.key;
    }

    const edit: WorkspaceEdit = {
      changes: {},
    };

    if (isNewKey) {
      const json = { ...langFileRef.json } as any;
      json[extractedKey] = {
        vi: nodePath.node.value.trim(),
        en: nodePath.node.value.trim(),
      };

      edit.changes![langFileRef.uri] = [
        TextEdit.replace(
          Range.fromSourceLoc(langFileRef.loc),
          JSON.stringify(json, null, 2)
        ),
      ];
    }

    const jsxReplace = isJSXElement(nodePath.parent)
      ? `{${langRef.tVarName}("${extractedKey}")}`
      : `${langRef.tVarName}("${extractedKey}")`;

    edit.changes![textDocument.uri] = [
      TextEdit.replace(Range.fromSourceLoc(nodePath.node.loc!), jsxReplace),
    ];

    await connection.workspace.applyEdit(edit);
    console.timeEnd("extract");
    return Object.keys(edit.changes!).reverse();
  }

  console.timeEnd("exreact");
  return undefined;
}

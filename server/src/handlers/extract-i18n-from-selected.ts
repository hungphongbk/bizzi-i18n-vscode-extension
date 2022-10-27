import traverse, { NodePath } from "@babel/traverse";
import { JSXText, StringLiteral } from "@babel/types";
import Cache from "cache";
import { checkPositionInsideLoc } from "utils";
import { Range, TextDocumentPositionParams } from "vscode-languageserver/node";

type Selection = ReturnType<typeof Range.create>;
type ExtractI18nFromSelectedRequest = Pick<
  TextDocumentPositionParams,
  "textDocument"
> & {
  selection: Selection;
};

type LiteralNodePath = NodePath<StringLiteral | JSXText>;
function doTraverse(uri: string, selection: Selection) {
  const cached = Cache.instance.get(uri);
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
}: ExtractI18nFromSelectedRequest) {
  console.time("extract");
  await doTraverse(textDocument.uri, selection);
  console.timeEnd("extract");
}

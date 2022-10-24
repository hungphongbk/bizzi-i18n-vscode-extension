/* eslint-disable @typescript-eslint/naming-convention */
import {
  CancellationToken,
  Definition,
  DefinitionProvider,
  Location,
  LocationLink,
  Position,
  ProviderResult,
  Range,
  TextDocument,
  Uri,
  workspace,
} from "vscode";
import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { getJsonFileUriFromNs } from "../visitor/TPair";
import jsonParse, { ObjectNode } from "json-to-ast";
import { readFile } from "../utils";
const fs = workspace.fs;

class I18nDefinitionSearching {
  private workspaceUri: Uri;
  constructor(
    private readonly document: TextDocument,
    private readonly position: Position,
    token: CancellationToken,
    private readonly isTypescript: boolean
  ) {
    this.workspaceUri = workspace.getWorkspaceFolder(document.uri)!.uri;
  }

  get parserPlugins() {
    const plugins: parser.ParserPlugin[] = ["jsx"];
    if (this.isTypescript) {
      plugins.push(["typescript", {}]);
    }
    return plugins;
  }

  traverse(): Promise<Definition> {
    const self = this;
    const ast = parser.parse(this.document.getText(), {
      sourceType: "module",
      plugins: this.parserPlugins,
    });
    return new Promise<Definition>(async (resolve, reject) => {
      const handler = setTimeout(() => {
        reject(new Error("timeout"));
      }, 1000);
      const enhancedResolve: typeof resolve = (val) => {
        clearTimeout(handler);
        resolve(val);
      };
      const payload = { ns: "", tKey: "" };
      const collect = (arg: Partial<typeof payload>) => {
        Object.assign(payload, arg);
        if (payload.ns.length > 0 && payload.tKey.length > 0) {
          enhancedResolve(self.resolveTFuncSymbol(payload.ns, payload.tKey));
        }
      };
      traverse(ast, {
        StringLiteral(path) {
          console.log(path);
          const range = new Range(
            path.node.loc!.start.line - 1,
            path.node.loc!.start.column,
            path.node.loc!.end.line - 1,
            path.node.loc!.end.column
          );
          if (
            t.isCallExpression(path.parent) &&
            t.isIdentifier(path.parent.callee, { name: "useTranslation" })
          ) {
            if (range.contains(self.position)) {
              self.resolveUseTranslationSymbol(path.node.value).then(resolve);
              return;
            } else {
              collect({ ns: path.node.value });
            }
          }
          if (
            range.contains(self.position) &&
            t.isCallExpression(path.parent) &&
            t.isIdentifier(path.parent.callee, { name: "t" })
          ) {
            collect({ tKey: path.node.value });
          }
        },
      });
    });
  }

  private async resolveUseTranslationSymbol(ns: string): Promise<Definition> {
    const uri: Uri = await getJsonFileUriFromNs(this.workspaceUri, ns);
    return new Location(uri, new Range(0, 0, 0, 0));
  }

  private async resolveTFuncSymbol(
    ns: string,
    tKey: string
  ): Promise<Definition> {
    const uri: Uri = await getJsonFileUriFromNs(this.workspaceUri, ns);

    const jsonAst = jsonParse(await readFile(uri)) as ObjectNode,
      target = jsonAst.children.find(
        ({ key }) => t.isIdentifier(key) && key.value === tKey
      );

    if (target) {
      const loc = target.loc!;
      return new Location(
        uri,
        new Range(
          loc.start.line - 1,
          loc.start.column - 1,
          loc.end.line - 1,
          loc.end.column - 1
        )
      );
    }

    return [];
  }
}

export default class I18nDefinitionProvider implements DefinitionProvider {
  constructor(private readonly isTypescript: boolean) {}
  provideDefinition(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Definition | LocationLink[]> {
    const linePrefix = document
      .lineAt(position)
      .text.substring(0, position.character);
    if (!/(useTranslation|t)\(\"[A-Za-z0-9-_\.\{\/]*/.test(linePrefix)) {
      return [];
    }
    const search = new I18nDefinitionSearching(
      document,
      position,
      token,
      this.isTypescript
    );
    return search.traverse();
  }
}

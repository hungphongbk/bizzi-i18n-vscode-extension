/* eslint-disable @typescript-eslint/naming-convention */
import { CancellationToken, Definition, DefinitionProvider, Location, LocationLink, Position, ProviderResult, Range, TextDocument, Uri, workspace } from "vscode";
import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from '@babel/types';
import { getJsonFileUriFromNs } from "../visitor/TPair";

class I18nDefinitionSearching {
    private workspaceUri: Uri;
    constructor(private readonly document: TextDocument, private readonly position: Position, token: CancellationToken) {
        this.workspaceUri = workspace.getWorkspaceFolder(document.uri)!.uri;
    }
    traverse(): Promise<Definition> {
        const self = this;
        const ast = parser.parse(this.document.getText(), {
            sourceType: "module",
            plugins: ["jsx"],
        });
        return new Promise<Definition>(async (resolve, reject) => {
            const handler = setTimeout(() => {
                reject(new Error("timeout"));
            }, 1000);
            const enhancedResolve: typeof resolve = (val) => {
                clearTimeout(handler);
                resolve(val);
            };
            const payload = { ns: '', tKey: '' };
            const collect = (arg: Partial<typeof payload>) => {
                Object.assign(payload, arg);
                if (payload.ns.length > 0 && payload.tKey.length > 0) {
                    enhancedResolve(self.resolveTFuncSymbol(payload.ns, payload.tKey));
                }
            };
            traverse(ast, {
                StringLiteral(path) {
                    const range = new Range(
                        path.node.loc!.start.line - 1,
                        path.node.loc!.start.column,
                        path.node.loc!.end.line - 1,
                        path.node.loc!.end.column
                    );
                    if (t.isCallExpression(path.parent) && t.isIdentifier(path.parent.callee, { name: 'useTranslation' })) {
                        if (range.contains(self.position)) {
                            self.resolveUseTranslationSymbol(path.node.value).then(resolve);
                            return;
                        } else { collect({ ns: path.node.value }); }
                    }
                    if (range.contains(self.position) && t.isCallExpression(path.parent) && t.isIdentifier(path.parent.callee, { name: 't' })) {
                        collect({ tKey: path.node.value });
                    }
                }
            });
        });
    }

    private async resolveUseTranslationSymbol(ns: string): Promise<Definition> {
        const uri: Uri = await getJsonFileUriFromNs(this.workspaceUri, ns);
        return new Location(uri, new Range(0, 0, 0, 0));
    }

    private async resolveTFuncSymbol(ns: string, tKey: string): Promise<Definition> {
        // TODO
        return {} as unknown as Definition;
    }
}

export default class I18nDefinitionProvider implements DefinitionProvider {
    provideDefinition(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Definition | LocationLink[]> {
        const search = new I18nDefinitionSearching(document, position, token);
        return search.traverse();
    }
}
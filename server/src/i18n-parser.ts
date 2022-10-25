/* eslint-disable @typescript-eslint/naming-convention */
import traverse from '@babel/traverse';
import { parse } from '@typescript-eslint/typescript-estree';
import { Node } from '@babel/types';
// @ts-ignore
import toBabel from 'estree-to-babel';
import { Range } from 'vscode-languageserver';

export default function i18nTraverse(text: string) {
    const ast = toBabel(parse(text, { jsx: true })) as Node;
    traverse(ast, {
        StringLiteral(path) {
            const range = Range.create(
                path.node.loc!.start.line - 1,
                path.node.loc!.start.column,
                path.node.loc!.end.line - 1,
                path.node.loc!.end.column
            );
        }
    });
}
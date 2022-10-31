import { NodePath } from "@babel/traverse";
import {
  CallExpression,
  Identifier,
  isCallExpression,
  isIdentifier,
  isObjectPattern,
  isObjectProperty,
  isStringLiteral,
  ObjectPattern,
  ObjectProperty,
  StringLiteral,
  VariableDeclarator,
  SourceLocation,
} from "@babel/types";
import Cache from "./cache";
import { connection } from "./connection";
import { ExtensionRequestType, GetJsonRequestPayload } from "@shared";
import { langJsonTraverse } from "i18n-parser";
import { LiteralNode, ObjectNode, PropertyNode } from "json-to-ast";

interface UseTranslationCallExpression extends CallExpression {
  callee: Identifier;
  arguments: [StringLiteral];
}
interface UseTranslationDeclarator extends VariableDeclarator {
  init: UseTranslationCallExpression;
  id: Omit<ObjectPattern, "properties"> & {
    properties: [
      Omit<ObjectProperty, "value"> & {
        value: Identifier;
      }
    ];
  };
}
interface TFuncCallExpression extends CallExpression {
  callee: Identifier;
  arguments: [StringLiteral];
}
declare module "@babel/traverse" {
  interface NodePath {
    isUseTranslationDeclarator(): this is NodePath<UseTranslationDeclarator>;
    isTFuncCallExpression(): this is NodePath<TFuncCallExpression>;
  }
}
NodePath.prototype.isUseTranslationDeclarator = function () {
  return (
    this.isVariableDeclarator() &&
    // check call expression
    isCallExpression(this.node.init) &&
    isIdentifier(this.node.init.callee, { name: "useTranslation" }) &&
    this.node.init.arguments.length === 1 &&
    isStringLiteral(this.node.init.arguments[0]) &&
    // check tVar destruct must be like { t }
    isObjectPattern(this.node.id) &&
    isObjectProperty(this.node.id.properties[0]) &&
    isIdentifier(this.node.id.properties[0].key, { name: "t" }) &&
    isIdentifier(this.node.id.properties[0].value) &&
    /^t/.test(this.node.id.properties[0].value.name)
  );
};
NodePath.prototype.isTFuncCallExpression = function () {
  return (
    this.isCallExpression() &&
    isIdentifier(this.node.callee) &&
    /^t/.test(this.node.callee.name) &&
    isStringLiteral(this.node.arguments[0])
  );
};

export abstract class LocBased {
  constructor(public readonly loc: SourceLocation) {}
}

export class UseTranslationReference extends LocBased {
  static getFromStringLiteralNodePath(
    path: NodePath<UseTranslationDeclarator>
  ) {
    const ns = path.node.init.arguments[0].value;
    const tVarName = path.node.id.properties[0].value.name;
    return new UseTranslationReference(
      path.node.init.arguments[0].loc!,
      ns,
      tVarName
    );
  }

  tFuncReferences: UseTFuncReference[] = [];
  langJsonReference!: LangJsonReference;
  private _jsonFileUri: string = "";

  constructor(
    loc: SourceLocation,
    public readonly ns: string,
    public readonly tVarName: string
  ) {
    super(loc);
  }

  get jsonFileUri() {
    return this._jsonFileUri;
  }

  addTFuncReferenceFromNodePath(
    path: NodePath<TFuncCallExpression>
  ): UseTFuncReference {
    const ref = UseTFuncReference.getFromStringLiteralNodePath(path, this);
    this.tFuncReferences.push(ref);
    return ref;
  }

  async fetchJsonFileUri() {
    this._jsonFileUri = await connection.sendRequest(
      ExtensionRequestType.getJsonFileFromNs,
      this.ns
    );
    const { jsonRef, ...payload } = await langJsonTraverse(this._jsonFileUri);
    Cache.instance.set(this._jsonFileUri, {
      languageId: "json",
      ref: jsonRef,
      ...payload,
    });
    this.langJsonReference = jsonRef;
  }
}

export class UseTFuncReference extends LocBased {
  static getFromStringLiteralNodePath(
    path: NodePath<TFuncCallExpression>,
    useTranslationRef: UseTranslationReference
  ) {
    const { node } = path;
    const key = node.arguments[0].value,
      loc = node.arguments[0].loc!,
      tVarName = node.callee.name,
      fnLoc = node.loc!;

    return new UseTFuncReference(loc, key, tVarName, useTranslationRef, fnLoc);
  }
  constructor(
    loc: SourceLocation,
    public readonly key: string,
    public readonly tVarName: string,
    public readonly useTranslationRef: UseTranslationReference,
    public readonly fnLoc: SourceLocation
  ) {
    super(loc);
  }

  get langJsonRef(): LangJsonReference {
    return this.useTranslationRef.langJsonReference;
  }

  get langJsonItemRef(): LangJsonItemReference | undefined {
    return this.langJsonRef.findItemByKey(this.key);
  }

  lang(lang: string): string | null | undefined {
    return this.langJsonItemRef?.lang(lang);
  }
}

export class LangJsonReference extends LocBased {
  items: LangJsonItemReference[] = [];
  constructor(
    private readonly node: ObjectNode,
    public readonly uri: string,
    readonly json: object
  ) {
    super(node.loc!);
    this.items = node.children.map((p) => new LangJsonItemReference(p, this));
  }

  findItemByKey(key: string) {
    return this.items.find((i) => i.key === key);
  }

  findItemByText(text: string, lang: string = "vi") {
    return this.items.find((i) => i.lang(lang)?.trim() === text.trim());
  }
}

export class LangJsonItemReference extends LocBased {
  constructor(
    private readonly node: PropertyNode,
    readonly parent: LangJsonReference
  ) {
    super(node.loc!);
  }

  get key(): string {
    return this.node.key.value;
  }

  lang(lang: string): string | null | undefined {
    return (
      (this.node.value as ObjectNode).children.find((p) => p.key.value === lang)
        ?.value as LiteralNode | undefined
    )?.value as string | null | undefined;
  }
}

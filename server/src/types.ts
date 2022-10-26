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

  private tFuncReferences: UseTFuncReference[] = [];
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
    this._jsonFileUri = await connection.sendRequest("getJsonFile", this.ns);
    console.log(this._jsonFileUri);
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
      tVarName = node.callee.name;

    return new UseTFuncReference(loc, key, tVarName, useTranslationRef);
  }
  constructor(
    loc: SourceLocation,
    public readonly key: string,
    public readonly tVarName: string,
    public readonly useTranslationRef: UseTranslationReference
  ) {
    super(loc);
  }
}

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

abstract class LocBased {
  constructor(public readonly loc: SourceLocation) {}
}

export class UseTranslationReference extends LocBased {
  static getFromStringLiteralNodePath(
    path: NodePath<UseTranslationDeclarator>
  ) {
    const ns = path.node.init.arguments[0].value;
    const tVarName = path.node.id.properties[0].value.name;
    return new UseTranslationReference(
      path.node.id.properties[0].value.loc!,
      ns,
      tVarName
    );
  }

  constructor(
    loc: SourceLocation,
    public readonly ns: string,
    public readonly tVarName: string
  ) {
    super(loc);
    Cache.instance.connection.console.log(`${ns} ${tVarName}`);
  }
}

export class UseTFuncReference extends LocBased {
  static getFromStringLiteralNodePath(path: NodePath<TFuncCallExpression>) {
    const { node } = path;
    const key = node.arguments[0].value,
      loc = node.arguments[0].loc!,
      tVarName = node.callee.name;

    return new UseTFuncReference(loc, key, tVarName);
  }
  constructor(
    loc: SourceLocation,
    public readonly key: string,
    public readonly tVarName: string
  ) {
    super(loc);
  }
}

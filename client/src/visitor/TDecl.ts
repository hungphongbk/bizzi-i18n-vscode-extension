import { NodePath } from "@babel/traverse";
import {
  VariableDeclarator,
  ObjectProperty,
  Identifier,
  StringLiteral,
} from "@babel/types";

export default class TDecl extends NodePath<VariableDeclarator> {
  static from(path: NodePath<VariableDeclarator>): TDecl | undefined {
    const {
      node: { init },
    } = path;
    if (
      init?.type === "CallExpression" &&
      init.callee?.type === "Identifier" &&
      init.callee.name === "useTranslation" &&
      (path.get("init.arguments.0") as NodePath | undefined)?.type ===
        "StringLiteral"
    ) {
      return new TDecl(path);
    }
    return undefined;
  }
  protected constructor(path: NodePath<VariableDeclarator>) {
    super(path.hub, path.parent);
    Object.assign(this, path);
  }

  get tVar(): string {
    const id = this.node.id;
    switch (id.type) {
      case "ObjectPattern": {
        const prop = id.properties[0] as ObjectProperty;
        return (prop.value as Identifier).name;
      }
      default:
        return "";
    }
  }

  get tLangSource(): string {
    return (this.get("init.arguments.0") as NodePath<StringLiteral>).node.value;
  }
}

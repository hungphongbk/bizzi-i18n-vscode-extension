import { NodePath } from "@babel/traverse";
import { StringLiteral } from "@babel/types";

export class UseTranslationReference {
  constructor(public readonly path: NodePath<StringLiteral>) {}

  get ns() {
    return this.path.node.value;
  }
}

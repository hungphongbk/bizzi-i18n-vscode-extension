import { SourceLocation } from "@babel/types";
import { Position, Range } from "vscode-languageserver/node";

export function checkPositionInsideLoc(
  position: Position,
  loc: SourceLocation
): boolean {
  if (position.line < loc.start.line - 1 || position.line > loc.end.line - 1) {
    return false;
  }
  if (
    position.line === loc.start.line - 1 &&
    position.character < loc.start.column - 1
  ) {
    return false;
  }
  if (
    position.line === loc.end.line - 1 &&
    position.character > loc.end.column - 1
  ) {
    return false;
  }
  return true;
}

declare module "vscode-languageserver/node" {
  namespace Range {
    function fromSourceLoc(loc: SourceLocation): Range;
  }
}
Object.defineProperty(Range, "fromSourceLoc", {
  get() {
    return (loc: SourceLocation) => {
      return Range.create(
        loc.start.line - 1,
        loc.start.column - 1,
        loc.end.line - 1,
        loc.end.column - 1
      );
    };
  },
});

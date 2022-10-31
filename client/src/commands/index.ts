import { flatten } from "lodash";
import { ExtensionModule } from "utils";
import configLanguages from "./configLanguages";

export * from "./commands";

const commands: ExtensionModule = (ctx, client) =>
  flatten([configLanguages(ctx, client)]);

export default commands;

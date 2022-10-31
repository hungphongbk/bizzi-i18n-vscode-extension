import { flatten } from "lodash";
import { ExtensionModule } from "utils";
import configLanguages from "./configLanguages";

export * from "./commands";

const commandModule: ExtensionModule = (ctx, client) =>
  flatten([configLanguages(ctx, client)]);

export default commandModule;

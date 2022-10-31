import flatten from "lodash/flatten";
import { ExtensionModule } from "utils";
import { Config } from "./config";

const coreModule: ExtensionModule = (ctx, client) =>
  flatten([Config.disposables]);

export default coreModule;

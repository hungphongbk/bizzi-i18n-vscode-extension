import { flatten } from "lodash";
import { ExtensionModule } from "utils";
import annotation from "./annotation";
import statusBar from "./statusbar";

const uiModule: ExtensionModule = (ctx, client) =>
  flatten([annotation(ctx, client), statusBar(ctx, client)]);

export default uiModule;

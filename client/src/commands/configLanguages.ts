/* eslint-disable @typescript-eslint/naming-convention */
import { Config } from "core/config";
import { ExtensionModule } from "utils";
import { commands, window } from "vscode";
import { Commands } from "./commands";

const availableLocales = {
  Vietnam: "vi",
  English: "en",
  "Turn Off": "",
} as const;

async function pickLocale(locale: any) {
  if (locale && locale.node && locale.node.locale) {
    return locale.node.locale as string;
  }
  if (locale && typeof locale === "string") {
    return locale;
  }
  const placeHolder = "Select display language";
  const result = await window.showQuickPick(Object.keys(availableLocales), {
    placeHolder,
  });

  if (typeof result === "undefined") {
    return undefined;
  }
  if (result !== placeHolder) {
    // @ts-ignore
    return availableLocales[result];
  }
  return "";
}

async function handler(options?: any) {
  const locale = await pickLocale(options);
  if (typeof locale === "string") {
    Config.displayLanguage = locale;
  }
}

export default <ExtensionModule>function configLanguagesCommands(ctx) {
  return [commands.registerCommand(Commands.configDisplayLanguage, handler)];
};

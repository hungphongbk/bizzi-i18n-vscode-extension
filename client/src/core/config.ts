import { EXT_NAMESPACE } from "utils";
import { EventEmitter, ExtensionContext, workspace } from "vscode";

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
const refreshConfigs = ["displayLanguage"] as const;

export class Config {
  static ctx: ExtensionContext;

  private static $event = Object.fromEntries(
    refreshConfigs.map((name) => [name, new EventEmitter<void>()])
  ) as Record<ArrayElement<typeof refreshConfigs>, EventEmitter<unknown>>;
  // private static _onDidChangeDisplayLanguage;
  static disposables = [
    workspace.onDidChangeConfiguration((e) => {
      for (const key of refreshConfigs) {
        if (e.affectsConfiguration(`${EXT_NAMESPACE}.${key}`)) {
          this.$event[key].fire(null);
        }
      }
    }),
  ];

  static get displayLanguage(): string {
    return Config.getConfig<string>("displayLanguage") ?? "vi";
  }
  static set displayLanguage(value) {
    this.setConfig("displayLanguage", value, true);
  }
  static onDidChangeDisplayLanguage(cb: () => unknown | Promise<unknown>) {
    this.disposables.push(this.$event["displayLanguage"].event(cb));
  }

  private static getConfig<T = any>(key: string): T | undefined {
    let config = workspace.getConfiguration(EXT_NAMESPACE).get<T>(key);

    return config;
  }

  private static async setConfig(key: string, value: any, isGlobal = false) {
    // update value
    return await workspace
      .getConfiguration(EXT_NAMESPACE)
      .update(key, value, isGlobal);
  }
}

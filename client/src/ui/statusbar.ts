import { Commands } from "commands";
import { Config } from "core/config";
import { ExtensionModule } from "utils";
import { Disposable, StatusBarAlignment, window } from "vscode";

const statusBar: ExtensionModule = () => {
  const disposables: Disposable[] = [];

  const priority = -1000;
  const toggleLangButton = window.createStatusBarItem(
    StatusBarAlignment.Right,
    priority + 1
  );

  function update() {
    const displayLanguage = Config.displayLanguage;
    const text =
      displayLanguage.length === 0
        ? `$(eye-closed)`
        : `$(eye) ${displayLanguage.toUpperCase()}`;

    try {
      toggleLangButton.text = text;
      toggleLangButton.command = Commands.configDisplayLanguage;
      toggleLangButton.tooltip = "Switch display language";
      toggleLangButton.show();
    } catch (e) {
      toggleLangButton.hide();
    }
  }
  Config.onDidChangeDisplayLanguage(() => update());

  update();

  return disposables;
};

export default statusBar;

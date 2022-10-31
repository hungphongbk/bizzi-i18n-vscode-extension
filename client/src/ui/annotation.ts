import { Config } from "core/config";
import throttle from "lodash/throttle";
import { ExtensionModule, THROTTLE_DELAY } from "utils";
import {
  DecorationOptions,
  Disposable,
  languages,
  Range,
  TextDocument,
  TextEditor,
  window,
  workspace,
} from "vscode";
import { ExtensionRequestType } from "../../../shared/enums";
import { isTypescript } from "../../../shared/utils";

const annotation: ExtensionModule = (ctx, client) => {
  console.log("active annotations");
  // eslint-disable-next-line @typescript-eslint/naming-convention
  let _current_doc: TextDocument | undefined;

  const annotationTypes = {
    none: window.createTextEditorDecorationType({}),
    disappear: window.createTextEditorDecorationType({
      textDecoration: "none; display: none;", // a hack to inject custom style
    }),
  };

  const setDecorations = (
    annotations: DecorationOptions[],
    editor: TextEditor
  ) => {
    editor.setDecorations(annotationTypes.none, annotations);
    editor.setDecorations(
      annotationTypes.disappear,
      annotations.map(({ range }) => ({ range }))
    );
  };

  function clear() {
    const editor = window.activeTextEditor;
    if (editor) {
      editor.setDecorations(annotationTypes.none, []);
      editor.setDecorations(annotationTypes.disappear, []);
    }
  }

  async function refresh() {
    const editor = window.activeTextEditor;
    const document = editor?.document;

    if (!editor || !document || _current_doc !== document) {
      return;
    }
    if (Config.displayLanguage.length === 0) {
      return clear();
    }

    const response = (
      (await client.sendRequest(ExtensionRequestType.annotationRequest, {
        documentUri: document.uri.toString(),
        lang: Config.displayLanguage,
      })) as any[]
    ).map((i) => ({
      ...i,
      range: new Range(
        i.range.start.line,
        i.range.start.character,
        i.range.end.line,
        i.range.end.character
      ),
    }));
    setDecorations(response, editor);
  }
  async function update() {
    _current_doc = undefined;
    const document = window.activeTextEditor?.document;

    if (!document) {
      return;
    }
    console.log(document.languageId);
    if (!isTypescript(document.languageId)) {
      return;
    }
    _current_doc = document;
    await refresh();
  }

  const throttleUpdate = throttle(update, THROTTLE_DELAY);

  const disposables: Disposable[] = [];
  Config.onDidChangeDisplayLanguage(throttleUpdate);
  window.onDidChangeActiveTextEditor(throttleUpdate, null, disposables);
  workspace.onDidChangeTextDocument(
    (e) => {
      if (e.document === window.activeTextEditor?.document) {
        _current_doc = undefined;
        throttleUpdate();
      }
    },
    null,
    disposables
  );
  update();
  return disposables;
};

export default annotation;

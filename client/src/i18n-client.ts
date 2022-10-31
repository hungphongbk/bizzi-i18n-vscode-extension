import path from "path";
import { ExtensionContext, Uri, window, workspace } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { ExtensionRequestType } from "@shared";
import { getWorkspaceFolder } from "utils";
import getLangJsonFile from "handler/read-lang-json";

const requestMap = new Map<ExtensionRequestType, any>();
function request(_: any, propertyName: string, descriptor: PropertyDescriptor) {
  requestMap.set(
    propertyName as unknown as ExtensionRequestType,
    descriptor.value
  );
}

export default class I18nLanguageClient extends LanguageClient {
  constructor(context: ExtensionContext) {
    const serverModule = context.asAbsolutePath(
      path.join("server", "out", "server.js")
    );
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: {
        module: serverModule,
        transport: TransportKind.ipc,
        options: debugOptions,
      },
    };

    // Options to control the language clients
    const clientOptions: LanguageClientOptions = {
      // Register the server for plain text documents
      documentSelector: [
        ...[
          "javascript",
          "javascriptreact",
          "typescript",
          "typescriptreact",
        ].map((language) => ({ scheme: "file", language })),
        { scheme: "file", language: "json", pattern: "**/*.lang.json" },
      ],
      markdown: {
        isTrusted: true,
        supportHtml: true,
      },
    };
    super(
      "bizzi-i18n-server",
      "Bizzi I18n Server",
      serverOptions,
      clientOptions
    );

    requestMap.forEach((val, key) => {
      this.onRequest(key, val);
    });
  }

  @request
  async [ExtensionRequestType.getJsonFileFromNs](ns: string) {
    let uri: Uri | undefined = undefined;
    const rootUri = getWorkspaceFolder();
    try {
      uri = Uri.joinPath(rootUri!, `${ns}.lang.json`);
      await workspace.fs.stat(uri);
    } catch (e) {
      uri = Uri.joinPath(
        rootUri!,
        `${ns + "/" + ns.substring(ns.lastIndexOf("/"))}.lang.json`
      );
    }

    return uri.toString();
  }

  @request
  [ExtensionRequestType.readJsonFile](uri: string) {
    return getLangJsonFile(uri);
  }

  @request
  async [ExtensionRequestType.extractRequireKeyName]() {
    return await window.showInputBox({ prompt: "Enter new key?" });
  }
}

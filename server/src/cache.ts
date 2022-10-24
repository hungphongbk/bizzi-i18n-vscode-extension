import { Connection } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { makeAutoObservable, autorun } from "mobx";

export default class Cache {
  static instance: Cache;
  static initialize(connection: Connection) {
    this.instance = new Cache(connection);
    console.log("server initialized");

    autorun(() => {
      const connection = this.instance.connection;
      connection.console.log("cache changed");
      connection.console.log(this.instance.cache.size + "");
    });
  }

  private readonly _cache: Map<
    string,
    {
      document: TextDocument;
    }
  > = new Map();
  private constructor(private readonly _connection: Connection) {
    makeAutoObservable(this);
  }

  get cache() {
    return this._cache;
  }
  get connection() {
    return this._connection;
  }

  set(
    key: string,
    payload: {
      document: TextDocument;
    }
  ) {
    this._cache.set(key, payload);
  }
}

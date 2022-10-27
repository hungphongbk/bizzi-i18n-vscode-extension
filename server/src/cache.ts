import { Connection } from "vscode-languageserver/node";
import { makeAutoObservable, autorun } from "mobx";
import { LangJsonReference, LocBased, UseTranslationReference } from "./types";
import { Node } from "@babel/types";
import { ObjectNode } from "json-to-ast";

type CacheValue = (
  | {
      languageId:
        | "javascript"
        | "javascriptreact"
        | "typescript"
        | "typescriptreact";
      ref: UseTranslationReference[];
      ast: Node;
    }
  | {
      languageId: "json";
      ref: LangJsonReference;
      ast: ObjectNode;
    }
) & {
  locList: LocBased[];
};

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

  private readonly _cache: Map<string, CacheValue> = new Map();
  private constructor(private readonly _connection: Connection) {
    makeAutoObservable(this);
  }

  get cache() {
    return this._cache;
  }
  get connection() {
    return this._connection;
  }

  set(key: string, payload: CacheValue) {
    this._cache.set(key, payload);
  }
  get(key: string) {
    return this._cache.get(key);
  }
}

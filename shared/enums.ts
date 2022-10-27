export enum ExtensionRequestType {
  getJsonFileFromNs = "getJsonFileFromNs",
  readJsonFile = "readJsonFile",
  extractI18nFromSelected = "extractI18nFromSelected",
}
export type GetJsonRequestPayload = {
  ns: string;
};

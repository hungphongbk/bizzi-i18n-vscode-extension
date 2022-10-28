export enum ExtensionRequestType {
  getJsonFileFromNs = "getJsonFileFromNs",
  readJsonFile = "readJsonFile",
  extractI18nFromSelected = "extract/I18nFromSelected",
  extractRequireKeyName = "extract/requireKeyName",
}
export type GetJsonRequestPayload = {
  ns: string;
};

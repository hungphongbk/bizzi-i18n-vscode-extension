export enum ExtensionRequestType {
  getJsonFileFromNs = "getJsonFileFromNs",
  readJsonFile = "readJsonFile",
}
export type GetJsonRequestPayload = {
  ns: string;
};

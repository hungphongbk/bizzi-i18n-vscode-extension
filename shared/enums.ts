export enum ExtensionRequestType {
  getJsonFileFromNs = "getJsonFileFromNs",
  readJsonFile = "readJsonFile",
  extractI18nFromSelected = "extract/I18nFromSelected",
  extractRequireKeyName = "extract/requireKeyName",
  annotationRequest = "annotation/request",
}
export type GetJsonRequestPayload = {
  ns: string;
};

export const predefinedLanguages = {
  vi: { label: "Vietnam" },
  en: { label: "English" },
} as Record<string, { label: string }>;

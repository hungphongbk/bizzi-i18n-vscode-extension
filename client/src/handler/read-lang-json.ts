import { readFileAsUtf8 } from "utils";
import { Uri } from "vscode";

export default async function getLangJsonFile(uri: string) {
  return await readFileAsUtf8(Uri.parse(uri));
}

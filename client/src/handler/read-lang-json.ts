import { getWorkspaceFolder, readFileAsUtf8 } from "utils";
import { RelativePattern, Uri, workspace } from "vscode";

export default async function getLangJsonFile(uri: string) {
  return await readFileAsUtf8(Uri.parse(uri));
}

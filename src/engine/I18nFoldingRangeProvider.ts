import {
  CancellationToken,
  Event,
  FoldingContext,
  FoldingRange,
  FoldingRangeProvider,
  ProviderResult,
  TextDocument,
} from "vscode";

export default class I18nFoldingRangeProvider implements FoldingRangeProvider {
  onDidChangeFoldingRanges?: Event<void> | undefined;
  provideFoldingRanges(
    document: TextDocument,
    context: FoldingContext,
    token: CancellationToken
  ): ProviderResult<FoldingRange[]> {
    throw new Error("Method not implemented.");
  }
}

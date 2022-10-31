import { predefinedLanguages } from "./enums";

export function renderMarkdown(content: Record<string, string | undefined>) {
  console.log(content);
  return [
    `| | |`,
    `|-|-|`,
    ...Object.entries(content).map(
      ([lang, langContent]) =>
        `| <code><span style="color:#4ec9b0;">${
          predefinedLanguages[lang].label
        }</span></code> | <code>${
          langContent
            ? `<span>${langContent}</span>`
            : '<span style="color:#fff7;">undefined</i>'
        }</code> |`
    ),
  ].join("\n");
}

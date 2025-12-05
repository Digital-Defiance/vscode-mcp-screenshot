import {
  SemanticTokensBuilder,
  SemanticTokens,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

export const tokenTypes = ["function", "keyword", "string"];
export const tokenModifiers = ["declaration"];

/**
 * Provide semantic tokens for screenshot code
 */
export function getSemanticTokens(document: TextDocument): SemanticTokens {
  const builder = new SemanticTokensBuilder();
  const text = document.getText();
  const lines = text.split("\n");

  lines.forEach((line, lineIndex) => {
    // Highlight screenshot functions
    const funcMatch = line.match(/\b(capture\w+|list\w+)\b/g);
    if (funcMatch) {
      funcMatch.forEach((func) => {
        const index = line.indexOf(func);
        if (index !== -1) {
          builder.push(lineIndex, index, func.length, 0, 0); // function token
        }
      });
    }

    // Highlight PII-sensitive keywords
    if (line.includes("enablePIIMasking")) {
      const index = line.indexOf("enablePIIMasking");
      builder.push(lineIndex, index, "enablePIIMasking".length, 1, 0); // keyword token
    }
  });

  return builder.build();
}

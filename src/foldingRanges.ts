import { FoldingRange, FoldingRangeKind } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

/**
 * Provide folding ranges for screenshot code
 */
export function getFoldingRanges(document: TextDocument): FoldingRange[] {
  const ranges: FoldingRange[] = [];
  const text = document.getText();
  const lines = text.split("\n");

  let captureBlockStart = -1;
  let configStart = -1;

  lines.forEach((line, index) => {
    // Fold capture operations
    if (line.match(/capture(Full|Window|Region)/)) {
      captureBlockStart = index;
    } else if (captureBlockStart !== -1 && line.includes(");")) {
      ranges.push({ startLine: captureBlockStart, endLine: index, kind: FoldingRangeKind.Region });
      captureBlockStart = -1;
    }

    // Fold config objects - look for opening brace
    if (line.includes("{") && !line.includes("}")) {
      configStart = index;
    } else if (configStart !== -1 && line.includes("}")) {
      ranges.push({ startLine: configStart, endLine: index });
      configStart = -1;
    }
  });

  return ranges;
}

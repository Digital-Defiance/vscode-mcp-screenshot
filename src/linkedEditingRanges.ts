import { LinkedEditingRanges, Range } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

/**
 * Provide linked editing ranges for simultaneous editing
 */
export function getLinkedEditingRanges(document: TextDocument, position: { line: number; character: number }): LinkedEditingRanges | null {
  const text = document.getText();
  const lines = text.split("\n");
  const line = lines[position.line];

  // Find format variable
  const formatMatch = line.match(/\b(format\w*)\b/);
  if (formatMatch) {
    const varName = formatMatch[1];
    const ranges: Range[] = [];

    lines.forEach((l, idx) => {
      const regex = new RegExp(`\\b${varName}\\b`, "g");
      let match;
      while ((match = regex.exec(l)) !== null) {
        ranges.push(Range.create(idx, match.index, idx, match.index + varName.length));
      }
    });

    return ranges.length > 1 ? { ranges } : null;
  }

  return null;
}

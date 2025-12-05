import { SelectionRange, Position } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

/**
 * Provide selection ranges for smart selection
 */
export function getSelectionRanges(document: TextDocument, positions: Position[]): SelectionRange[] {
  return positions.map((pos) => {
    const line = document.getText({ start: { line: pos.line, character: 0 }, end: { line: pos.line + 1, character: 0 } });
    
    // Find screenshot function call
    const funcMatch = line.match(/\b(capture\w+|list\w+)\s*\(/);
    if (funcMatch) {
      const start = line.indexOf(funcMatch[0]);
      const end = line.indexOf(")", start) + 1;
      
      return {
        range: { start: { line: pos.line, character: start }, end: { line: pos.line, character: end } },
        parent: { range: { start: { line: pos.line, character: 0 }, end: { line: pos.line, character: line.length } } },
      };
    }

    return { range: { start: pos, end: pos } };
  });
}

import {
  DocumentSymbol,
  SymbolKind,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

/**
 * Provide document symbols for screenshot code
 */
export function getDocumentSymbols(document: TextDocument): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  const text = document.getText();
  const lines = text.split("\n");

  lines.forEach((line, lineIndex) => {
    const range = Range.create(lineIndex, 0, lineIndex, line.length);

    // Full screen captures
    if (line.includes("captureFullScreen")) {
      symbols.push({
        name: "Capture Full Screen",
        kind: SymbolKind.Function,
        range,
        selectionRange: range,
      });
    }

    // Window captures
    if (line.includes("captureWindow")) {
      symbols.push({
        name: "Capture Window",
        kind: SymbolKind.Function,
        range,
        selectionRange: range,
      });
    }

    // Region captures
    if (line.includes("captureRegion")) {
      symbols.push({
        name: "Capture Region",
        kind: SymbolKind.Function,
        range,
        selectionRange: range,
      });
    }

    // List operations
    if (line.includes("listDisplays")) {
      symbols.push({
        name: "List Displays",
        kind: SymbolKind.Method,
        range,
        selectionRange: range,
      });
    }

    if (line.includes("listWindows")) {
      symbols.push({
        name: "List Windows",
        kind: SymbolKind.Method,
        range,
        selectionRange: range,
      });
    }
  });

  return symbols;
}

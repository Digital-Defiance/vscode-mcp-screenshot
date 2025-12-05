import { CallHierarchyItem, CallHierarchyIncomingCall, CallHierarchyOutgoingCall, SymbolKind, Range } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

/**
 * Prepare call hierarchy for screenshot functions
 */
export function prepareCallHierarchy(document: TextDocument, position: { line: number; character: number }): CallHierarchyItem[] | null {
  const line = document.getText({ start: { line: position.line, character: 0 }, end: { line: position.line + 1, character: 0 } });
  
  const funcMatch = line.match(/\b(capture\w+|list\w+)\b/);
  if (funcMatch) {
    const func = funcMatch[1];
    const start = line.indexOf(func);
    
    return [{
      name: func,
      kind: SymbolKind.Function,
      uri: document.uri,
      range: Range.create(position.line, start, position.line, start + func.length),
      selectionRange: Range.create(position.line, start, position.line, start + func.length),
    }];
  }

  return null;
}

/**
 * Get incoming calls
 */
export function getIncomingCalls(item: CallHierarchyItem): CallHierarchyIncomingCall[] {
  return [];
}

/**
 * Get outgoing calls
 */
export function getOutgoingCalls(item: CallHierarchyItem): CallHierarchyOutgoingCall[] {
  const dependencies: Record<string, string[]> = {
    captureFull: ["listDisplays"],
    captureWindow: ["listWindows"],
    captureRegion: ["listDisplays"],
  };

  const calls: CallHierarchyOutgoingCall[] = [];
  const deps = dependencies[item.name] || [];

  deps.forEach((dep) => {
    calls.push({
      to: {
        name: dep,
        kind: SymbolKind.Function,
        uri: item.uri,
        range: item.range,
        selectionRange: item.selectionRange,
      },
      fromRanges: [item.range],
    });
  });

  return calls;
}

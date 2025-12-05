import { TypeHierarchyItem, SymbolKind, Range } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

/**
 * Prepare type hierarchy for screenshot types
 */
export function prepareTypeHierarchy(document: TextDocument, position: { line: number; character: number }): TypeHierarchyItem[] | null {
  const line = document.getText({ start: { line: position.line, character: 0 }, end: { line: position.line + 1, character: 0 } });
  
  const types = ["CaptureConfig", "Display", "Window", "Region"];
  
  for (const type of types) {
    if (line.includes(type)) {
      const start = line.indexOf(type);
      return [{
        name: type,
        kind: SymbolKind.Interface,
        uri: document.uri,
        range: Range.create(position.line, start, position.line, start + type.length),
        selectionRange: Range.create(position.line, start, position.line, start + type.length),
      }];
    }
  }

  return null;
}

/**
 * Get supertypes
 */
export function getSupertypes(item: TypeHierarchyItem): TypeHierarchyItem[] {
  const hierarchy: Record<string, string> = {
    CaptureConfig: "Object",
    Display: "Object",
    Window: "Object",
    Region: "Object",
  };

  const parent = hierarchy[item.name];
  if (parent) {
    return [{
      name: parent,
      kind: SymbolKind.Class,
      uri: item.uri,
      range: item.range,
      selectionRange: item.selectionRange,
    }];
  }

  return [];
}

/**
 * Get subtypes
 */
export function getSubtypes(item: TypeHierarchyItem): TypeHierarchyItem[] {
  const hierarchy: Record<string, string[]> = {
    Object: ["CaptureConfig", "Display", "Window", "Region"],
  };

  const children = hierarchy[item.name] || [];
  return children.map((child) => ({
    name: child,
    kind: SymbolKind.Interface,
    uri: item.uri,
    range: item.range,
    selectionRange: item.selectionRange,
  }));
}

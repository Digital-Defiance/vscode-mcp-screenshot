import * as assert from 'assert';
import { SymbolKind } from 'vscode-languageserver/node';
import { getDocumentColors, getColorPresentations } from '../../colorProvider';
import { getFoldingRanges } from '../../foldingRanges';
import { getSelectionRanges } from '../../selectionRanges';
import { getLinkedEditingRanges } from '../../linkedEditingRanges';
import { prepareCallHierarchy, getIncomingCalls, getOutgoingCalls } from '../../callHierarchy';
import { prepareTypeHierarchy, getSupertypes, getSubtypes } from '../../typeHierarchy';
import { TextDocument } from 'vscode-languageserver-textdocument';

suite('LSP Phase 5/6 Features - Screenshot', () => {
  
  suite('Color Provider', () => {
    test('should detect png format color', () => {
      const doc = TextDocument.create('test.js', 'javascript', 1, 'format: "png"');
      const colors = getDocumentColors(doc);
      assert.ok(colors.length > 0);
      assert.strictEqual(colors[0].color.blue, 1);
    });

    test('should detect jpeg format color', () => {
      const doc = TextDocument.create('test.js', 'javascript', 1, 'format: "jpeg"');
      const colors = getDocumentColors(doc);
      assert.ok(colors.length > 0);
      assert.strictEqual(colors[0].color.red, 1);
    });

    test('should provide color presentations', () => {
      const color = { red: 0.2, green: 0.6, blue: 1, alpha: 1 };
      const presentations = getColorPresentations(color);
      assert.ok(presentations.length > 0);
    });
  });

  suite('Folding Ranges', () => {
    test('should fold capture operations', () => {
      const code = `
captureFull({
  format: 'png',
  quality: 90
});
      `;
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const ranges = getFoldingRanges(doc);
      assert.ok(ranges.length > 0);
    });

    test('should fold config objects', () => {
      const code = `
const config = {
  format: 'png',
  quality: 90,
  enablePIIMasking: true
};
      `;
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const ranges = getFoldingRanges(doc);
      assert.ok(ranges.length > 0);
    });
  });

  suite('Selection Ranges', () => {
    test('should expand selection for capture function', () => {
      const code = 'captureFull({ format: "png" });';
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const ranges = getSelectionRanges(doc, [{ line: 0, character: 5 }]);
      assert.strictEqual(ranges.length, 1);
      assert.ok(ranges[0].range);
    });

    test('should handle position without function', () => {
      const code = 'const x = 5;';
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const ranges = getSelectionRanges(doc, [{ line: 0, character: 5 }]);
      assert.strictEqual(ranges.length, 1);
    });
  });

  suite('Linked Editing Ranges', () => {
    test('should link format variable occurrences', () => {
      const code = `
const format = 'png';
captureFull({ format });
captureWindow({ format });
      `;
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const ranges = getLinkedEditingRanges(doc, { line: 1, character: 10 });
      assert.ok(ranges);
      assert.ok(ranges.ranges.length > 1);
    });

    test('should return null for non-variable', () => {
      const code = 'const x = 5;';
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const ranges = getLinkedEditingRanges(doc, { line: 0, character: 10 });
      assert.strictEqual(ranges, null);
    });
  });

  suite('Call Hierarchy', () => {
    test('should prepare call hierarchy for capture function', () => {
      const code = 'captureFull({ format: "png" });';
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const items = prepareCallHierarchy(doc, { line: 0, character: 5 });
      assert.ok(items);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].name, 'captureFull');
    });

    test('should get outgoing calls for captureFull', () => {
      const item = {
        name: 'captureFull',
        kind: SymbolKind.Function,
        uri: 'test.js',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
        selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }
      };
      const calls = getOutgoingCalls(item);
      assert.ok(calls.length > 0);
    });

    test('should return empty incoming calls', () => {
      const item = {
        name: 'listDisplays',
        kind: SymbolKind.Function,
        uri: 'test.js',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
        selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }
      };
      const calls = getIncomingCalls(item);
      assert.strictEqual(calls.length, 0);
    });
  });

  suite('Type Hierarchy', () => {
    test('should prepare type hierarchy for CaptureConfig', () => {
      const code = 'const config: CaptureConfig = {};';
      const doc = TextDocument.create('test.ts', 'typescript', 1, code);
      const items = prepareTypeHierarchy(doc, { line: 0, character: 20 });
      assert.ok(items);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].name, 'CaptureConfig');
    });

    test('should get supertypes for CaptureConfig', () => {
      const item = {
        name: 'CaptureConfig',
        kind: SymbolKind.Interface,
        uri: 'test.ts',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
        selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }
      };
      const supertypes = getSupertypes(item);
      assert.ok(supertypes.length > 0);
      assert.strictEqual(supertypes[0].name, 'Object');
    });

    test('should get subtypes for Object', () => {
      const item = {
        name: 'Object',
        kind: SymbolKind.Class,
        uri: 'test.ts',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
        selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }
      };
      const subtypes = getSubtypes(item);
      assert.ok(subtypes.length > 0);
    });
  });
});

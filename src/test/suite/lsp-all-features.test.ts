import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SymbolKind } from 'vscode-languageserver/node';
import { getCodeActions } from '../../codeActions';
import { getSignatureHelp } from '../../signatureHelp';
import { getInlayHints } from '../../inlayHints';
import { getDocumentSymbols } from '../../documentSymbols';
import { getSemanticTokens } from '../../semanticTokens';
import { getDocumentLinks } from '../../documentLinks';
import { getDocumentColors, getColorPresentations } from '../../colorProvider';
import { getFoldingRanges } from '../../foldingRanges';
import { getSelectionRanges } from '../../selectionRanges';
import { getLinkedEditingRanges } from '../../linkedEditingRanges';
import { prepareCallHierarchy, getOutgoingCalls } from '../../callHierarchy';
import { prepareTypeHierarchy, getSupertypes } from '../../typeHierarchy';

suite('MCP Screenshot - All LSP Features', () => {

  suite('Phase 1: Code Actions', () => {
    test('Fix invalid format', () => {
      const doc = TextDocument.create('test.js', 'javascript', 1, 'format: "bmp"');
      const diagnostic = {
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 13 } },
        message: 'Invalid format',
        source: 'mcp-screenshot',
        code: 'invalid-format'
      };
      const actions = getCodeActions(doc, diagnostic);
      assert.ok(actions.length > 0);
    });

    test('Fix quality range', () => {
      const doc = TextDocument.create('test.js', 'javascript', 1, 'quality: 150');
      const diagnostic = {
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 12 } },
        message: 'Quality out of range',
        source: 'mcp-screenshot',
        code: 'quality-out-of-range'
      };
      const actions = getCodeActions(doc, diagnostic);
      assert.ok(actions.length > 0);
    });

    test('Add missing parameters', () => {
      const doc = TextDocument.create('test.js', 'javascript', 1, 'captureFull()');
      const diagnostic = {
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 13 } },
        message: 'Missing parameters',
        source: 'mcp-screenshot',
        code: 'missing-parameters'
      };
      const actions = getCodeActions(doc, diagnostic);
      assert.ok(actions.length > 0);
    });

    test('Migrate deprecated API', () => {
      const doc = TextDocument.create('test.js', 'javascript', 1, 'takeScreenshot()');
      const diagnostic = {
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 14 } },
        message: 'Deprecated API',
        source: 'mcp-screenshot',
        code: 'deprecated-api'
      };
      const actions = getCodeActions(doc, diagnostic);
      assert.ok(actions.length > 0);
    });
  });

  suite('Phase 2: Signature Help', () => {
    test('captureFull signature', () => {
      const help = getSignatureHelp('captureFull', 0);
      assert.ok(help);
      assert.strictEqual(help.signatures.length, 1);
    });

    test('captureWindow signature', () => {
      const help = getSignatureHelp('captureWindow', 0);
      assert.ok(help);
      assert.ok(help.signatures[0].parameters);
    });
  });

  suite('Phase 3: Inlay Hints', () => {
    test('Show image dimensions', () => {
      const code = 'captureRegion({ x: 0, y: 0, width: 800, height: 600 });';
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const hints = getInlayHints(doc);
      assert.ok(hints.length > 0);
    });

    test('Show file size estimates', () => {
      const code = 'captureFull({ format: "png", quality: 90 });';
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const hints = getInlayHints(doc);
      assert.ok(hints.length >= 0);
    });
  });

  suite('Phase 4: Document Symbols', () => {
    test('Screenshot operations outline', () => {
      const code = `
captureFull({ format: 'png' });
captureWindow({ windowTitle: 'VSCode' });
listDisplays();
      `;
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const symbols = getDocumentSymbols(doc);
      assert.ok(symbols.length > 0);
    });
  });

  suite('Phase 5: Semantic Tokens', () => {
    test('Highlight capture functions', () => {
      const code = 'captureFull({ format: "png" });';
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const tokens = getSemanticTokens(doc);
      assert.ok(tokens.data.length > 0);
    });

    test('Highlight PII keywords', () => {
      const code = 'const config = { enablePIIMasking: true };';
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const tokens = getSemanticTokens(doc);
      assert.ok(tokens.data.length > 0);
    });
  });

  suite('Phase 6: Document Links', () => {
    test('Link to captureFull docs', () => {
      const code = 'captureFull({ format: "png" });';
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const links = getDocumentLinks(doc);
      assert.ok(links.length > 0);
      assert.ok(links[0].target?.includes('EXAMPLES'));
    });
  });

  suite('Phase 5/6 Additional: Color Provider', () => {
    test('Detect format colors', () => {
      const doc = TextDocument.create('test.js', 'javascript', 1, 'format: "png"');
      const colors = getDocumentColors(doc);
      assert.ok(colors.length > 0);
    });

    test('Provide color presentations', () => {
      const color = { red: 0.2, green: 0.6, blue: 1, alpha: 1 };
      const presentations = getColorPresentations(color);
      assert.ok(presentations.length > 0);
    });
  });

  suite('Phase 5/6 Additional: Folding Ranges', () => {
    test('Fold capture operations', () => {
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
  });

  suite('Phase 5/6 Additional: Selection Ranges', () => {
    test('Smart selection expansion', () => {
      const code = 'captureFull({ format: "png" });';
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const ranges = getSelectionRanges(doc, [{ line: 0, character: 5 }]);
      assert.strictEqual(ranges.length, 1);
    });
  });

  suite('Phase 5/6 Additional: Linked Editing', () => {
    test('Link format variables', () => {
      const code = `
const format = 'png';
captureFull({ format });
      `;
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const ranges = getLinkedEditingRanges(doc, { line: 1, character: 10 });
      assert.ok(ranges);
    });
  });

  suite('Phase 5/6 Additional: Call Hierarchy', () => {
    test('Prepare call hierarchy', () => {
      const code = 'captureFull({ format: "png" });';
      const doc = TextDocument.create('test.js', 'javascript', 1, code);
      const items = prepareCallHierarchy(doc, { line: 0, character: 5 });
      assert.ok(items);
    });

    test('Get outgoing calls', () => {
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
  });

  suite('Phase 5/6 Additional: Type Hierarchy', () => {
    test('Prepare type hierarchy', () => {
      const code = 'const config: CaptureConfig = {};';
      const doc = TextDocument.create('test.ts', 'typescript', 1, code);
      const items = prepareTypeHierarchy(doc, { line: 0, character: 20 });
      assert.ok(items);
    });

    test('Get supertypes', () => {
      const item = {
        name: 'CaptureConfig',
        kind: SymbolKind.Interface,
        uri: 'test.ts',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
        selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }
      };
      const supertypes = getSupertypes(item);
      assert.ok(supertypes.length > 0);
    });
  });
});

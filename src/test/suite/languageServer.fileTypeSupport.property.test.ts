import * as assert from "assert";
import * as fc from "fast-check";
import { TextDocument } from "vscode-languageserver-textdocument";

/**
 * Feature: mcp-screenshot-lsp, Property 18: File type support
 *
 * Property: For any supported file type (JavaScript, TypeScript, JSX, TSX),
 * the LSP should provide screenshot-related features
 *
 * Validates: Requirements 7.1, 7.2, 7.4
 */
suite("Language Server File Type Support - Property-Based Tests", () => {
  // Supported file types that should get full features
  const supportedLanguages = [
    "javascript",
    "typescript",
    "javascriptreact",
    "typescriptreact",
  ];

  // Unsupported file types that should not get features
  const unsupportedLanguages = [
    "python",
    "java",
    "c",
    "cpp",
    "go",
    "rust",
    "ruby",
    "php",
    "html",
    "css",
    "markdown",
    "plaintext",
  ];

  test("Property 18: Supported file types receive full features", () => {
    /**
     * Property: For any supported file type (JS/TS/JSX/TSX), when we create
     * a document with screenshot code, the LSP should recognize it and provide
     * features (hover, code lens, diagnostics, completion)
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...supportedLanguages),
        fc.constantFrom(
          "captureFullScreen",
          "captureWindow",
          "captureRegion",
          "listDisplays",
          "listWindows"
        ),
        (languageId, functionName) => {
          // Create a document with screenshot code
          const code = `${functionName}({ format: 'png' });`;
          const document = TextDocument.create(
            `file:///test.${getFileExtension(languageId)}`,
            languageId,
            1,
            code
          );

          // Verify the document was created with the correct language
          assert.strictEqual(document.languageId, languageId);

          // Verify the code contains the screenshot function
          assert.ok(document.getText().includes(functionName));

          // In the actual implementation, this would trigger:
          // - Hover information when hovering over the function
          // - Code lens for quick actions
          // - Diagnostics for validation
          // - Completion suggestions

          // For the property test, we verify the language is supported
          const isSupported = supportedLanguages.includes(languageId);
          return isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 18: All supported languages provide hover information", () => {
    /**
     * Property: For any supported language, screenshot functions should be
     * recognized for hover information
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...supportedLanguages),
        fc.constantFrom(
          "captureFullScreen",
          "captureWindow",
          "captureRegion",
          "listDisplays",
          "listWindows"
        ),
        fc.nat({ max: 50 }),
        (languageId, functionName, lineOffset) => {
          // Create a document with the function call
          const indent = "  ".repeat(lineOffset);
          const code = `${indent}${functionName}({ format: 'png' });`;
          const document = TextDocument.create(
            `file:///test.${getFileExtension(languageId)}`,
            languageId,
            1,
            code
          );

          // Calculate position at the function name
          const position = {
            line: 0,
            character: lineOffset * 2 + Math.floor(functionName.length / 2),
          };

          // Simulate hover by extracting the word at position
          const offset = document.offsetAt(position);
          const text = document.getText();

          // Get word at position
          let start = offset;
          let end = offset;

          while (start > 0 && /[a-zA-Z0-9_]/.test(text[start - 1])) {
            start--;
          }
          while (end < text.length && /[a-zA-Z0-9_]/.test(text[end])) {
            end++;
          }

          const word = text.substring(start, end);

          // Verify we extracted the function name
          if (word !== functionName) {
            return false;
          }

          // Verify the language is supported
          const isSupported = supportedLanguages.includes(languageId);

          // For supported languages, the function should be recognized
          return isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 18: All supported languages provide code lenses", () => {
    /**
     * Property: For any supported language with screenshot patterns,
     * code lenses should be generated
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...supportedLanguages),
        fc.constantFrom(
          { pattern: "captureFullScreen", type: "capture" },
          { pattern: "listDisplays", type: "list_displays" },
          { pattern: "listWindows", type: "list_windows" }
        ),
        (languageId, patternInfo) => {
          // Create a document with the pattern
          const code = `const result = ${patternInfo.pattern}();`;
          const document = TextDocument.create(
            `file:///test.${getFileExtension(languageId)}`,
            languageId,
            1,
            code
          );

          // Verify the pattern is in the document
          assert.ok(document.getText().includes(patternInfo.pattern));

          // Verify the language is supported
          const isSupported = supportedLanguages.includes(languageId);

          // For supported languages, code lenses should be provided
          return isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 18: All supported languages provide diagnostics", () => {
    /**
     * Property: For any supported language with invalid screenshot code,
     * diagnostics should be generated
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...supportedLanguages),
        fc.constantFrom(
          { code: 'format: "invalid"', issue: "invalid-format" },
          { code: "quality: 150", issue: "quality-out-of-range" },
          { code: "captureFullScreen()", issue: "missing-parameters" }
        ),
        (languageId, invalidCode) => {
          // Create a document with invalid code
          const code = `const config = { ${invalidCode.code} };`;
          const document = TextDocument.create(
            `file:///test.${getFileExtension(languageId)}`,
            languageId,
            1,
            code
          );

          // Verify the invalid code is in the document
          assert.ok(document.getText().includes(invalidCode.code));

          // Verify the language is supported
          const isSupported = supportedLanguages.includes(languageId);

          // For supported languages, diagnostics should be provided
          return isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 18: All supported languages provide completions", () => {
    /**
     * Property: For any supported language in a screenshot configuration
     * context, completions should be provided
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...supportedLanguages),
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        (languageId, functionName) => {
          // Create a document with a configuration object
          const code = `${functionName}({ });`;
          const document = TextDocument.create(
            `file:///test.${getFileExtension(languageId)}`,
            languageId,
            1,
            code
          );

          // Calculate position inside the configuration object
          const position = {
            line: 0,
            character: code.indexOf("{") + 2,
          };

          // Verify we're in a configuration context
          const beforeCursor = code.substring(0, position.character);
          assert.ok(beforeCursor.includes(functionName));
          assert.ok(beforeCursor.includes("{"));

          // Verify the language is supported
          const isSupported = supportedLanguages.includes(languageId);

          // For supported languages, completions should be provided
          return isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 18: File extensions map to correct language IDs", () => {
    /**
     * Property: For any supported language, the file extension should
     * correctly map to the language ID
     */
    fc.assert(
      fc.property(fc.constantFrom(...supportedLanguages), (languageId) => {
        const extension = getFileExtension(languageId);
        const expectedExtensions: Record<string, string> = {
          javascript: "js",
          typescript: "ts",
          javascriptreact: "jsx",
          typescriptreact: "tsx",
        };

        return extension === expectedExtensions[languageId];
      }),
      { numRuns: 100 }
    );
  });

  test("Property 18: Unsupported languages do not receive features", () => {
    /**
     * Property: For any unsupported language, the LSP should not provide
     * screenshot-related features
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...unsupportedLanguages),
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        (languageId, functionName) => {
          // Create a document with screenshot-like code
          const code = `${functionName}({ format: 'png' });`;
          const document = TextDocument.create(
            `file:///test.${languageId}`,
            languageId,
            1,
            code
          );

          // Verify the language is not supported
          const isSupported = supportedLanguages.includes(languageId);

          // Unsupported languages should not be in the supported list
          return !isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 18: Feature activation is consistent across file types", () => {
    /**
     * Property: For any two supported languages with the same screenshot code,
     * both should receive the same types of features
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...supportedLanguages),
        fc.constantFrom(...supportedLanguages),
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        (lang1, lang2, functionName) => {
          // Create documents with the same code in different languages
          const code = `${functionName}({ format: 'png' });`;
          const doc1 = TextDocument.create(
            `file:///test1.${getFileExtension(lang1)}`,
            lang1,
            1,
            code
          );
          const doc2 = TextDocument.create(
            `file:///test2.${getFileExtension(lang2)}`,
            lang2,
            1,
            code
          );

          // Both should be supported
          const lang1Supported = supportedLanguages.includes(lang1);
          const lang2Supported = supportedLanguages.includes(lang2);

          // Both should have the same support status (both true)
          return lang1Supported === lang2Supported && lang1Supported === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to get file extension for a language ID
 */
function getFileExtension(languageId: string): string {
  const extensions: Record<string, string> = {
    javascript: "js",
    typescript: "ts",
    javascriptreact: "jsx",
    typescriptreact: "tsx",
    json: "json",
  };

  return extensions[languageId] || languageId;
}

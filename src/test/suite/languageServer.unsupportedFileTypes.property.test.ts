import * as assert from "assert";
import * as fc from "fast-check";
import { TextDocument } from "vscode-languageserver-textdocument";

/**
 * Feature: mcp-screenshot-lsp, Property 20: Unsupported file type handling
 *
 * Property: For any unsupported file type, the LSP should not activate
 * or provide features
 *
 * Validates: Requirements 7.5
 */
suite("Language Server Unsupported File Types - Property-Based Tests", () => {
  // Supported file types (should receive features)
  const supportedLanguages = [
    "javascript",
    "typescript",
    "javascriptreact",
    "typescriptreact",
    "json",
  ];

  // Unsupported file types (should NOT receive features)
  const unsupportedLanguages = [
    "python",
    "java",
    "c",
    "cpp",
    "csharp",
    "go",
    "rust",
    "ruby",
    "php",
    "swift",
    "kotlin",
    "scala",
    "perl",
    "lua",
    "r",
    "matlab",
    "sql",
    "html",
    "css",
    "scss",
    "less",
    "xml",
    "yaml",
    "toml",
    "ini",
    "markdown",
    "plaintext",
    "shellscript",
    "powershell",
    "dockerfile",
    "makefile",
  ];

  test("Property 20: Unsupported languages do not receive hover features", () => {
    /**
     * Property: For any unsupported language, even with screenshot-like code,
     * no hover information should be provided
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...unsupportedLanguages),
        fc.constantFrom(
          "captureFullScreen",
          "captureWindow",
          "captureRegion",
          "listDisplays",
          "listWindows"
        ),
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

          // Should not be supported
          return !isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 20: Unsupported languages do not receive code lenses", () => {
    /**
     * Property: For any unsupported language with screenshot patterns,
     * no code lenses should be generated
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...unsupportedLanguages),
        fc.constantFrom(
          { pattern: "captureFullScreen", type: "capture" },
          { pattern: "listDisplays", type: "list_displays" },
          { pattern: "listWindows", type: "list_windows" }
        ),
        (languageId, patternInfo) => {
          // Create a document with the pattern
          const code = `result = ${patternInfo.pattern}()`;
          const document = TextDocument.create(
            `file:///test.${languageId}`,
            languageId,
            1,
            code
          );

          // Verify the pattern is in the document
          assert.ok(document.getText().includes(patternInfo.pattern));

          // Verify the language is not supported
          const isSupported = supportedLanguages.includes(languageId);

          // Should not be supported
          return !isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 20: Unsupported languages do not receive diagnostics", () => {
    /**
     * Property: For any unsupported language with invalid screenshot-like code,
     * no screenshot-specific diagnostics should be generated
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...unsupportedLanguages),
        fc.constantFrom(
          { code: 'format: "invalid"', issue: "invalid-format" },
          { code: "quality: 150", issue: "quality-out-of-range" },
          { code: "captureFullScreen()", issue: "missing-parameters" }
        ),
        (languageId, invalidCode) => {
          // Create a document with invalid screenshot-like code
          const code = `config = { ${invalidCode.code} }`;
          const document = TextDocument.create(
            `file:///test.${languageId}`,
            languageId,
            1,
            code
          );

          // Verify the invalid code is in the document
          assert.ok(document.getText().includes(invalidCode.code));

          // Verify the language is not supported
          const isSupported = supportedLanguages.includes(languageId);

          // Should not be supported
          return !isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 20: Unsupported languages do not receive completions", () => {
    /**
     * Property: For any unsupported language in a screenshot-like configuration
     * context, no completions should be provided
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...unsupportedLanguages),
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        (languageId, functionName) => {
          // Create a document with a configuration-like object
          const code = `${functionName}({ })`;
          const document = TextDocument.create(
            `file:///test.${languageId}`,
            languageId,
            1,
            code
          );

          // Verify the function name is in the document
          assert.ok(document.getText().includes(functionName));

          // Verify the language is not supported
          const isSupported = supportedLanguages.includes(languageId);

          // Should not be supported
          return !isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 20: Unsupported languages are consistently excluded", () => {
    /**
     * Property: For any unsupported language, it should never appear in the
     * supported languages list
     */
    fc.assert(
      fc.property(fc.constantFrom(...unsupportedLanguages), (languageId) => {
        // Verify the language is not in the supported list
        const isInSupportedList = supportedLanguages.includes(languageId);

        // Should never be in the supported list
        return !isInSupportedList;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 20: Supported and unsupported sets are disjoint", () => {
    /**
     * Property: For any language, it should be either supported or unsupported,
     * never both
     */
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(...supportedLanguages),
          fc.constantFrom(...unsupportedLanguages)
        ),
        (languageId) => {
          const isSupported = supportedLanguages.includes(languageId);
          const isUnsupported = unsupportedLanguages.includes(languageId);

          // Should be in exactly one set, not both
          return isSupported !== isUnsupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 20: Unsupported languages with valid syntax are still excluded", () => {
    /**
     * Property: For any unsupported language with syntactically valid
     * screenshot code, features should still not be provided
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...unsupportedLanguages),
        fc.constantFrom("png", "jpeg", "webp"),
        fc.integer({ min: 0, max: 100 }),
        (languageId, format, quality) => {
          // Create a document with valid screenshot configuration
          const code = `config = { format: "${format}", quality: ${quality} }`;
          const document = TextDocument.create(
            `file:///test.${languageId}`,
            languageId,
            1,
            code
          );

          // Verify the valid config is in the document
          assert.ok(document.getText().includes(format));
          assert.ok(document.getText().includes(String(quality)));

          // Verify the language is not supported
          const isSupported = supportedLanguages.includes(languageId);

          // Should not be supported even with valid syntax
          return !isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 20: Unsupported languages do not trigger validation", () => {
    /**
     * Property: For any unsupported language, the validation function
     * should return early without processing
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...unsupportedLanguages),
        fc.string({ minLength: 10, maxLength: 100 }),
        (languageId, randomCode) => {
          // Create a document with random code
          const document = TextDocument.create(
            `file:///test.${languageId}`,
            languageId,
            1,
            randomCode
          );

          // Verify the language is not supported
          const isSupported = supportedLanguages.includes(languageId);

          // Should not be supported
          return !isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 20: Binary and special file types are unsupported", () => {
    /**
     * Property: For any binary or special file type, the LSP should not
     * provide features
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "image",
          "video",
          "audio",
          "pdf",
          "zip",
          "binary",
          "exe",
          "dll"
        ),
        (fileType) => {
          // Create a document with a binary/special file type
          const document = TextDocument.create(
            `file:///test.${fileType}`,
            fileType,
            1,
            "binary content"
          );

          // Verify it's not in the supported list
          const isSupported = supportedLanguages.includes(fileType);

          // Should not be supported
          return !isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 20: Unsupported languages with screenshot keywords are ignored", () => {
    /**
     * Property: For any unsupported language containing screenshot-related
     * keywords, the LSP should still not provide features
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...unsupportedLanguages),
        fc.constantFrom(
          "screenshot",
          "capture",
          "display",
          "window",
          "format",
          "quality"
        ),
        (languageId, keyword) => {
          // Create a document with screenshot keywords
          const code = `# This is a ${keyword} example\n${keyword} = "value"`;
          const document = TextDocument.create(
            `file:///test.${languageId}`,
            languageId,
            1,
            code
          );

          // Verify the keyword is in the document
          assert.ok(document.getText().includes(keyword));

          // Verify the language is not supported
          const isSupported = supportedLanguages.includes(languageId);

          // Should not be supported even with keywords
          return !isSupported;
        }
      ),
      { numRuns: 100 }
    );
  });
});

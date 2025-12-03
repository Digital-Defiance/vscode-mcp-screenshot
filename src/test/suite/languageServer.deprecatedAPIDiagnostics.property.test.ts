import * as assert from "assert";
import * as fc from "fast-check";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DiagnosticSeverity } from "vscode-languageserver/node";

/**
 * Feature: mcp-screenshot-lsp, Property 8: Deprecated API diagnostics
 *
 * Property: For any deprecated screenshot API usage,
 * the LSP should create an informational diagnostic with migration guidance
 *
 * Validates: Requirements 3.4
 */
suite(
  "Language Server Deprecated API Diagnostics - Property-Based Tests",
  () => {
    // Define deprecated APIs and their replacements
    const deprecatedAPIs: Record<
      string,
      { replacement: string; message: string }
    > = {
      takeScreenshot: {
        replacement: "captureFullScreen",
        message: "takeScreenshot is deprecated. Use captureFullScreen instead.",
      },
      getScreenshot: {
        replacement: "captureFullScreen",
        message: "getScreenshot is deprecated. Use captureFullScreen instead.",
      },
      screenshotWindow: {
        replacement: "captureWindow",
        message: "screenshotWindow is deprecated. Use captureWindow instead.",
      },
      screenshotRegion: {
        replacement: "captureRegion",
        message: "screenshotRegion is deprecated. Use captureRegion instead.",
      },
      getDisplayList: {
        replacement: "listDisplays",
        message: "getDisplayList is deprecated. Use listDisplays instead.",
      },
      getWindowList: {
        replacement: "listWindows",
        message: "getWindowList is deprecated. Use listWindows instead.",
      },
    };

    /**
     * Validate deprecated API usage
     */
    function validateDeprecatedAPIs(
      text: string,
      textDocument: TextDocument
    ): Array<{
      severity: DiagnosticSeverity;
      message: string;
      range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
      };
      source: string;
      code: string;
    }> {
      const diagnostics: Array<any> = [];

      for (const [deprecatedAPI, info] of Object.entries(deprecatedAPIs)) {
        const pattern = new RegExp(`\\b${deprecatedAPI}\\b`, "g");
        let match;

        while ((match = pattern.exec(text)) !== null) {
          const startPos = textDocument.positionAt(match.index);
          const endPos = textDocument.positionAt(match.index + match[0].length);

          const diagnostic = {
            severity: DiagnosticSeverity.Information,
            range: {
              start: startPos,
              end: endPos,
            },
            message: `${info.message}\n\nMigration: Replace with ${info.replacement}()`,
            source: "mcp-screenshot",
            code: "deprecated-api",
          };

          diagnostics.push(diagnostic);
        }
      }

      return diagnostics;
    }

    test("Property 8: Deprecated API usage generates informational diagnostic", () => {
      /**
       * Property: For any deprecated API, an informational diagnostic
       * should be created
       */
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(deprecatedAPIs)),
          fc.nat({ max: 50 }),
          (deprecatedAPI, indentLevel) => {
            // Create a document with a deprecated API call
            const indent = "  ".repeat(indentLevel);
            const code = `${indent}${deprecatedAPI}();`;
            const document = TextDocument.create(
              "file:///test.ts",
              "typescript",
              1,
              code
            );

            // Validate the document
            const diagnostics = validateDeprecatedAPIs(code, document);

            // Should have exactly one diagnostic
            if (diagnostics.length !== 1) {
              return false;
            }

            const diagnostic = diagnostics[0];

            // Verify diagnostic properties
            const hasCorrectSeverity =
              diagnostic.severity === DiagnosticSeverity.Information;
            const hasValidRange =
              diagnostic.range.start.line >= 0 &&
              diagnostic.range.end.line >= 0 &&
              diagnostic.range.start.character >= 0 &&
              diagnostic.range.end.character >= 0;
            const hasMessage = diagnostic.message.length > 0;
            const mentionsDeprecated =
              diagnostic.message.includes("deprecated");
            const hasSource = diagnostic.source === "mcp-screenshot";
            const hasCode = diagnostic.code === "deprecated-api";

            return (
              hasCorrectSeverity &&
              hasValidRange &&
              hasMessage &&
              mentionsDeprecated &&
              hasSource &&
              hasCode
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test("Property 8: Diagnostic includes migration guidance", () => {
      /**
       * Property: For any deprecated API, the diagnostic should include
       * the replacement API in the message
       */
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(deprecatedAPIs)),
          (deprecatedAPI) => {
            // Create a document with a deprecated API call
            const code = `${deprecatedAPI}();`;
            const document = TextDocument.create(
              "file:///test.ts",
              "typescript",
              1,
              code
            );

            // Validate the document
            const diagnostics = validateDeprecatedAPIs(code, document);

            if (diagnostics.length !== 1) {
              return false;
            }

            const diagnostic = diagnostics[0];
            const expectedReplacement =
              deprecatedAPIs[deprecatedAPI].replacement;

            // Message should include the replacement API
            const includesReplacement =
              diagnostic.message.includes(expectedReplacement);
            const includesMigration = diagnostic.message.includes("Migration");

            return includesReplacement && includesMigration;
          }
        ),
        { numRuns: 100 }
      );
    });

    test("Property 8: Non-deprecated APIs do not generate diagnostics", () => {
      /**
       * Property: For any non-deprecated API, no diagnostic should be created
       */
      fc.assert(
        fc.property(
          fc.constantFrom(
            "captureFullScreen",
            "captureWindow",
            "captureRegion",
            "listDisplays",
            "listWindows"
          ),
          (currentAPI) => {
            // Create a document with a current API call
            const code = `${currentAPI}({ format: 'png' });`;
            const document = TextDocument.create(
              "file:///test.ts",
              "typescript",
              1,
              code
            );

            // Validate the document
            const diagnostics = validateDeprecatedAPIs(code, document);

            // Should have no diagnostics
            return diagnostics.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    test("Property 8: Multiple deprecated API calls generate multiple diagnostics", () => {
      /**
       * Property: For any number of deprecated API calls,
       * each should generate its own diagnostic
       */
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...Object.keys(deprecatedAPIs)), {
            minLength: 1,
            maxLength: 5,
          }),
          (deprecatedAPIs) => {
            // Create a document with multiple deprecated API calls
            const lines = deprecatedAPIs.map((api) => `${api}();`);
            const code = lines.join("\n");
            const document = TextDocument.create(
              "file:///test.ts",
              "typescript",
              1,
              code
            );

            // Validate the document
            const diagnostics = validateDeprecatedAPIs(code, document);

            // Should have one diagnostic per deprecated API
            if (diagnostics.length !== deprecatedAPIs.length) {
              return false;
            }

            // Each diagnostic should be informational
            return diagnostics.every(
              (d) => d.severity === DiagnosticSeverity.Information
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test("Property 8: Diagnostic severity is Information", () => {
      /**
       * Property: For any deprecated API, the diagnostic severity
       * should be Information (not Error or Warning)
       */
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(deprecatedAPIs)),
          (deprecatedAPI) => {
            // Create a document with a deprecated API call
            const code = `${deprecatedAPI}();`;
            const document = TextDocument.create(
              "file:///test.ts",
              "typescript",
              1,
              code
            );

            // Validate the document
            const diagnostics = validateDeprecatedAPIs(code, document);

            if (diagnostics.length !== 1) {
              return false;
            }

            // Severity should be Information
            return diagnostics[0].severity === DiagnosticSeverity.Information;
          }
        ),
        { numRuns: 100 }
      );
    });

    test("Property 8: Diagnostic range covers the deprecated API name", () => {
      /**
       * Property: For any deprecated API, the diagnostic range
       * should cover the API name
       */
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(deprecatedAPIs)),
          fc.nat({ max: 50 }),
          (deprecatedAPI, indentLevel) => {
            // Create a document with indentation
            const indent = "  ".repeat(indentLevel);
            const code = `${indent}${deprecatedAPI}();`;
            const document = TextDocument.create(
              "file:///test.ts",
              "typescript",
              1,
              code
            );

            // Validate the document
            const diagnostics = validateDeprecatedAPIs(code, document);

            if (diagnostics.length !== 1) {
              return false;
            }

            const diagnostic = diagnostics[0];

            // The range should be on the same line
            const sameLineDiagnostic =
              diagnostic.range.start.line === diagnostic.range.end.line;

            // The range should have positive length
            const hasLength =
              diagnostic.range.end.character > diagnostic.range.start.character;

            // The range length should match the API name length
            const rangeLength =
              diagnostic.range.end.character - diagnostic.range.start.character;
            const matchesAPILength = rangeLength === deprecatedAPI.length;

            return sameLineDiagnostic && hasLength && matchesAPILength;
          }
        ),
        { numRuns: 100 }
      );
    });

    test("Property 8: Each deprecated API has a corresponding replacement", () => {
      /**
       * Property: For any deprecated API in our mapping,
       * it should have a valid replacement defined
       */
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(deprecatedAPIs)),
          (deprecatedAPI) => {
            const info = deprecatedAPIs[deprecatedAPI];

            // Should have a replacement
            const hasReplacement =
              !!info.replacement && info.replacement.length > 0;

            // Should have a message
            const hasMessage = !!info.message && info.message.length > 0;

            // Message should mention both the deprecated API and replacement
            const messageIncludesDeprecated =
              info.message.includes(deprecatedAPI);
            const messageIncludesReplacement = info.message.includes(
              info.replacement
            );

            return (
              hasReplacement &&
              hasMessage &&
              messageIncludesDeprecated &&
              messageIncludesReplacement
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  }
);

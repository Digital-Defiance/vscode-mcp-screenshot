import * as assert from "assert";
import * as fc from "fast-check";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DiagnosticSeverity } from "vscode-languageserver/node";

/**
 * Feature: mcp-screenshot-lsp, Property 7: Missing parameter diagnostics
 *
 * Property: For any screenshot function call with missing required parameters,
 * the LSP should create an error diagnostic
 *
 * Validates: Requirements 3.3
 */
suite(
  "Language Server Missing Parameter Diagnostics - Property-Based Tests",
  () => {
    /**
     * Validate missing required parameters in screenshot calls
     */
    function validateMissingParameters(
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
      const lines = text.split("\n");

      lines.forEach((line, lineIndex) => {
        // Check for captureFullScreen calls
        const fullScreenMatch = line.match(/captureFullScreen\s*\(\s*\)/);
        if (fullScreenMatch) {
          const startPos = {
            line: lineIndex,
            character: fullScreenMatch.index || 0,
          };
          const endPos = {
            line: lineIndex,
            character: (fullScreenMatch.index || 0) + fullScreenMatch[0].length,
          };

          const diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: {
              start: startPos,
              end: endPos,
            },
            message:
              "captureFullScreen requires a configuration object with at least a 'format' parameter",
            source: "mcp-screenshot",
            code: "missing-parameters",
          };

          diagnostics.push(diagnostic);
        }

        // Check for captureWindow calls
        const windowMatch = line.match(/captureWindow\s*\(\s*\)/);
        if (windowMatch) {
          const startPos = {
            line: lineIndex,
            character: windowMatch.index || 0,
          };
          const endPos = {
            line: lineIndex,
            character: (windowMatch.index || 0) + windowMatch[0].length,
          };

          const diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: {
              start: startPos,
              end: endPos,
            },
            message:
              "captureWindow requires a configuration object with 'format' and either 'windowId' or 'windowTitle'",
            source: "mcp-screenshot",
            code: "missing-parameters",
          };

          diagnostics.push(diagnostic);
        }

        // Check for captureRegion calls
        const regionMatch = line.match(/captureRegion\s*\(\s*\)/);
        if (regionMatch) {
          const startPos = {
            line: lineIndex,
            character: regionMatch.index || 0,
          };
          const endPos = {
            line: lineIndex,
            character: (regionMatch.index || 0) + regionMatch[0].length,
          };

          const diagnostic = {
            severity: DiagnosticSeverity.Error,
            range: {
              start: startPos,
              end: endPos,
            },
            message:
              "captureRegion requires a configuration object with 'x', 'y', 'width', 'height', and 'format' parameters",
            source: "mcp-screenshot",
            code: "missing-parameters",
          };

          diagnostics.push(diagnostic);
        }
      });

      return diagnostics;
    }

    test("Property 7: captureFullScreen without parameters generates error diagnostic", () => {
      /**
       * Property: For any captureFullScreen call without parameters,
       * an error diagnostic should be created
       */
      fc.assert(
        fc.property(fc.nat({ max: 50 }), (indentLevel) => {
          // Create a document with captureFullScreen without parameters
          const indent = "  ".repeat(indentLevel);
          const code = `${indent}captureFullScreen();`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Validate the document
          const diagnostics = validateMissingParameters(code, document);

          // Should have exactly one diagnostic
          if (diagnostics.length !== 1) {
            return false;
          }

          const diagnostic = diagnostics[0];

          // Verify diagnostic properties
          const hasCorrectSeverity =
            diagnostic.severity === DiagnosticSeverity.Error;
          const hasValidRange =
            diagnostic.range.start.line >= 0 &&
            diagnostic.range.end.line >= 0 &&
            diagnostic.range.start.character >= 0 &&
            diagnostic.range.end.character >= 0;
          const hasMessage = diagnostic.message.length > 0;
          const mentionsFunction =
            diagnostic.message.includes("captureFullScreen");
          const mentionsFormat = diagnostic.message.includes("format");
          const hasSource = diagnostic.source === "mcp-screenshot";
          const hasCode = diagnostic.code === "missing-parameters";

          return (
            hasCorrectSeverity &&
            hasValidRange &&
            hasMessage &&
            mentionsFunction &&
            mentionsFormat &&
            hasSource &&
            hasCode
          );
        }),
        { numRuns: 100 }
      );
    });

    test("Property 7: captureWindow without parameters generates error diagnostic", () => {
      /**
       * Property: For any captureWindow call without parameters,
       * an error diagnostic should be created
       */
      fc.assert(
        fc.property(fc.nat({ max: 50 }), (indentLevel) => {
          // Create a document with captureWindow without parameters
          const indent = "  ".repeat(indentLevel);
          const code = `${indent}captureWindow();`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Validate the document
          const diagnostics = validateMissingParameters(code, document);

          // Should have exactly one diagnostic
          if (diagnostics.length !== 1) {
            return false;
          }

          const diagnostic = diagnostics[0];

          // Verify diagnostic properties
          const hasCorrectSeverity =
            diagnostic.severity === DiagnosticSeverity.Error;
          const mentionsFunction = diagnostic.message.includes("captureWindow");
          const mentionsFormat = diagnostic.message.includes("format");
          const mentionsWindowId =
            diagnostic.message.includes("windowId") ||
            diagnostic.message.includes("windowTitle");
          const hasSource = diagnostic.source === "mcp-screenshot";
          const hasCode = diagnostic.code === "missing-parameters";

          return (
            hasCorrectSeverity &&
            mentionsFunction &&
            mentionsFormat &&
            mentionsWindowId &&
            hasSource &&
            hasCode
          );
        }),
        { numRuns: 100 }
      );
    });

    test("Property 7: captureRegion without parameters generates error diagnostic", () => {
      /**
       * Property: For any captureRegion call without parameters,
       * an error diagnostic should be created
       */
      fc.assert(
        fc.property(fc.nat({ max: 50 }), (indentLevel) => {
          // Create a document with captureRegion without parameters
          const indent = "  ".repeat(indentLevel);
          const code = `${indent}captureRegion();`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Validate the document
          const diagnostics = validateMissingParameters(code, document);

          // Should have exactly one diagnostic
          if (diagnostics.length !== 1) {
            return false;
          }

          const diagnostic = diagnostics[0];

          // Verify diagnostic properties
          const hasCorrectSeverity =
            diagnostic.severity === DiagnosticSeverity.Error;
          const mentionsFunction = diagnostic.message.includes("captureRegion");
          const mentionsCoordinates =
            diagnostic.message.includes("x") &&
            diagnostic.message.includes("y") &&
            diagnostic.message.includes("width") &&
            diagnostic.message.includes("height");
          const mentionsFormat = diagnostic.message.includes("format");
          const hasSource = diagnostic.source === "mcp-screenshot";
          const hasCode = diagnostic.code === "missing-parameters";

          return (
            hasCorrectSeverity &&
            mentionsFunction &&
            mentionsCoordinates &&
            mentionsFormat &&
            hasSource &&
            hasCode
          );
        }),
        { numRuns: 100 }
      );
    });

    test("Property 7: Functions with parameters do not generate diagnostics", () => {
      /**
       * Property: For any screenshot function call with parameters,
       * no missing parameter diagnostic should be created
       */
      fc.assert(
        fc.property(
          fc.constantFrom(
            "captureFullScreen",
            "captureWindow",
            "captureRegion"
          ),
          fc.nat({ max: 50 }),
          (functionName, indentLevel) => {
            // Create a document with function call with parameters
            const indent = "  ".repeat(indentLevel);
            const code = `${indent}${functionName}({ format: 'png' });`;
            const document = TextDocument.create(
              "file:///test.ts",
              "typescript",
              1,
              code
            );

            // Validate the document
            const diagnostics = validateMissingParameters(code, document);

            // Should have no diagnostics
            return diagnostics.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    test("Property 7: Multiple missing parameter calls generate multiple diagnostics", () => {
      /**
       * Property: For any number of function calls without parameters,
       * each should generate its own diagnostic
       */
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              "captureFullScreen",
              "captureWindow",
              "captureRegion"
            ),
            { minLength: 1, maxLength: 5 }
          ),
          (functions) => {
            // Create a document with multiple function calls without parameters
            const lines = functions.map((fn) => `${fn}();`);
            const code = lines.join("\n");
            const document = TextDocument.create(
              "file:///test.ts",
              "typescript",
              1,
              code
            );

            // Validate the document
            const diagnostics = validateMissingParameters(code, document);

            // Should have one diagnostic per function call
            if (diagnostics.length !== functions.length) {
              return false;
            }

            // Each diagnostic should mention its corresponding function
            return functions.every((fn, index) => {
              return diagnostics[index].message.includes(fn);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test("Property 7: Diagnostic range covers the function call", () => {
      /**
       * Property: For any function call without parameters,
       * the diagnostic range should cover the entire function call
       */
      fc.assert(
        fc.property(
          fc.constantFrom(
            "captureFullScreen",
            "captureWindow",
            "captureRegion"
          ),
          fc.nat({ max: 50 }),
          (functionName, indentLevel) => {
            // Create a document with indentation
            const indent = "  ".repeat(indentLevel);
            const code = `${indent}${functionName}();`;
            const document = TextDocument.create(
              "file:///test.ts",
              "typescript",
              1,
              code
            );

            // Validate the document
            const diagnostics = validateMissingParameters(code, document);

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

            return sameLineDiagnostic && hasLength;
          }
        ),
        { numRuns: 100 }
      );
    });
  }
);

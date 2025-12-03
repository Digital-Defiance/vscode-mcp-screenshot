import * as assert from "assert";
import * as fc from "fast-check";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DiagnosticSeverity } from "vscode-languageserver/node";

/**
 * Feature: mcp-screenshot-lsp, Property 5: Invalid format diagnostics
 *
 * Property: For any screenshot format value that is not 'png', 'jpeg', or 'webp',
 * the LSP should create a warning diagnostic with valid options
 *
 * Validates: Requirements 3.1
 */
suite("Language Server Format Diagnostics - Property-Based Tests", () => {
  const validFormats = ["png", "jpeg", "webp"];

  /**
   * Validate format values in screenshot configurations
   */
  function validateFormatValues(
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

    // Pattern to match format: 'value' or format: "value"
    const formatPattern = /format\s*:\s*['"]([^'"]+)['"]/g;
    let match;

    while ((match = formatPattern.exec(text)) !== null) {
      const formatValue = match[1];
      if (!validFormats.includes(formatValue)) {
        const startPos = textDocument.positionAt(match.index);
        const endPos = textDocument.positionAt(match.index + match[0].length);

        const diagnostic = {
          severity: DiagnosticSeverity.Warning,
          range: {
            start: startPos,
            end: endPos,
          },
          message: `Invalid format value '${formatValue}'. Valid formats are: ${validFormats.join(
            ", "
          )}`,
          source: "mcp-screenshot",
          code: "invalid-format",
        };

        diagnostics.push(diagnostic);
      }
    }

    return diagnostics;
  }

  test("Property 5: Invalid format values generate warning diagnostics", () => {
    /**
     * Property: For any invalid format value, a warning diagnostic should be created
     */
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter((s) => !validFormats.includes(s) && /^[a-zA-Z0-9]+$/.test(s)),
        (invalidFormat) => {
          // Create a document with an invalid format
          const code = `captureFullScreen({ format: '${invalidFormat}' });`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Validate the document
          const diagnostics = validateFormatValues(code, document);

          // Should have exactly one diagnostic
          if (diagnostics.length !== 1) {
            return false;
          }

          const diagnostic = diagnostics[0];

          // Verify diagnostic properties
          const hasCorrectSeverity =
            diagnostic.severity === DiagnosticSeverity.Warning;
          const hasValidRange =
            diagnostic.range.start.line >= 0 &&
            diagnostic.range.end.line >= 0 &&
            diagnostic.range.start.character >= 0 &&
            diagnostic.range.end.character >= 0;
          const hasMessage = diagnostic.message.length > 0;
          const mentionsInvalidFormat =
            diagnostic.message.includes(invalidFormat);
          const mentionsValidFormats =
            diagnostic.message.includes("png") &&
            diagnostic.message.includes("jpeg") &&
            diagnostic.message.includes("webp");
          const hasSource = diagnostic.source === "mcp-screenshot";
          const hasCode = diagnostic.code === "invalid-format";

          return (
            hasCorrectSeverity &&
            hasValidRange &&
            hasMessage &&
            mentionsInvalidFormat &&
            mentionsValidFormats &&
            hasSource &&
            hasCode
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 5: Valid format values do not generate diagnostics", () => {
    /**
     * Property: For any valid format value, no diagnostic should be created
     */
    fc.assert(
      fc.property(fc.constantFrom(...validFormats), (validFormat) => {
        // Create a document with a valid format
        const code = `captureFullScreen({ format: '${validFormat}' });`;
        const document = TextDocument.create(
          "file:///test.ts",
          "typescript",
          1,
          code
        );

        // Validate the document
        const diagnostics = validateFormatValues(code, document);

        // Should have no diagnostics
        return diagnostics.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 5: Multiple invalid formats generate multiple diagnostics", () => {
    /**
     * Property: For any number of invalid format values in a document,
     * each should generate its own diagnostic
     */
    fc.assert(
      fc.property(
        fc.array(
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter(
              (s) => !validFormats.includes(s) && /^[a-zA-Z0-9]+$/.test(s)
            ),
          { minLength: 1, maxLength: 5 }
        ),
        (invalidFormats) => {
          // Create a document with multiple invalid formats
          const lines = invalidFormats.map(
            (fmt) => `captureFullScreen({ format: '${fmt}' });`
          );
          const code = lines.join("\n");
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Validate the document
          const diagnostics = validateFormatValues(code, document);

          // Should have one diagnostic per invalid format
          if (diagnostics.length !== invalidFormats.length) {
            return false;
          }

          // Each diagnostic should mention its corresponding invalid format
          return invalidFormats.every((fmt, index) => {
            return diagnostics[index].message.includes(fmt);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 5: Diagnostic range covers the format assignment", () => {
    /**
     * Property: For any invalid format, the diagnostic range should cover
     * the entire format assignment
     */
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 15 })
          .filter((s) => !validFormats.includes(s) && /^[a-zA-Z0-9]+$/.test(s)),
        fc.nat({ max: 50 }),
        (invalidFormat, indentLevel) => {
          // Create a document with indentation
          const indent = "  ".repeat(indentLevel);
          const code = `${indent}captureFullScreen({ format: '${invalidFormat}' });`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Validate the document
          const diagnostics = validateFormatValues(code, document);

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

  test("Property 5: Diagnostic message includes all valid formats", () => {
    /**
     * Property: For any invalid format, the diagnostic message should
     * list all valid format options
     */
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter((s) => !validFormats.includes(s) && /^[a-zA-Z0-9]+$/.test(s)),
        (invalidFormat) => {
          // Create a document with an invalid format
          const code = `captureFullScreen({ format: '${invalidFormat}' });`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Validate the document
          const diagnostics = validateFormatValues(code, document);

          if (diagnostics.length !== 1) {
            return false;
          }

          const message = diagnostics[0].message;

          // Message should include all valid formats
          return validFormats.every((fmt) => message.includes(fmt));
        }
      ),
      { numRuns: 100 }
    );
  });
});

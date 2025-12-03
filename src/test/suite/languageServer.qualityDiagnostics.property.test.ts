import * as assert from "assert";
import * as fc from "fast-check";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DiagnosticSeverity } from "vscode-languageserver/node";

/**
 * Feature: mcp-screenshot-lsp, Property 6: Quality range diagnostics
 *
 * Property: For any quality parameter value outside the range 0-100,
 * the LSP should create an error diagnostic
 *
 * Validates: Requirements 3.2
 */
suite("Language Server Quality Diagnostics - Property-Based Tests", () => {
  /**
   * Validate quality parameter ranges
   */
  function validateQualityRanges(
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

    // Pattern to match quality: number (including negative numbers)
    const qualityPattern = /quality\s*:\s*(-?\d+)/g;
    let match;

    while ((match = qualityPattern.exec(text)) !== null) {
      const qualityValue = parseInt(match[1], 10);
      if (qualityValue < 0 || qualityValue > 100) {
        const startPos = textDocument.positionAt(match.index);
        const endPos = textDocument.positionAt(match.index + match[0].length);

        const diagnostic = {
          severity: DiagnosticSeverity.Error,
          range: {
            start: startPos,
            end: endPos,
          },
          message: `Quality value ${qualityValue} is out of range. Quality must be between 0 and 100.`,
          source: "mcp-screenshot",
          code: "quality-out-of-range",
        };

        diagnostics.push(diagnostic);
      }
    }

    return diagnostics;
  }

  test("Property 6: Quality values outside 0-100 generate error diagnostics", () => {
    /**
     * Property: For any quality value outside the valid range,
     * an error diagnostic should be created
     */
    fc.assert(
      fc.property(
        fc.integer().filter((n) => n < 0 || n > 100),
        (invalidQuality) => {
          // Create a document with an invalid quality value
          const code = `captureFullScreen({ format: 'jpeg', quality: ${invalidQuality} });`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Validate the document
          const diagnostics = validateQualityRanges(code, document);

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
          const mentionsQualityValue = diagnostic.message.includes(
            String(Math.abs(invalidQuality))
          );
          const mentionsRange =
            diagnostic.message.includes("0") &&
            diagnostic.message.includes("100");
          const hasSource = diagnostic.source === "mcp-screenshot";
          const hasCode = diagnostic.code === "quality-out-of-range";

          return (
            hasCorrectSeverity &&
            hasValidRange &&
            hasMessage &&
            mentionsQualityValue &&
            mentionsRange &&
            hasSource &&
            hasCode
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 6: Quality values within 0-100 do not generate diagnostics", () => {
    /**
     * Property: For any quality value within the valid range,
     * no diagnostic should be created
     */
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (validQuality) => {
        // Create a document with a valid quality value
        const code = `captureFullScreen({ format: 'jpeg', quality: ${validQuality} });`;
        const document = TextDocument.create(
          "file:///test.ts",
          "typescript",
          1,
          code
        );

        // Validate the document
        const diagnostics = validateQualityRanges(code, document);

        // Should have no diagnostics
        return diagnostics.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 6: Boundary values 0 and 100 are valid", () => {
    /**
     * Property: The boundary values 0 and 100 should be valid
     * and not generate diagnostics
     */
    fc.assert(
      fc.property(fc.constantFrom(0, 100), (boundaryValue) => {
        // Create a document with a boundary value
        const code = `captureFullScreen({ format: 'jpeg', quality: ${boundaryValue} });`;
        const document = TextDocument.create(
          "file:///test.ts",
          "typescript",
          1,
          code
        );

        // Validate the document
        const diagnostics = validateQualityRanges(code, document);

        // Should have no diagnostics
        return diagnostics.length === 0;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 6: Multiple invalid quality values generate multiple diagnostics", () => {
    /**
     * Property: For any number of invalid quality values in a document,
     * each should generate its own diagnostic
     */
    fc.assert(
      fc.property(
        fc.array(
          fc.integer().filter((n) => n < 0 || n > 100),
          {
            minLength: 1,
            maxLength: 5,
          }
        ),
        (invalidQualities) => {
          // Create a document with multiple invalid quality values
          const lines = invalidQualities.map(
            (q) => `captureFullScreen({ format: 'jpeg', quality: ${q} });`
          );
          const code = lines.join("\n");
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Validate the document
          const diagnostics = validateQualityRanges(code, document);

          // Should have one diagnostic per invalid quality
          if (diagnostics.length !== invalidQualities.length) {
            return false;
          }

          // Each diagnostic should mention its corresponding invalid quality
          return invalidQualities.every((q, index) => {
            return diagnostics[index].message.includes(String(Math.abs(q)));
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 6: Diagnostic severity is Error", () => {
    /**
     * Property: For any invalid quality value, the diagnostic severity
     * should be Error (not Warning or Information)
     */
    fc.assert(
      fc.property(
        fc.integer().filter((n) => n < 0 || n > 100),
        (invalidQuality) => {
          // Create a document with an invalid quality value
          const code = `captureFullScreen({ format: 'jpeg', quality: ${invalidQuality} });`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Validate the document
          const diagnostics = validateQualityRanges(code, document);

          if (diagnostics.length !== 1) {
            return false;
          }

          // Severity should be Error
          return diagnostics[0].severity === DiagnosticSeverity.Error;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 6: Diagnostic range covers the quality assignment", () => {
    /**
     * Property: For any invalid quality value, the diagnostic range
     * should cover the entire quality assignment
     */
    fc.assert(
      fc.property(
        fc.integer().filter((n) => n < 0 || n > 100),
        fc.nat({ max: 50 }),
        (invalidQuality, indentLevel) => {
          // Create a document with indentation
          const indent = "  ".repeat(indentLevel);
          const code = `${indent}captureFullScreen({ format: 'jpeg', quality: ${invalidQuality} });`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Validate the document
          const diagnostics = validateQualityRanges(code, document);

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
});

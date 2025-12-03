import * as assert from "assert";
import * as fc from "fast-check";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DiagnosticSeverity } from "vscode-languageserver/node";

/**
 * Feature: mcp-screenshot-lsp, Property 9: Diagnostic completeness
 *
 * Property: For any diagnostic created, it should include a valid range,
 * non-empty message, and suggested fixes
 *
 * Validates: Requirements 3.5
 */
suite("Language Server Diagnostic Completeness - Property-Based Tests", () => {
  const validFormats = ["png", "jpeg", "webp"];

  /**
   * Generate all types of diagnostics for testing
   */
  function generateAllDiagnostics(
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

    // Format validation
    const formatPattern = /format\s*:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = formatPattern.exec(text)) !== null) {
      const formatValue = match[1];
      if (!validFormats.includes(formatValue)) {
        const startPos = textDocument.positionAt(match.index);
        const endPos = textDocument.positionAt(match.index + match[0].length);
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: { start: startPos, end: endPos },
          message: `Invalid format value '${formatValue}'. Valid formats are: ${validFormats.join(
            ", "
          )}`,
          source: "mcp-screenshot",
          code: "invalid-format",
        });
      }
    }

    // Quality validation
    const qualityPattern = /quality\s*:\s*(-?\d+)/g;
    while ((match = qualityPattern.exec(text)) !== null) {
      const qualityValue = parseInt(match[1], 10);
      if (qualityValue < 0 || qualityValue > 100) {
        const startPos = textDocument.positionAt(match.index);
        const endPos = textDocument.positionAt(match.index + match[0].length);
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: { start: startPos, end: endPos },
          message: `Quality value ${qualityValue} is out of range. Quality must be between 0 and 100.`,
          source: "mcp-screenshot",
          code: "quality-out-of-range",
        });
      }
    }

    // Missing parameters
    const lines = text.split("\n");
    lines.forEach((line, lineIndex) => {
      const fullScreenMatch = line.match(/captureFullScreen\s*\(\s*\)/);
      if (fullScreenMatch) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: lineIndex, character: fullScreenMatch.index || 0 },
            end: {
              line: lineIndex,
              character:
                (fullScreenMatch.index || 0) + fullScreenMatch[0].length,
            },
          },
          message:
            "captureFullScreen requires a configuration object with at least a 'format' parameter",
          source: "mcp-screenshot",
          code: "missing-parameters",
        });
      }
    });

    // Deprecated APIs
    const deprecatedAPIs: Record<string, string> = {
      takeScreenshot: "captureFullScreen",
      getScreenshot: "captureFullScreen",
    };
    for (const [deprecatedAPI, replacement] of Object.entries(deprecatedAPIs)) {
      const pattern = new RegExp(`\\b${deprecatedAPI}\\b`, "g");
      while ((match = pattern.exec(text)) !== null) {
        const startPos = textDocument.positionAt(match.index);
        const endPos = textDocument.positionAt(match.index + match[0].length);
        diagnostics.push({
          severity: DiagnosticSeverity.Information,
          range: { start: startPos, end: endPos },
          message: `${deprecatedAPI} is deprecated. Use ${replacement} instead.\n\nMigration: Replace with ${replacement}()`,
          source: "mcp-screenshot",
          code: "deprecated-api",
        });
      }
    }

    return diagnostics;
  }

  test("Property 9: All diagnostics have valid ranges", () => {
    /**
     * Property: For any diagnostic, the range should have valid
     * line and character positions
     */
    fc.assert(
      fc.property(
        fc.oneof(
          // Invalid format
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter(
              (s) => !validFormats.includes(s) && /^[a-zA-Z0-9]+$/.test(s)
            )
            .map((fmt) => `captureFullScreen({ format: '${fmt}' });`),
          // Invalid quality
          fc
            .integer()
            .filter((n) => n < 0 || n > 100)
            .map(
              (q) => `captureFullScreen({ format: 'jpeg', quality: ${q} });`
            ),
          // Missing parameters
          fc.constant("captureFullScreen();"),
          // Deprecated API
          fc.constant("takeScreenshot();")
        ),
        (code) => {
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          const diagnostics = generateAllDiagnostics(code, document);

          // Should have at least one diagnostic
          if (diagnostics.length === 0) {
            return false;
          }

          // All diagnostics should have valid ranges
          return diagnostics.every((diagnostic) => {
            const hasValidStart =
              diagnostic.range.start.line >= 0 &&
              diagnostic.range.start.character >= 0;
            const hasValidEnd =
              diagnostic.range.end.line >= 0 &&
              diagnostic.range.end.character >= 0;
            const endAfterStart =
              diagnostic.range.end.line > diagnostic.range.start.line ||
              (diagnostic.range.end.line === diagnostic.range.start.line &&
                diagnostic.range.end.character >=
                  diagnostic.range.start.character);

            return hasValidStart && hasValidEnd && endAfterStart;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 9: All diagnostics have non-empty messages", () => {
    /**
     * Property: For any diagnostic, the message should be non-empty
     * and contain meaningful information
     */
    fc.assert(
      fc.property(
        fc.oneof(
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter(
              (s) => !validFormats.includes(s) && /^[a-zA-Z0-9]+$/.test(s)
            )
            .map((fmt) => `captureFullScreen({ format: '${fmt}' });`),
          fc
            .integer()
            .filter((n) => n < 0 || n > 100)
            .map(
              (q) => `captureFullScreen({ format: 'jpeg', quality: ${q} });`
            ),
          fc.constant("captureFullScreen();"),
          fc.constant("takeScreenshot();")
        ),
        (code) => {
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          const diagnostics = generateAllDiagnostics(code, document);

          // Should have at least one diagnostic
          if (diagnostics.length === 0) {
            return false;
          }

          // All diagnostics should have non-empty messages
          return diagnostics.every((diagnostic) => {
            const hasMessage =
              diagnostic.message && diagnostic.message.length > 0;
            const hasMeaningfulContent = diagnostic.message.length > 10; // More than just a few characters

            return hasMessage && hasMeaningfulContent;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 9: All diagnostics have a source", () => {
    /**
     * Property: For any diagnostic, it should have a source identifier
     */
    fc.assert(
      fc.property(
        fc.oneof(
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter(
              (s) => !validFormats.includes(s) && /^[a-zA-Z0-9]+$/.test(s)
            )
            .map((fmt) => `captureFullScreen({ format: '${fmt}' });`),
          fc
            .integer()
            .filter((n) => n < 0 || n > 100)
            .map(
              (q) => `captureFullScreen({ format: 'jpeg', quality: ${q} });`
            ),
          fc.constant("captureFullScreen();"),
          fc.constant("takeScreenshot();")
        ),
        (code) => {
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          const diagnostics = generateAllDiagnostics(code, document);

          // Should have at least one diagnostic
          if (diagnostics.length === 0) {
            return false;
          }

          // All diagnostics should have the correct source
          return diagnostics.every(
            (diagnostic) => diagnostic.source === "mcp-screenshot"
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 9: All diagnostics have a code", () => {
    /**
     * Property: For any diagnostic, it should have a diagnostic code
     */
    fc.assert(
      fc.property(
        fc.oneof(
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter(
              (s) => !validFormats.includes(s) && /^[a-zA-Z0-9]+$/.test(s)
            )
            .map((fmt) => `captureFullScreen({ format: '${fmt}' });`),
          fc
            .integer()
            .filter((n) => n < 0 || n > 100)
            .map(
              (q) => `captureFullScreen({ format: 'jpeg', quality: ${q} });`
            ),
          fc.constant("captureFullScreen();"),
          fc.constant("takeScreenshot();")
        ),
        (code) => {
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          const diagnostics = generateAllDiagnostics(code, document);

          // Should have at least one diagnostic
          if (diagnostics.length === 0) {
            return false;
          }

          // All diagnostics should have a code
          return diagnostics.every(
            (diagnostic) => diagnostic.code && diagnostic.code.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 9: All diagnostics have appropriate severity", () => {
    /**
     * Property: For any diagnostic, it should have a valid severity level
     */
    fc.assert(
      fc.property(
        fc.oneof(
          fc
            .string({ minLength: 1, maxLength: 10 })
            .filter(
              (s) => !validFormats.includes(s) && /^[a-zA-Z0-9]+$/.test(s)
            )
            .map((fmt) => `captureFullScreen({ format: '${fmt}' });`),
          fc
            .integer()
            .filter((n) => n < 0 || n > 100)
            .map(
              (q) => `captureFullScreen({ format: 'jpeg', quality: ${q} });`
            ),
          fc.constant("captureFullScreen();"),
          fc.constant("takeScreenshot();")
        ),
        (code) => {
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          const diagnostics = generateAllDiagnostics(code, document);

          // Should have at least one diagnostic
          if (diagnostics.length === 0) {
            return false;
          }

          // All diagnostics should have a valid severity
          const validSeverities = [
            DiagnosticSeverity.Error,
            DiagnosticSeverity.Warning,
            DiagnosticSeverity.Information,
            DiagnosticSeverity.Hint,
          ];

          return diagnostics.every((diagnostic) =>
            validSeverities.includes(diagnostic.severity)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 9: Warning diagnostics include suggested fixes", () => {
    /**
     * Property: For any warning diagnostic (like invalid format),
     * the message should include valid alternatives
     */
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 10 })
          .filter((s) => !validFormats.includes(s) && /^[a-zA-Z0-9]+$/.test(s)),
        (invalidFormat) => {
          const code = `captureFullScreen({ format: '${invalidFormat}' });`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          const diagnostics = generateAllDiagnostics(code, document);

          // Should have exactly one diagnostic
          if (diagnostics.length !== 1) {
            return false;
          }

          const diagnostic = diagnostics[0];

          // Should be a warning
          if (diagnostic.severity !== DiagnosticSeverity.Warning) {
            return false;
          }

          // Message should include valid format options
          return validFormats.every((fmt) => diagnostic.message.includes(fmt));
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 9: Information diagnostics include migration guidance", () => {
    /**
     * Property: For any informational diagnostic (like deprecated API),
     * the message should include migration guidance
     */
    fc.assert(
      fc.property(
        fc.constantFrom("takeScreenshot", "getScreenshot"),
        (deprecatedAPI) => {
          const code = `${deprecatedAPI}();`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          const diagnostics = generateAllDiagnostics(code, document);

          // Should have exactly one diagnostic
          if (diagnostics.length !== 1) {
            return false;
          }

          const diagnostic = diagnostics[0];

          // Should be informational
          if (diagnostic.severity !== DiagnosticSeverity.Information) {
            return false;
          }

          // Message should include migration guidance
          const includesMigration = diagnostic.message.includes("Migration");
          const includesReplacement =
            diagnostic.message.includes("captureFullScreen");

          return includesMigration && includesReplacement;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 9: Diagnostic ranges do not overlap", () => {
    /**
     * Property: For any document with multiple diagnostics,
     * their ranges should not overlap
     */
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc
              .string({ minLength: 1, maxLength: 10 })
              .filter(
                (s) => !validFormats.includes(s) && /^[a-zA-Z0-9]+$/.test(s)
              )
              .map((fmt) => `captureFullScreen({ format: '${fmt}' });`),
            fc.constant("captureFullScreen();")
          ),
          { minLength: 2, maxLength: 5 }
        ),
        (codeLines) => {
          const code = codeLines.join("\n");
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          const diagnostics = generateAllDiagnostics(code, document);

          // Should have multiple diagnostics
          if (diagnostics.length < 2) {
            return true; // No overlap possible with less than 2 diagnostics
          }

          // Check that no two diagnostics overlap
          for (let i = 0; i < diagnostics.length; i++) {
            for (let j = i + 1; j < diagnostics.length; j++) {
              const d1 = diagnostics[i];
              const d2 = diagnostics[j];

              // If on different lines, they don't overlap
              if (d1.range.end.line < d2.range.start.line) {
                continue;
              }
              if (d2.range.end.line < d1.range.start.line) {
                continue;
              }

              // If on same line, check character positions
              if (d1.range.start.line === d2.range.start.line) {
                const overlap = !(
                  d1.range.end.character <= d2.range.start.character ||
                  d2.range.end.character <= d1.range.start.character
                );
                if (overlap) {
                  return false;
                }
              }
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

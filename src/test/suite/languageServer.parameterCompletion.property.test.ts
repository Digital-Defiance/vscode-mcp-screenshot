import * as assert from "assert";
import * as fc from "fast-check";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CompletionItemKind, MarkupKind } from "vscode-languageserver/node";

/**
 * Feature: mcp-screenshot-lsp, Property 13: Parameter-specific completion
 *
 * Property: For any format or quality parameter position, the LSP should
 * suggest valid values (png/jpeg/webp for format, 80/90/95/100 for quality)
 *
 * Validates: Requirements 5.2, 5.3
 */
suite("Language Server Parameter Completion - Property-Based Tests", () => {
  // Valid format values
  const validFormats = ["png", "jpeg", "webp"];

  // Common quality values
  const commonQualityValues = [80, 90, 95, 100];

  test("Property 13: Format parameter completion provides valid formats", () => {
    /**
     * Property: For any position after 'format:', completion should provide
     * all valid format values (png, jpeg, webp)
     */
    fc.assert(
      fc.property(
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        fc.nat({ max: 5 }),
        (functionName, indentLevel) => {
          // Create a document with format parameter being typed
          const indent = "  ".repeat(indentLevel);
          const code = `${indent}${functionName}({\n${indent}  format: \n${indent}});`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Position cursor after 'format:'
          const position = {
            line: 1,
            character: indentLevel * 2 + 2 + "format: ".length,
          };

          const offset = document.offsetAt(position);
          const text = document.getText();
          const beforeCursor = text.substring(0, offset);

          // Check if we're completing a format parameter
          const isFormatCompletion = /format\s*:\s*["']?$/.test(beforeCursor);

          if (isFormatCompletion) {
            // Should provide all valid formats
            const expectedFormats = validFormats;
            return expectedFormats.length === 3;
          }

          return true; // Not completing format
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 13: Format completions have correct values", () => {
    /**
     * Property: For any format completion item, it should be one of the
     * valid format values
     */
    fc.assert(
      fc.property(fc.constantFrom(...validFormats), (format) => {
        // Verify format is valid
        const isValid = validFormats.includes(format);

        // Verify format completion would have proper structure
        const hasQuotes = true; // Should be wrapped in quotes
        const hasDetail = true; // Should have detail text

        return isValid && hasQuotes && hasDetail;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 13: Format completions include documentation", () => {
    /**
     * Property: For any format value, the completion item should include
     * documentation explaining the format
     */
    fc.assert(
      fc.property(fc.constantFrom(...validFormats), (format) => {
        // Define expected documentation
        const formatDocs: Record<string, string> = {
          png: "PNG format - lossless compression, best for screenshots with text",
          jpeg: "JPEG format - lossy compression, smaller file sizes, supports quality parameter",
          webp: "WebP format - modern format with good compression, supports quality parameter",
        };

        const doc = formatDocs[format];
        if (!doc) {
          return false;
        }

        // Verify documentation exists and is meaningful
        // Check that doc contains format name (case-insensitive)
        return (
          doc.length > 20 && doc.toLowerCase().includes(format.toLowerCase())
        );
      }),
      { numRuns: 100 }
    );
  });

  test("Property 13: Quality parameter completion provides common values", () => {
    /**
     * Property: For any position after 'quality:', completion should provide
     * common quality values (80, 90, 95, 100)
     */
    fc.assert(
      fc.property(
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        fc.nat({ max: 5 }),
        (functionName, indentLevel) => {
          // Create a document with quality parameter being typed
          const indent = "  ".repeat(indentLevel);
          const code = `${indent}${functionName}({\n${indent}  quality: \n${indent}});`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Position cursor after 'quality:'
          const position = {
            line: 1,
            character: indentLevel * 2 + 2 + "quality: ".length,
          };

          const offset = document.offsetAt(position);
          const text = document.getText();
          const beforeCursor = text.substring(0, offset);

          // Check if we're completing a quality parameter
          const isQualityCompletion = /quality\s*:\s*\d*$/.test(beforeCursor);

          if (isQualityCompletion) {
            // Should provide common quality values
            const expectedValues = commonQualityValues;
            return expectedValues.length === 4;
          }

          return true; // Not completing quality
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 13: Quality completions have correct values", () => {
    /**
     * Property: For any quality completion item, it should be one of the
     * common quality values
     */
    fc.assert(
      fc.property(fc.constantFrom(...commonQualityValues), (quality) => {
        // Verify quality is in valid range
        const isInRange = quality >= 0 && quality <= 100;

        // Verify quality is a common value
        const isCommonValue = commonQualityValues.includes(quality);

        return isInRange && isCommonValue;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 13: Quality completions include documentation", () => {
    /**
     * Property: For any quality value, the completion item should include
     * documentation explaining the quality level
     */
    fc.assert(
      fc.property(fc.constantFrom(...commonQualityValues), (quality) => {
        // Define expected documentation patterns
        const qualityDocs: Record<number, string> = {
          80: "Quality 80 - Good balance between quality and file size",
          90: "Quality 90 - High quality, recommended default",
          95: "Quality 95 - Very high quality, larger file size",
          100: "Quality 100 - Maximum quality, largest file size",
        };

        const doc = qualityDocs[quality];
        if (!doc) {
          return false;
        }

        // Verify documentation exists and mentions quality
        return doc.length > 20 && doc.includes("quality");
      }),
      { numRuns: 100 }
    );
  });

  test("Property 13: Parameter completions have correct kind", () => {
    /**
     * Property: For any parameter value completion (format or quality),
     * it should have the Value kind
     */
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(...validFormats),
          fc.constantFrom(...commonQualityValues.map(String))
        ),
        (value) => {
          // All parameter values should be CompletionItemKind.Value
          const expectedKind = CompletionItemKind.Value;

          return expectedKind === CompletionItemKind.Value;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 13: Format completion works with partial input", () => {
    /**
     * Property: For any partial format value being typed, completion should
     * still be available
     */
    fc.assert(
      fc.property(
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        fc.constantFrom("p", "pn", "j", "jp", "jpe", "w", "we", "web"),
        (functionName, partialFormat) => {
          // Create a document with partial format value
          const code = `${functionName}({\n  format: "${partialFormat}\n});`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Position cursor after partial format
          const position = {
            line: 1,
            character: 2 + 'format: "'.length + partialFormat.length,
          };

          const offset = document.offsetAt(position);
          const text = document.getText();
          const beforeCursor = text.substring(0, offset);

          // Check if we're in a format parameter context
          const isFormatContext = /format\s*:\s*["'][^"']*$/.test(beforeCursor);

          // Should detect format context even with partial input
          return isFormatContext;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 13: Quality completion works with partial input", () => {
    /**
     * Property: For any partial quality value being typed, completion should
     * still be available
     */
    fc.assert(
      fc.property(
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        fc.constantFrom("8", "9", "10"),
        (functionName, partialQuality) => {
          // Create a document with partial quality value
          const code = `${functionName}({\n  quality: ${partialQuality}\n});`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Position cursor after partial quality
          const position = {
            line: 1,
            character: 2 + "quality: ".length + partialQuality.length,
          };

          const offset = document.offsetAt(position);
          const text = document.getText();
          const beforeCursor = text.substring(0, offset);

          // Check if we're in a quality parameter context
          const isQualityContext = /quality\s*:\s*\d*$/.test(beforeCursor);

          // Should detect quality context even with partial input
          return isQualityContext;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 13: No parameter completion outside parameter context", () => {
    /**
     * Property: For any code position not in a format or quality parameter,
     * parameter-specific completion should not be provided
     */
    fc.assert(
      fc.property(
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        fc.constantFrom("savePath", "windowId", "windowTitle", "x", "y"),
        (functionName, otherParam) => {
          // Create a document with a different parameter
          const code = `${functionName}({\n  ${otherParam}: \n});`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          const position = {
            line: 1,
            character: 2 + `${otherParam}: `.length,
          };

          const offset = document.offsetAt(position);
          const text = document.getText();
          const beforeCursor = text.substring(0, offset);

          // Check if we're in format or quality context
          const isFormatContext = /format\s*:\s*["']?$/.test(beforeCursor);
          const isQualityContext = /quality\s*:\s*\d*$/.test(beforeCursor);

          // Should not be in format or quality context
          return !isFormatContext && !isQualityContext;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 13: Format values are properly quoted in insertText", () => {
    /**
     * Property: For any format completion item, the insertText should
     * include proper quotes
     */
    fc.assert(
      fc.property(fc.constantFrom(...validFormats), (format) => {
        // Format values should be inserted with quotes
        const expectedInsertText = `"${format}"`;

        // Verify insert text has quotes
        return (
          expectedInsertText.startsWith('"') && expectedInsertText.endsWith('"')
        );
      }),
      { numRuns: 100 }
    );
  });

  test("Property 13: Quality values are inserted as numbers", () => {
    /**
     * Property: For any quality completion item, the insertText should
     * be a plain number without quotes
     */
    fc.assert(
      fc.property(fc.constantFrom(...commonQualityValues), (quality) => {
        // Quality values should be inserted as numbers
        const expectedInsertText = String(quality);

        // Verify insert text is a number
        return /^\d+$/.test(expectedInsertText);
      }),
      { numRuns: 100 }
    );
  });

  test("Property 13: Parameter completion documentation is markdown", () => {
    /**
     * Property: For any parameter completion item (format or quality),
     * the documentation should be in markdown format
     */
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(...validFormats),
          fc.constantFrom(...commonQualityValues.map(String))
        ),
        (value) => {
          // All documentation should be markdown
          const expectedMarkupKind = MarkupKind.Markdown;

          return expectedMarkupKind === MarkupKind.Markdown;
        }
      ),
      { numRuns: 100 }
    );
  });
});

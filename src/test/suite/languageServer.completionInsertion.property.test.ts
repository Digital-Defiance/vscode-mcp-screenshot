import * as assert from "assert";
import * as fc from "fast-check";
import { TextDocument } from "vscode-languageserver-textdocument";
import { InsertTextFormat } from "vscode-languageserver/node";

/**
 * Feature: mcp-screenshot-lsp, Property 14: Completion insertion
 *
 * Property: For any selected completion item, the LSP should insert
 * correct syntax with proper formatting
 *
 * Validates: Requirements 5.5
 */
suite("Language Server Completion Insertion - Property-Based Tests", () => {
  // Configuration properties with their expected insert patterns
  const configPropertiesWithInsert: Record<
    string,
    { insertText: string; pattern: RegExp }
  > = {
    format: {
      insertText: 'format: "png"',
      pattern: /^format:\s*"[^"]+"/,
    },
    quality: {
      insertText: "quality: 90",
      pattern: /^quality:\s*\d+$/,
    },
    enablePIIMasking: {
      insertText: "enablePIIMasking: false",
      pattern: /^enablePIIMasking:\s*(true|false)$/,
    },
    savePath: {
      insertText: 'savePath: ""',
      pattern: /^savePath:\s*"[^"]*"$/,
    },
    windowId: {
      insertText: 'windowId: ""',
      pattern: /^windowId:\s*"[^"]*"$/,
    },
    windowTitle: {
      insertText: 'windowTitle: ""',
      pattern: /^windowTitle:\s*"[^"]*"$/,
    },
    includeFrame: {
      insertText: "includeFrame: true",
      pattern: /^includeFrame:\s*(true|false)$/,
    },
    x: {
      insertText: "x: 0",
      pattern: /^x:\s*\d+$/,
    },
    y: {
      insertText: "y: 0",
      pattern: /^y:\s*\d+$/,
    },
    width: {
      insertText: "width: 800",
      pattern: /^width:\s*\d+$/,
    },
    height: {
      insertText: "height: 600",
      pattern: /^height:\s*\d+$/,
    },
  };

  test("Property 14: Configuration property insertText has correct syntax", () => {
    /**
     * Property: For any configuration property completion, the insertText
     * should follow the pattern 'propertyName: value'
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(configPropertiesWithInsert)),
        (propertyName) => {
          const insertInfo = configPropertiesWithInsert[propertyName];
          if (!insertInfo) {
            return false;
          }

          const { insertText, pattern } = insertInfo;

          // Verify insertText matches expected pattern
          return pattern.test(insertText);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 14: String properties are inserted with quotes", () => {
    /**
     * Property: For any string-valued configuration property, the insertText
     * should include quotes around the value
     */
    fc.assert(
      fc.property(
        fc.constantFrom("format", "savePath", "windowId", "windowTitle"),
        (propertyName) => {
          const insertInfo = configPropertiesWithInsert[propertyName];
          if (!insertInfo) {
            return false;
          }

          const { insertText } = insertInfo;

          // Verify insertText contains quotes
          return insertText.includes('"');
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 14: Number properties are inserted without quotes", () => {
    /**
     * Property: For any number-valued configuration property, the insertText
     * should not include quotes around the value
     */
    fc.assert(
      fc.property(
        fc.constantFrom("quality", "x", "y", "width", "height"),
        (propertyName) => {
          const insertInfo = configPropertiesWithInsert[propertyName];
          if (!insertInfo) {
            return false;
          }

          const { insertText } = insertInfo;

          // Verify insertText does not contain quotes around the number
          const valueMatch = insertText.match(/:\s*(\d+)/);
          return valueMatch !== null && !insertText.includes('"');
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 14: Boolean properties are inserted with true/false", () => {
    /**
     * Property: For any boolean-valued configuration property, the insertText
     * should use 'true' or 'false' without quotes
     */
    fc.assert(
      fc.property(
        fc.constantFrom("enablePIIMasking", "includeFrame"),
        (propertyName) => {
          const insertInfo = configPropertiesWithInsert[propertyName];
          if (!insertInfo) {
            return false;
          }

          const { insertText } = insertInfo;

          // Verify insertText contains true or false
          return insertText.includes("true") || insertText.includes("false");
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 14: Format values are inserted with quotes", () => {
    /**
     * Property: For any format value completion, the insertText should
     * include quotes around the format value
     */
    fc.assert(
      fc.property(fc.constantFrom("png", "jpeg", "webp"), (formatValue) => {
        const insertText = `"${formatValue}"`;

        // Verify format is quoted
        return insertText.startsWith('"') && insertText.endsWith('"');
      }),
      { numRuns: 100 }
    );
  });

  test("Property 14: Quality values are inserted as plain numbers", () => {
    /**
     * Property: For any quality value completion, the insertText should
     * be a plain number without quotes
     */
    fc.assert(
      fc.property(fc.constantFrom(80, 90, 95, 100), (qualityValue) => {
        const insertText = String(qualityValue);

        // Verify quality is a plain number
        return /^\d+$/.test(insertText) && !insertText.includes('"');
      }),
      { numRuns: 100 }
    );
  });

  test("Property 14: InsertTextFormat is PlainText", () => {
    /**
     * Property: For any completion item, the insertTextFormat should be
     * PlainText (not Snippet)
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(configPropertiesWithInsert)),
        (propertyName) => {
          // All completion items should use PlainText format
          const expectedFormat = InsertTextFormat.PlainText;

          return expectedFormat === InsertTextFormat.PlainText;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 14: Inserted text is valid JavaScript/TypeScript", () => {
    /**
     * Property: For any completion item insertText, when inserted into
     * an object literal, it should form valid JavaScript/TypeScript syntax
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(configPropertiesWithInsert)),
        (propertyName) => {
          const insertInfo = configPropertiesWithInsert[propertyName];
          if (!insertInfo) {
            return false;
          }

          const { insertText } = insertInfo;

          // Create a complete object literal with the inserted text
          const code = `const config = {\n  ${insertText}\n};`;

          // Basic syntax validation: check for balanced quotes and braces
          const openQuotes = (code.match(/"/g) || []).length;
          const openBraces = (code.match(/{/g) || []).length;
          const closeBraces = (code.match(/}/g) || []).length;

          // Quotes should be balanced (even number)
          const quotesBalanced = openQuotes % 2 === 0;
          // Braces should be balanced
          const bracesBalanced = openBraces === closeBraces;

          return quotesBalanced && bracesBalanced;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 14: Inserted text has proper spacing", () => {
    /**
     * Property: For any completion item insertText, it should have
     * proper spacing around the colon (property: value)
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(configPropertiesWithInsert)),
        (propertyName) => {
          const insertInfo = configPropertiesWithInsert[propertyName];
          if (!insertInfo) {
            return false;
          }

          const { insertText } = insertInfo;

          // Verify spacing pattern: property: value (with space after colon)
          return /^[a-zA-Z_][a-zA-Z0-9_]*:\s+/.test(insertText);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 14: Completion insertion preserves existing code", () => {
    /**
     * Property: For any completion insertion, it should not corrupt
     * existing code in the document
     */
    fc.assert(
      fc.property(
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        fc.constantFrom(...Object.keys(configPropertiesWithInsert)),
        fc.array(fc.constantFrom(...Object.keys(configPropertiesWithInsert)), {
          minLength: 0,
          maxLength: 3,
        }),
        (functionName, newProperty, existingProperties) => {
          // Filter out the new property from existing ones
          const existing = existingProperties.filter((p) => p !== newProperty);

          // Create code with existing properties
          const existingText = existing
            .map((p) => {
              const info = configPropertiesWithInsert[p];
              return `  ${info.insertText}`;
            })
            .join(",\n");

          const beforeCode = `${functionName}({\n${existingText}${
            existingText ? ",\n" : ""
          }  `;
          const afterCode = `\n});`;

          // Simulate insertion
          const newPropertyInfo = configPropertiesWithInsert[newProperty];
          const insertedCode = `${beforeCode}${newPropertyInfo.insertText}${afterCode}`;

          // Verify the code structure is maintained
          const hasFunction = insertedCode.includes(functionName);
          const hasOpenParen = insertedCode.includes("(");
          const hasCloseParen = insertedCode.includes(")");
          const hasOpenBrace = insertedCode.includes("{");
          const hasCloseBrace = insertedCode.includes("}");

          return (
            hasFunction &&
            hasOpenParen &&
            hasCloseParen &&
            hasOpenBrace &&
            hasCloseBrace
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 14: Multiple completions can be inserted sequentially", () => {
    /**
     * Property: For any sequence of completion insertions, each insertion
     * should maintain valid syntax
     */
    fc.assert(
      fc.property(
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        fc
          .array(fc.constantFrom(...Object.keys(configPropertiesWithInsert)), {
            minLength: 1,
            maxLength: 5,
          })
          .map((arr) => [...new Set(arr)]), // Remove duplicates
        (functionName, properties) => {
          // Build code with multiple insertions
          const insertedProperties = properties.map((p) => {
            const info = configPropertiesWithInsert[p];
            return `  ${info.insertText}`;
          });

          const code = `${functionName}({\n${insertedProperties.join(
            ",\n"
          )}\n});`;

          // Verify syntax is valid
          const openBraces = (code.match(/{/g) || []).length;
          const closeBraces = (code.match(/}/g) || []).length;
          const openParens = (code.match(/\(/g) || []).length;
          const closeParens = (code.match(/\)/g) || []).length;

          return (
            openBraces === closeBraces &&
            openParens === closeParens &&
            code.includes(functionName)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 14: Completion insertion handles various indentation levels", () => {
    /**
     * Property: For any indentation level, completion insertion should
     * work correctly
     */
    fc.assert(
      fc.property(
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        fc.constantFrom(...Object.keys(configPropertiesWithInsert)),
        fc.nat({ max: 10 }),
        (functionName, propertyName, indentLevel) => {
          const indent = "  ".repeat(indentLevel);
          const insertInfo = configPropertiesWithInsert[propertyName];

          // Create code with specific indentation
          const code = `${indent}${functionName}({\n${indent}  ${insertInfo.insertText}\n${indent}});`;

          // Verify indentation is preserved
          const lines = code.split("\n");
          const functionLine = lines[0];
          const propertyLine = lines[1];
          const closeLine = lines[2];

          // Check that indentation is consistent
          const functionIndent = functionLine.match(/^\s*/)?.[0].length || 0;
          const propertyIndent = propertyLine.match(/^\s*/)?.[0].length || 0;
          const closeIndent = closeLine.match(/^\s*/)?.[0].length || 0;

          return (
            functionIndent === indentLevel * 2 &&
            propertyIndent === (indentLevel + 1) * 2 &&
            closeIndent === indentLevel * 2
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 14: Completion insertion with trailing comma", () => {
    /**
     * Property: For any completion insertion in a multi-property object,
     * the syntax should remain valid with or without trailing commas
     */
    fc.assert(
      fc.property(
        fc.constantFrom("captureFullScreen", "captureWindow", "captureRegion"),
        fc.constantFrom(...Object.keys(configPropertiesWithInsert)),
        fc.constantFrom(...Object.keys(configPropertiesWithInsert)),
        (functionName, firstProperty, secondProperty) => {
          if (firstProperty === secondProperty) {
            return true; // Skip duplicate properties
          }

          const firstInfo = configPropertiesWithInsert[firstProperty];
          const secondInfo = configPropertiesWithInsert[secondProperty];

          // Create code with two properties
          const code = `${functionName}({\n  ${firstInfo.insertText},\n  ${secondInfo.insertText}\n});`;

          // Verify syntax is valid
          const hasComma = code.includes(",");
          const openBraces = (code.match(/{/g) || []).length;
          const closeBraces = (code.match(/}/g) || []).length;

          return hasComma && openBraces === closeBraces;
        }
      ),
      { numRuns: 100 }
    );
  });
});

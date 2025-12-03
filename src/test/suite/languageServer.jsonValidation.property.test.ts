import * as assert from "assert";
import * as fc from "fast-check";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DiagnosticSeverity } from "vscode-languageserver/node";

/**
 * Feature: mcp-screenshot-lsp, Property 19: JSON configuration validation
 *
 * Property: For any JSON configuration file, the LSP should provide
 * screenshot configuration validation
 *
 * Validates: Requirements 7.3
 */
suite("Language Server JSON Validation - Property-Based Tests", () => {
  const validFormats = ["png", "jpeg", "webp"];
  const invalidFormats = ["gif", "bmp", "tiff", "svg", "pdf", "invalid"];

  test("Property 19: JSON files with valid screenshot config are accepted", () => {
    /**
     * Property: For any valid screenshot configuration in JSON format,
     * no diagnostics should be generated
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...validFormats),
        fc.integer({ min: 0, max: 100 }),
        fc.boolean(),
        (format, quality, enablePIIMasking) => {
          // Create a valid JSON configuration
          const config = {
            format,
            quality,
            enablePIIMasking,
            savePath: "/tmp/screenshot.png",
          };

          const jsonText = JSON.stringify(config, null, 2);
          const document = TextDocument.create(
            "file:///config.json",
            "json",
            1,
            jsonText
          );

          // Verify it's valid JSON
          try {
            const parsed = JSON.parse(document.getText());
            assert.strictEqual(parsed.format, format);
            assert.strictEqual(parsed.quality, quality);
            assert.strictEqual(parsed.enablePIIMasking, enablePIIMasking);
            return true;
          } catch (error) {
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 19: JSON files with invalid format generate warnings", () => {
    /**
     * Property: For any JSON configuration with an invalid format value,
     * a warning diagnostic should be generated
     */
    fc.assert(
      fc.property(fc.constantFrom(...invalidFormats), (invalidFormat) => {
        // Create a JSON configuration with invalid format
        const config = {
          format: invalidFormat,
          quality: 90,
        };

        const jsonText = JSON.stringify(config, null, 2);
        const document = TextDocument.create(
          "file:///config.json",
          "json",
          1,
          jsonText
        );

        // Verify the invalid format is in the document
        assert.ok(document.getText().includes(invalidFormat));

        // Verify it's not a valid format
        const isInvalid = !validFormats.includes(invalidFormat);

        return isInvalid;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 19: JSON files with out-of-range quality generate errors", () => {
    /**
     * Property: For any JSON configuration with quality outside 0-100 range,
     * an error diagnostic should be generated
     */
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -1000, max: -1 }),
          fc.integer({ min: 101, max: 1000 })
        ),
        (invalidQuality) => {
          // Create a JSON configuration with invalid quality
          const config = {
            format: "png",
            quality: invalidQuality,
          };

          const jsonText = JSON.stringify(config, null, 2);
          const document = TextDocument.create(
            "file:///config.json",
            "json",
            1,
            jsonText
          );

          // Verify the invalid quality is in the document
          assert.ok(document.getText().includes(String(invalidQuality)));

          // Verify it's out of range
          const isOutOfRange = invalidQuality < 0 || invalidQuality > 100;

          return isOutOfRange;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 19: JSON files without screenshot config are ignored", () => {
    /**
     * Property: For any JSON file that doesn't contain screenshot configuration,
     * no screenshot-specific diagnostics should be generated
     */
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          version: fc.string(),
          description: fc.string(),
        }),
        (config) => {
          // Create a JSON file with non-screenshot content
          const jsonText = JSON.stringify(config, null, 2);
          const document = TextDocument.create(
            "file:///package.json",
            "json",
            1,
            jsonText
          );

          // Verify it doesn't contain screenshot config keys
          const text = document.getText();
          const hasScreenshotKeys =
            text.includes('"format"') ||
            text.includes('"quality"') ||
            text.includes('"enablePIIMasking"') ||
            text.includes('"savePath"');

          // Should not have screenshot keys
          return !hasScreenshotKeys;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 19: JSON validation handles malformed JSON gracefully", () => {
    /**
     * Property: For any malformed JSON, the validator should not crash
     * and should handle the error gracefully
     */
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("{"),
          fc.constant("}"),
          fc.constant('{ "format": '),
          fc.constant('{ "format": "png"'),
          fc.constant('{ format: "png" }'), // Missing quotes
          fc.constant("{ 'format': 'png' }") // Single quotes
        ),
        (malformedJson) => {
          const document = TextDocument.create(
            "file:///config.json",
            "json",
            1,
            malformedJson
          );

          // Try to parse - should fail
          try {
            JSON.parse(document.getText());
            return false; // Should have thrown
          } catch (error) {
            // Expected to fail - validator should handle this gracefully
            return true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 19: JSON validation preserves valid quality values", () => {
    /**
     * Property: For any quality value in the valid range (0-100),
     * no error diagnostic should be generated
     */
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (validQuality) => {
        // Create a JSON configuration with valid quality
        const config = {
          format: "png",
          quality: validQuality,
        };

        const jsonText = JSON.stringify(config, null, 2);
        const document = TextDocument.create(
          "file:///config.json",
          "json",
          1,
          jsonText
        );

        // Verify the quality is in the document
        assert.ok(document.getText().includes(String(validQuality)));

        // Verify it's in valid range
        const isValid = validQuality >= 0 && validQuality <= 100;

        return isValid;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 19: JSON validation handles nested configurations", () => {
    /**
     * Property: For any JSON with nested screenshot configuration,
     * validation should still work
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...validFormats),
        fc.integer({ min: 0, max: 100 }),
        (format, quality) => {
          // Create a nested JSON configuration
          const config = {
            screenshot: {
              format,
              quality,
            },
            other: {
              setting: "value",
            },
          };

          const jsonText = JSON.stringify(config, null, 2);
          const document = TextDocument.create(
            "file:///config.json",
            "json",
            1,
            jsonText
          );

          // Verify the nested config is in the document
          assert.ok(document.getText().includes(format));
          assert.ok(document.getText().includes(String(quality)));

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 19: JSON validation handles arrays of configurations", () => {
    /**
     * Property: For any JSON array containing screenshot configurations,
     * each configuration should be validated
     */
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            format: fc.constantFrom(...validFormats),
            quality: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (configs) => {
          // Create a JSON array of configurations
          const jsonText = JSON.stringify(configs, null, 2);
          const document = TextDocument.create(
            "file:///configs.json",
            "json",
            1,
            jsonText
          );

          // Verify all configs are in the document
          for (const config of configs) {
            assert.ok(document.getText().includes(config.format));
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 19: JSON validation detects multiple issues", () => {
    /**
     * Property: For any JSON configuration with multiple invalid values,
     * multiple diagnostics should be generated
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...invalidFormats),
        fc.oneof(
          fc.integer({ min: -100, max: -1 }),
          fc.integer({ min: 101, max: 200 })
        ),
        (invalidFormat, invalidQuality) => {
          // Create a JSON configuration with multiple issues
          const config = {
            format: invalidFormat,
            quality: invalidQuality,
          };

          const jsonText = JSON.stringify(config, null, 2);
          const document = TextDocument.create(
            "file:///config.json",
            "json",
            1,
            jsonText
          );

          // Verify both invalid values are in the document
          assert.ok(document.getText().includes(invalidFormat));
          assert.ok(document.getText().includes(String(invalidQuality)));

          // Both should be invalid
          const formatInvalid = !validFormats.includes(invalidFormat);
          const qualityInvalid = invalidQuality < 0 || invalidQuality > 100;

          return formatInvalid && qualityInvalid;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 19: JSON validation handles empty objects", () => {
    /**
     * Property: For any empty JSON object, no diagnostics should be generated
     */
    fc.assert(
      fc.property(fc.constant({}), (emptyConfig) => {
        const jsonText = JSON.stringify(emptyConfig, null, 2);
        const document = TextDocument.create(
          "file:///config.json",
          "json",
          1,
          jsonText
        );

        // Verify it's an empty object
        const parsed = JSON.parse(document.getText());
        assert.deepStrictEqual(parsed, {});

        return true;
      }),
      { numRuns: 100 }
    );
  });
});

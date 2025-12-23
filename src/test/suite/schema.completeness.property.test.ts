import * as assert from "assert";
import * as fc from "fast-check";
import * as path from "path";
import * as fs from "fs";

/**
 * Feature: screenshot-savepath-fix, Property 1: All screenshot capture tools include savePath in schema
 *
 * Property: For any screenshot capture tool (full, region, window), the tool's inputSchema
 * should include a savePath property with type string
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 3.5
 */
suite("Schema Completeness - Property-Based Tests", () => {
  let packageJson: any;

  suiteSetup(() => {
    // Load package.json
    const packageJsonPath = path.join(__dirname, "../../../package.json");
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
    packageJson = JSON.parse(packageJsonContent);
  });

  test("Property 1: All screenshot capture tools include savePath in schema", () => {
    // **Feature: screenshot-savepath-fix, Property 1: All screenshot capture tools include savePath in schema**

    /**
     * Property: For any screenshot capture tool from the set {screenshot_capture_full,
     * screenshot_capture_region, screenshot_capture_window}, the tool's inputSchema
     * should include a savePath property with type "string"
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "screenshot_capture_full",
          "screenshot_capture_region",
          "screenshot_capture_window"
        ),
        (toolName) => {
          const languageModelTools =
            packageJson.contributes?.languageModelTools;

          // Find the tool
          const tool = languageModelTools.find((t: any) => t.name === toolName);

          // Tool should exist
          if (!tool) {
            return false;
          }

          // Tool should have inputSchema
          if (!tool.inputSchema) {
            return false;
          }

          // inputSchema should have properties
          if (!tool.inputSchema.properties) {
            return false;
          }

          // savePath should exist in properties
          if (!tool.inputSchema.properties.savePath) {
            return false;
          }

          // savePath should have type "string"
          if (tool.inputSchema.properties.savePath.type !== "string") {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 1: savePath description mentions optional and base64", () => {
    /**
     * Property: For any screenshot capture tool, the savePath description
     * should mention that it is optional and that base64 is returned if not provided
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "screenshot_capture_full",
          "screenshot_capture_region",
          "screenshot_capture_window"
        ),
        (toolName) => {
          const languageModelTools =
            packageJson.contributes?.languageModelTools;
          const tool = languageModelTools.find((t: any) => t.name === toolName);

          if (!tool?.inputSchema?.properties?.savePath?.description) {
            return false;
          }

          const description = tool.inputSchema.properties.savePath.description;

          // Description should mention "optional"
          if (!description.toLowerCase().includes("optional")) {
            return false;
          }

          // Description should mention "base64"
          if (!description.toLowerCase().includes("base64")) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

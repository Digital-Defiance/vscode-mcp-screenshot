import * as assert from "assert";
import * as fc from "fast-check";
import * as path from "path";
import * as fs from "fs";

/**
 * Feature: screenshot-savepath-fix, Property 2: savePath is optional in all tool schemas
 *
 * Property: For any screenshot capture tool (full, region, window), the savePath property
 * should not be in the required array
 *
 * Validates: Requirements 3.4
 */
suite("Schema Optional Parameter - Property-Based Tests", () => {
  let packageJson: any;

  suiteSetup(() => {
    // Load package.json
    const packageJsonPath = path.join(__dirname, "../../../package.json");
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
    packageJson = JSON.parse(packageJsonContent);
  });

  test("Property 2: savePath is optional in all tool schemas", () => {
    // **Feature: screenshot-savepath-fix, Property 2: savePath is optional in all tool schemas**

    /**
     * Property: For any screenshot capture tool from the set {screenshot_capture_full,
     * screenshot_capture_region, screenshot_capture_window}, the savePath property
     * should not be in the required array (or the required array should not exist)
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

          // If there's no required array, savePath is optional (good)
          if (!tool.inputSchema.required) {
            return true;
          }

          // If there is a required array, savePath should NOT be in it
          const required = tool.inputSchema.required;
          if (Array.isArray(required) && required.includes("savePath")) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 2: Other required parameters remain required", () => {
    /**
     * Property: For screenshot_capture_region, the required parameters
     * (x, y, width, height) should still be in the required array
     */
    fc.assert(
      fc.property(fc.constant("screenshot_capture_region"), (toolName) => {
        const languageModelTools = packageJson.contributes?.languageModelTools;
        const tool = languageModelTools.find((t: any) => t.name === toolName);

        if (!tool?.inputSchema) {
          return false;
        }

        // screenshot_capture_region should have required array
        if (
          !tool.inputSchema.required ||
          !Array.isArray(tool.inputSchema.required)
        ) {
          return false;
        }

        const required = tool.inputSchema.required;

        // Should include x, y, width, height
        const expectedRequired = ["x", "y", "width", "height"];
        for (const param of expectedRequired) {
          if (!required.includes(param)) {
            return false;
          }
        }

        // Should NOT include savePath
        if (required.includes("savePath")) {
          return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 2: Tools without required parameters have no required array or empty array", () => {
    /**
     * Property: For screenshot_capture_full and screenshot_capture_window,
     * the required array should either not exist or be empty (since all params are optional)
     */
    fc.assert(
      fc.property(
        fc.constantFrom("screenshot_capture_full", "screenshot_capture_window"),
        (toolName) => {
          const languageModelTools =
            packageJson.contributes?.languageModelTools;
          const tool = languageModelTools.find((t: any) => t.name === toolName);

          if (!tool?.inputSchema) {
            return false;
          }

          // Either no required array, or empty required array
          if (!tool.inputSchema.required) {
            return true;
          }

          if (
            Array.isArray(tool.inputSchema.required) &&
            tool.inputSchema.required.length === 0
          ) {
            return true;
          }

          // If there's a non-empty required array, that's unexpected for these tools
          return false;
        }
      ),
      { numRuns: 100 }
    );
  });
});

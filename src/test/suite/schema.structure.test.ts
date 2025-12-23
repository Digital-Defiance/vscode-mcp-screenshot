import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";

/**
 * Schema Structure Tests for savePath parameter
 * Tests that all screenshot capture tools include the savePath parameter
 * in their inputSchema definitions
 */
suite("Schema Structure Tests - savePath Parameter", () => {
  let packageJson: any;

  suiteSetup(() => {
    // Load package.json
    const packageJsonPath = path.join(__dirname, "../../../package.json");
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
    packageJson = JSON.parse(packageJsonContent);
  });

  test("4.1: All screenshot capture tools include savePath parameter", () => {
    // Get language model tools from package.json
    const languageModelTools = packageJson.contributes?.languageModelTools;
    assert.ok(
      languageModelTools,
      "languageModelTools should exist in package.json"
    );

    // Define the screenshot capture tools that should have savePath
    const screenshotCaptureTools = [
      "screenshot_capture_full",
      "screenshot_capture_region",
      "screenshot_capture_window",
    ];

    // Test each screenshot capture tool
    for (const toolName of screenshotCaptureTools) {
      const tool = languageModelTools.find((t: any) => t.name === toolName);
      assert.ok(tool, `Tool ${toolName} should exist in languageModelTools`);

      // Verify inputSchema exists
      assert.ok(tool.inputSchema, `Tool ${toolName} should have inputSchema`);

      // Verify inputSchema has properties
      assert.ok(
        tool.inputSchema.properties,
        `Tool ${toolName} inputSchema should have properties`
      );

      // Verify savePath property exists
      assert.ok(
        tool.inputSchema.properties.savePath,
        `Tool ${toolName} should have savePath in inputSchema properties`
      );

      // Verify savePath has type "string"
      assert.strictEqual(
        tool.inputSchema.properties.savePath.type,
        "string",
        `Tool ${toolName} savePath should have type "string"`
      );

      // Verify savePath has appropriate description
      assert.ok(
        tool.inputSchema.properties.savePath.description,
        `Tool ${toolName} savePath should have a description`
      );

      assert.ok(
        tool.inputSchema.properties.savePath.description.includes("optional"),
        `Tool ${toolName} savePath description should mention it is optional`
      );

      assert.ok(
        tool.inputSchema.properties.savePath.description.includes("base64"),
        `Tool ${toolName} savePath description should mention base64 fallback`
      );
    }
  });

  test("4.1: screenshot_capture_full has savePath with correct schema", () => {
    const languageModelTools = packageJson.contributes?.languageModelTools;
    const tool = languageModelTools.find(
      (t: any) => t.name === "screenshot_capture_full"
    );

    assert.ok(tool, "screenshot_capture_full tool should exist");
    assert.ok(tool.inputSchema.properties.savePath, "savePath should exist");
    assert.strictEqual(
      tool.inputSchema.properties.savePath.type,
      "string",
      "savePath type should be string"
    );
    assert.strictEqual(
      tool.inputSchema.properties.savePath.description,
      "File path to save screenshot (optional, returns base64 if not provided)",
      "savePath should have correct description"
    );
  });

  test("4.1: screenshot_capture_region has savePath with correct schema", () => {
    const languageModelTools = packageJson.contributes?.languageModelTools;
    const tool = languageModelTools.find(
      (t: any) => t.name === "screenshot_capture_region"
    );

    assert.ok(tool, "screenshot_capture_region tool should exist");
    assert.ok(tool.inputSchema.properties.savePath, "savePath should exist");
    assert.strictEqual(
      tool.inputSchema.properties.savePath.type,
      "string",
      "savePath type should be string"
    );
    assert.strictEqual(
      tool.inputSchema.properties.savePath.description,
      "File path to save screenshot (optional, returns base64 if not provided)",
      "savePath should have correct description"
    );
  });

  test("4.1: screenshot_capture_window has savePath with correct schema", () => {
    const languageModelTools = packageJson.contributes?.languageModelTools;
    const tool = languageModelTools.find(
      (t: any) => t.name === "screenshot_capture_window"
    );

    assert.ok(tool, "screenshot_capture_window tool should exist");
    assert.ok(tool.inputSchema.properties.savePath, "savePath should exist");
    assert.strictEqual(
      tool.inputSchema.properties.savePath.type,
      "string",
      "savePath type should be string"
    );
    assert.strictEqual(
      tool.inputSchema.properties.savePath.description,
      "File path to save screenshot (optional, returns base64 if not provided)",
      "savePath should have correct description"
    );
  });
});

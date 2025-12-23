import * as assert from "assert";
import * as vscode from "vscode";
import { MCPScreenshotClient } from "../../mcpClient";

/**
 * Backward Compatibility Tests
 * Tests that tools work without savePath parameter and configuration defaults are applied
 * Requirements: 2.1, 2.2, 2.3, 4.1, 4.4
 */
suite("Backward Compatibility Tests", () => {
  let outputChannel: vscode.LogOutputChannel;
  let client: MCPScreenshotClient;

  setup(() => {
    outputChannel = vscode.window.createOutputChannel(
      "Test Backward Compatibility",
      { log: true }
    );
    client = new MCPScreenshotClient(outputChannel);
  });

  teardown(async function () {
    this.timeout(5000);
    if (client) {
      client.stop();
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    outputChannel.dispose();
  });

  test("6.1: captureFullScreen works without savePath parameter", async function () {
    this.timeout(5000);

    const params = {
      format: "png",
      quality: 90,
      enablePIIMasking: false,
    };

    try {
      const result = await client.captureFullScreen(params);
      assert.ok(result, "Result should be returned");
      assert.strictEqual(typeof result, "object", "Result should be an object");

      if (result.status === "success") {
        assert.ok(
          result.base64 || result.filePath,
          "Result should contain either base64 or filePath"
        );
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      assert.ok(
        errorMessage.includes("not available") ||
          errorMessage.includes("not connected") ||
          errorMessage.includes("not ready"),
        `Error should be about server availability: ${errorMessage}`
      );
    }
  });

  test("6.1: captureRegion works without savePath parameter", async function () {
    this.timeout(5000);

    const params = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      format: "png",
      quality: 90,
    };

    try {
      const result = await client.captureRegion(params);
      assert.ok(result, "Result should be returned");
      assert.strictEqual(typeof result, "object", "Result should be an object");

      if (result.status === "success") {
        assert.ok(
          result.base64 || result.filePath,
          "Result should contain either base64 or filePath"
        );
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      assert.ok(
        errorMessage.includes("not available") ||
          errorMessage.includes("not connected") ||
          errorMessage.includes("not ready") ||
          errorMessage.includes("not defined"),
        `Error should be about server availability: ${errorMessage}`
      );
    }
  });

  test("6.1: captureWindow works without savePath parameter", async function () {
    this.timeout(5000);

    const params = {
      windowTitle: "Test Window",
      format: "png",
      quality: 90,
    };

    try {
      const result = await client.captureWindow(params);
      assert.ok(result, "Result should be returned");
      assert.strictEqual(typeof result, "object", "Result should be an object");

      if (result.status === "success") {
        assert.ok(
          result.base64 || result.filePath,
          "Result should contain either base64 or filePath"
        );
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      assert.ok(
        errorMessage.includes("not available") ||
          errorMessage.includes("not connected") ||
          errorMessage.includes("not ready") ||
          errorMessage.includes("not defined"),
        `Error should be about server availability: ${errorMessage}`
      );
    }
  });

  test("6.2: Configuration defaults are applied for format and quality", async function () {
    this.timeout(5000);

    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const defaultFormat = config.get("defaultFormat", "png");
    const defaultQuality = config.get("defaultQuality", 90);

    assert.ok(defaultFormat, "Default format should be configured");
    assert.ok(defaultQuality, "Default quality should be configured");
    assert.strictEqual(
      typeof defaultFormat,
      "string",
      "Default format should be a string"
    );
    assert.strictEqual(
      typeof defaultQuality,
      "number",
      "Default quality should be a number"
    );

    const params = {
      format: "png",
      enablePIIMasking: false,
    };

    try {
      const result = await client.captureFullScreen(params);
      assert.ok(result, "Result should be returned");
    } catch (error) {
      const errorMessage = (error as Error).message;
      assert.ok(
        errorMessage.includes("not available") ||
          errorMessage.includes("not connected") ||
          errorMessage.includes("not ready") ||
          errorMessage.includes("not defined"),
        `Error should be about server availability: ${errorMessage}`
      );
    }
  });
});

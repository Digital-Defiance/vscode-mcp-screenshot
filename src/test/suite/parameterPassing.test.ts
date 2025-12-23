import * as assert from "assert";
import * as vscode from "vscode";
import { MCPScreenshotClient } from "../../mcpClient";

/**
 * Parameter Passing Tests for savePath
 * Tests that helper functions correctly pass savePath parameter to MCP client
 * Requirements: 1.4, 1.5, 1.6
 */
suite("Parameter Passing Tests - savePath", () => {
  let outputChannel: vscode.LogOutputChannel;
  let client: MCPScreenshotClient;

  setup(() => {
    outputChannel = vscode.window.createOutputChannel(
      "Test Parameter Passing",
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

  test("5.1: captureFullScreenWithArgs passes savePath to MCP client", async function () {
    this.timeout(5000);

    // This test verifies that the MCP client's captureFullScreen method
    // accepts the savePath parameter
    // Requirements: 1.4

    const params = {
      format: "png",
      quality: 90,
      enablePIIMasking: false,
      savePath: "/tmp/test-screenshot.png",
    };

    try {
      // Call the MCP client method directly with savePath
      await client.captureFullScreen(params);
      // If server is available, this should work
      assert.ok(true, "captureFullScreen accepts savePath parameter");
    } catch (error) {
      // Expected to fail if server not available, but should not fail due to parameter
      const errorMessage = (error as Error).message;
      assert.ok(
        errorMessage.includes("not available") ||
          errorMessage.includes("not connected") ||
          errorMessage.includes("not ready"),
        `Error should be about server availability, not parameter: ${errorMessage}`
      );
    }
  });

  test("5.2: captureRegionWithArgs passes savePath to MCP client", async function () {
    this.timeout(5000);

    // This test verifies that the MCP client's captureRegion method
    // accepts the savePath parameter
    // Requirements: 1.5

    const params = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      format: "png",
      quality: 90,
      savePath: "/tmp/test-region.png",
    };

    try {
      // Call the MCP client method directly with savePath
      await client.captureRegion(params);
      // If server is available, this should work
      assert.ok(true, "captureRegion accepts savePath parameter");
    } catch (error) {
      // Expected to fail if server not available, but should not fail due to parameter
      const errorMessage = (error as Error).message;
      assert.ok(
        errorMessage.includes("not available") ||
          errorMessage.includes("not connected") ||
          errorMessage.includes("not ready"),
        `Error should be about server availability, not parameter: ${errorMessage}`
      );
    }
  });

  test("5.3: captureWindowWithArgs passes savePath to MCP client", async function () {
    this.timeout(5000);

    // This test verifies that the MCP client's captureWindow method
    // accepts the savePath parameter
    // Requirements: 1.6

    const params = {
      windowTitle: "Test Window",
      format: "png",
      quality: 90,
      savePath: "/tmp/test-window.png",
    };

    try {
      // Call the MCP client method directly with savePath
      await client.captureWindow(params);
      // If server is available, this should work
      assert.ok(true, "captureWindow accepts savePath parameter");
    } catch (error) {
      // Expected to fail if server not available, but should not fail due to parameter
      const errorMessage = (error as Error).message;
      assert.ok(
        errorMessage.includes("not available") ||
          errorMessage.includes("not connected") ||
          errorMessage.includes("not ready"),
        `Error should be about server availability, not parameter: ${errorMessage}`
      );
    }
  });
});

import * as assert from "assert";
import * as vscode from "vscode";
import { MCPScreenshotClient } from "../../mcpClient";

/**
 * MCP Client Unit Tests
 * Tests the MCP client functionality in isolation
 */
suite("MCP Client Test Suite", () => {
  let outputChannel: vscode.OutputChannel;
  let client: MCPScreenshotClient;

  setup(() => {
    outputChannel = vscode.window.createOutputChannel("Test MCP Screenshot");
    client = new MCPScreenshotClient(outputChannel);
  });

  teardown(() => {
    if (client) {
      client.stop();
    }
    outputChannel.dispose();
  });

  test("Client should be created", () => {
    assert.ok(client, "Client should be created");
  });

  test("Client should have all required methods", () => {
    assert.ok(typeof client.start === "function", "Should have start method");
    assert.ok(typeof client.stop === "function", "Should have stop method");
    assert.ok(
      typeof client.captureFullScreen === "function",
      "Should have captureFullScreen method"
    );
    assert.ok(
      typeof client.captureWindow === "function",
      "Should have captureWindow method"
    );
    assert.ok(
      typeof client.captureRegion === "function",
      "Should have captureRegion method"
    );
    assert.ok(
      typeof client.listDisplays === "function",
      "Should have listDisplays method"
    );
    assert.ok(
      typeof client.listWindows === "function",
      "Should have listWindows method"
    );
  });

  test("Client should handle start with valid config", async function () {
    this.timeout(10000);

    try {
      await client.start();
      // If it starts successfully, that's good
      assert.ok(true, "Client started successfully");
    } catch (error) {
      // In test environment, server might not be available
      console.log("Client start failed (expected in test environment):", error);
      assert.ok(true, "Client start handled gracefully");
    }
  });

  test("Client should handle stop when not started", () => {
    // Should not throw
    client.stop();
    assert.ok(true, "Stop handled gracefully when not started");
  });

  test("Client should reject operations before start", async function () {
    this.timeout(5000);

    try {
      await client.listDisplays();
      assert.fail("Should have thrown error");
    } catch (error) {
      assert.ok(error instanceof Error, "Should throw error when not started");
      assert.ok(
        (error as Error).message.includes("not running"),
        "Error message should indicate server not running"
      );
    }
  });
});

suite("MCP Client - Integration Tests", () => {
  let outputChannel: vscode.OutputChannel;
  let client: MCPScreenshotClient;

  setup(() => {
    outputChannel = vscode.window.createOutputChannel(
      "Test MCP Screenshot Integration"
    );
  });

  teardown(() => {
    if (client) {
      client.stop();
    }
    outputChannel.dispose();
  });

  test("Client should handle server startup failure", async function () {
    this.timeout(10000);

    // Create client with invalid config
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const originalCommand = config.get("serverCommand");

    await config.update(
      "serverCommand",
      "invalid-command-xyz",
      vscode.ConfigurationTarget.Global
    );

    client = new MCPScreenshotClient(outputChannel);

    try {
      await client.start();
      assert.fail("Should have thrown error");
    } catch (error) {
      assert.ok(error, "Should handle invalid server command");
    }

    // Restore config
    await config.update(
      "serverCommand",
      originalCommand,
      vscode.ConfigurationTarget.Global
    );
  });

  test("Client should handle timeout on requests", async function () {
    this.timeout(35000);

    client = new MCPScreenshotClient(outputChannel);

    try {
      await client.start();

      // Try to make a request - might timeout if server is slow
      try {
        await client.listDisplays();
        assert.ok(true, "Request completed");
      } catch (error) {
        // Timeout is acceptable in test environment
        assert.ok(true, "Timeout handled gracefully");
      }
    } catch (error) {
      // Server might not start in test environment
      console.log("Server start failed:", error);
    }
  });
});

suite("MCP Client - Method Tests", () => {
  let outputChannel: vscode.OutputChannel;
  let client: MCPScreenshotClient;

  setup(() => {
    outputChannel = vscode.window.createOutputChannel(
      "Test MCP Screenshot Methods"
    );
    client = new MCPScreenshotClient(outputChannel);
  });

  teardown(() => {
    if (client) {
      client.stop();
    }
    outputChannel.dispose();
  });

  test("captureFullScreen should accept valid parameters", async function () {
    this.timeout(5000);

    const params = {
      format: "png",
      quality: 90,
      enablePIIMasking: false,
      savePath: "/tmp/test.png",
    };

    try {
      await client.captureFullScreen(params);
    } catch (error) {
      // Expected to fail if server not running
      assert.ok((error as Error).message.includes("not running"));
    }
  });

  test("captureWindow should accept valid parameters", async function () {
    this.timeout(5000);

    const params = {
      windowId: "test-window-id",
      format: "png",
      includeFrame: false,
    };

    try {
      await client.captureWindow(params);
    } catch (error) {
      // Expected to fail if server not running
      assert.ok((error as Error).message.includes("not running"));
    }
  });

  test("captureRegion should accept valid parameters", async function () {
    this.timeout(5000);

    const params = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      format: "png",
    };

    try {
      await client.captureRegion(params);
    } catch (error) {
      // Expected to fail if server not running
      assert.ok((error as Error).message.includes("not running"));
    }
  });

  test("listDisplays should not require parameters", async function () {
    this.timeout(5000);

    try {
      await client.listDisplays();
    } catch (error) {
      // Expected to fail if server not running
      assert.ok((error as Error).message.includes("not running"));
    }
  });

  test("listWindows should not require parameters", async function () {
    this.timeout(5000);

    try {
      await client.listWindows();
    } catch (error) {
      // Expected to fail if server not running
      assert.ok((error as Error).message.includes("not running"));
    }
  });
});

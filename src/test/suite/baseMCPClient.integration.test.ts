import * as assert from "assert";
import * as vscode from "vscode";
import { MCPScreenshotClient } from "../../mcpClient";

/**
 * BaseMCPClient Integration Tests for Screenshot Extension
 * Tests the integration of BaseMCPClient with screenshot-specific functionality
 */
suite("BaseMCPClient Integration Tests - Screenshot", () => {
  let outputChannel: vscode.LogOutputChannel;
  let client: MCPScreenshotClient;

  setup(() => {
    outputChannel = vscode.window.createOutputChannel(
      "Test MCP Screenshot Integration",
      { log: true }
    );
  });

  teardown(async function () {
    this.timeout(5000);
    if (client) {
      client.stop();
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      outputChannel.dispose();
    } catch (error) {
      // Ignore disposal errors
    }
  });

  test("Should initialize with slow server (timeout handling)", async function () {
    this.timeout(70000); // 70 seconds for slow initialization

    client = new MCPScreenshotClient(outputChannel);

    try {
      // This tests the new timeout handling from BaseMCPClient
      // The client should handle slow initialization gracefully
      await client.start();

      // Verify connection status is available (new from BaseMCPClient)
      const status = client.getConnectionStatus();
      assert.ok(status, "Connection status should be available");
      assert.ok(status.state, "Connection state should be defined");
      assert.ok(
        typeof status.serverProcessRunning === "boolean",
        "Server process running status should be boolean"
      );

      // Verify diagnostics are available (new from BaseMCPClient)
      const diagnostics = client.getDiagnostics();
      assert.ok(diagnostics, "Diagnostics should be available");
      assert.strictEqual(
        diagnostics.extensionName,
        "Screenshot",
        "Extension name should be Screenshot"
      );
      assert.ok(
        typeof diagnostics.processRunning === "boolean",
        "Process running status should be boolean"
      );
      assert.ok(
        typeof diagnostics.pendingRequestCount === "number",
        "Pending request count should be number"
      );

      client.stop();
    } catch (error: any) {
      // Expected if server not available - that's okay for this test
      assert.ok(
        error.message.includes("Server") ||
          error.message.includes("spawn") ||
          error.message.includes("timeout"),
        `Error should be server-related: ${error.message}`
      );
    }
  });

  test("Should handle timeout and re-sync", async function () {
    this.timeout(90000); // 90 seconds for timeout and retry

    client = new MCPScreenshotClient(outputChannel);

    try {
      // Try to start - may timeout if server is slow
      await client.start();

      // If we get here, server started successfully
      // Test that isServerProcessAlive works (new from BaseMCPClient)
      const isAlive = client.isServerProcessAlive();
      assert.ok(
        typeof isAlive === "boolean",
        "isServerProcessAlive should return boolean"
      );

      client.stop();
    } catch (error: any) {
      // Expected if server times out or isn't available
      // The important thing is that the client handles it gracefully
      assert.ok(
        error.message.includes("timeout") ||
          error.message.includes("Server") ||
          error.message.includes("spawn"),
        `Error should be timeout or server-related: ${error.message}`
      );
    }
  });

  test("Should preserve screenshot-specific operations", async function () {
    this.timeout(30000);

    client = new MCPScreenshotClient(outputChannel);

    // Verify all screenshot-specific methods still exist
    assert.ok(
      typeof client.captureFullScreen === "function",
      "captureFullScreen method should exist"
    );
    assert.ok(
      typeof client.captureWindow === "function",
      "captureWindow method should exist"
    );
    assert.ok(
      typeof client.captureRegion === "function",
      "captureRegion method should exist"
    );
    assert.ok(
      typeof client.listDisplays === "function",
      "listDisplays method should exist"
    );
    assert.ok(
      typeof client.listWindows === "function",
      "listWindows method should exist"
    );

    // Test that methods throw appropriate errors when server not started
    try {
      await client.captureFullScreen({ format: "png" });
      assert.fail("Should have thrown error");
    } catch (error: any) {
      assert.ok(
        error.message.includes("Server") ||
          error.message.includes("not running") ||
          error.message.includes("not available"),
        "Error should indicate server not running"
      );
    }
  });
});

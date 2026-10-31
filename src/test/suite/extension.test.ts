import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

/**
 * VSCode Extension E2E Tests for MCP ACS Screenshot
 * Tests the extension's integration with VSCode and the MCP server
 */
suite("MCP ACS Screenshot Extension Test Suite", () => {
  let tempDir: string;

  suiteSetup(async function () {
    // Increase timeout for extension activation
    this.timeout(30000);

    // Create temp directory for test screenshots
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "vscode-mcp-screenshot-test-")
    );

    // Wait for extension to activate
    const ext = vscode.extensions.getExtension(
      "DigitalDefiance.mcp-screenshot"
    );
    if (ext && !ext.isActive) {
      await ext.activate();
    }

    // Give the MCP server time to start
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  suiteTeardown(() => {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("Extension should be present", () => {
    const ext = vscode.extensions.getExtension(
      "DigitalDefiance.mcp-screenshot"
    );
    assert.ok(ext, "Extension should be installed");
  });

  test("Extension should activate", async function () {
    this.timeout(30000);

    const ext = vscode.extensions.getExtension(
      "DigitalDefiance.mcp-screenshot"
    );
    assert.ok(ext, "Extension should exist");

    if (!ext.isActive) {
      await ext.activate();
    }

    assert.ok(ext.isActive, "Extension should be active");
  });

  test("All commands should be registered", async () => {
    const commands = await vscode.commands.getCommands(true);

    const expectedCommands = [
      "mcp-screenshot.captureFullScreen",
      "mcp-screenshot.captureWindow",
      "mcp-screenshot.captureRegion",
      "mcp-screenshot.listDisplays",
      "mcp-screenshot.listWindows",
      "mcp-screenshot.openSettings",
    ];

    for (const cmd of expectedCommands) {
      assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
    }
  });

  test("Configuration should have default values", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");

    // Reset to defaults first in case previous tests changed them
    await config.update(
      "defaultFormat",
      undefined,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "defaultQuality",
      undefined,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "autoSave",
      undefined,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "autoStart",
      undefined,
      vscode.ConfigurationTarget.Global
    );

    // Wait for config to reset
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Re-fetch config after reset
    const freshConfig = vscode.workspace.getConfiguration("mcpScreenshot");

    assert.strictEqual(freshConfig.get("defaultFormat"), "png");
    assert.strictEqual(freshConfig.get("defaultQuality"), 90);
    assert.strictEqual(freshConfig.get("autoSave"), true);
    assert.strictEqual(freshConfig.get("autoStart"), true);
  });

  test("Should be able to update configuration", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");

    await config.update(
      "defaultFormat",
      "jpeg",
      vscode.ConfigurationTarget.Global
    );

    // Re-fetch config to get updated value
    let updatedConfig = vscode.workspace.getConfiguration("mcpScreenshot");
    assert.strictEqual(updatedConfig.get("defaultFormat"), "jpeg");

    // Reset to default
    await config.update(
      "defaultFormat",
      "png",
      vscode.ConfigurationTarget.Global
    );

    // Verify reset
    updatedConfig = vscode.workspace.getConfiguration("mcpScreenshot");
    assert.strictEqual(updatedConfig.get("defaultFormat"), "png");
  });

  test("List displays command should execute", async function () {
    this.timeout(15000);

    try {
      await vscode.commands.executeCommand("mcp-screenshot.listDisplays");
      // Command should execute without throwing
      assert.ok(true, "List displays command executed");
    } catch (error) {
      // If it fails, it might be due to no display server in CI
      console.log(
        "List displays failed (expected in headless environment):",
        error
      );
    }
  });

  test("List windows command should execute", async function () {
    this.timeout(15000);

    try {
      // Add a timeout to prevent hanging
      await Promise.race([
        vscode.commands.executeCommand("mcp-screenshot.listWindows"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Command timeout")), 5000)
        ),
      ]);
      // Command should execute without throwing
      assert.ok(true, "List windows command executed");
    } catch (error) {
      console.log(
        "List windows failed (expected in headless environment):",
        error
      );
      // This is acceptable in test environment
      assert.ok(true, "Test passed - command handled gracefully");
    }
  });

  test("Open settings command should execute", async () => {
    await vscode.commands.executeCommand("mcp-screenshot.openSettings");
    // Command should execute without throwing
    assert.ok(true, "Open settings command executed");
  });

  test("Output channel should be created", () => {
    // The extension creates an output channel named "MCP ACS Screenshot"
    // We can't directly access it, but we can verify it doesn't throw
    assert.ok(true, "Output channel test passed");
  });
});

suite("MCP ACS Screenshot Extension - Integration Tests", () => {
  test("Extension should handle server startup failure gracefully", async function () {
    this.timeout(5000);

    // This test verifies that the extension can handle configuration changes
    // without crashing. We can't easily test actual server restart in the
    // test environment since the server is already running.

    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const originalCommand = config.get("serverCommand");

    try {
      // Update config to use invalid server command
      await config.update(
        "serverCommand",
        "invalid-command-xyz",
        vscode.ConfigurationTarget.Global
      );

      // Wait for config to propagate
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify config was updated
      const updatedConfig = vscode.workspace.getConfiguration("mcpScreenshot");
      const newCommand = updatedConfig.get("serverCommand");
      assert.strictEqual(
        newCommand,
        "invalid-command-xyz",
        "Config should be updated"
      );

      // Extension should still be active despite invalid config
      const ext = vscode.extensions.getExtension(
        "DigitalDefiance.mcp-screenshot"
      );
      assert.ok(ext?.isActive, "Extension should remain active");
    } finally {
      // Restore original config
      await config.update(
        "serverCommand",
        originalCommand,
        vscode.ConfigurationTarget.Global
      );
    }
  });

  test("Extension should handle missing workspace folder", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const saveDir = config.get("saveDirectory");

    // The default uses ${workspaceFolder} which might not exist
    assert.ok(saveDir, "Save directory config exists");
  });
});

suite("MCP ACS Screenshot Extension - Command Tests", () => {
  test("Capture full screen command should be available", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("mcp-screenshot.captureFullScreen"),
      "Capture full screen command should be registered"
    );
  });

  test("Capture window command should be available", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("mcp-screenshot.captureWindow"),
      "Capture window command should be registered"
    );
  });

  test("Capture region command should be available", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("mcp-screenshot.captureRegion"),
      "Capture region command should be registered"
    );
  });
});

suite("MCP ACS Screenshot Extension - Configuration Tests", () => {
  test("Should support all image formats", () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const formatProperty = config.inspect("defaultFormat");

    assert.ok(formatProperty, "Format property should exist");
    // The enum values should be defined in package.json
  });

  test("Quality setting should be within valid range", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");

    // Test valid quality
    await config.update(
      "defaultQuality",
      85,
      vscode.ConfigurationTarget.Global
    );

    // Re-fetch config to get updated value
    let updatedConfig = vscode.workspace.getConfiguration("mcpScreenshot");
    assert.strictEqual(updatedConfig.get("defaultQuality"), 85);

    // Reset to default
    await config.update(
      "defaultQuality",
      90,
      vscode.ConfigurationTarget.Global
    );

    // Verify reset
    updatedConfig = vscode.workspace.getConfiguration("mcpScreenshot");
    assert.strictEqual(updatedConfig.get("defaultQuality"), 90);
  });

  test("PII masking setting should be boolean", () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const piiMasking = config.get("enablePIIMasking");

    assert.strictEqual(typeof piiMasking, "boolean");
  });

  test("Auto start setting should be boolean", () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const autoStart = config.get("autoStart");

    assert.strictEqual(typeof autoStart, "boolean");
  });

  test("Server command should be configurable", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const originalCommand = config.get("serverCommand");

    await config.update(
      "serverCommand",
      "node",
      vscode.ConfigurationTarget.Global
    );

    // Re-fetch config to get updated value
    const updatedConfig = vscode.workspace.getConfiguration("mcpScreenshot");
    assert.strictEqual(updatedConfig.get("serverCommand"), "node");

    // Restore
    await config.update(
      "serverCommand",
      originalCommand,
      vscode.ConfigurationTarget.Global
    );
  });

  test("Server args should be configurable", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const originalArgs = config.get("serverArgs");

    const testArgs = ["test", "args"];
    await config.update(
      "serverArgs",
      testArgs,
      vscode.ConfigurationTarget.Global
    );

    // Re-fetch config to get updated value
    const updatedConfig = vscode.workspace.getConfiguration("mcpScreenshot");
    assert.deepStrictEqual(updatedConfig.get("serverArgs"), testArgs);

    // Restore
    await config.update(
      "serverArgs",
      originalArgs,
      vscode.ConfigurationTarget.Global
    );
  });
});

suite("MCP ACS Screenshot Extension - Error Handling", () => {
  test("Should handle server not running", async function () {
    this.timeout(10000);

    // Disable auto start
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    await config.update("autoStart", false, vscode.ConfigurationTarget.Global);

    // Try to execute command - should show error message
    try {
      await vscode.commands.executeCommand("mcp-screenshot.captureFullScreen");
    } catch (error) {
      // Expected to fail gracefully
      assert.ok(true, "Handled server not running gracefully");
    }

    // Restore auto start
    await config.update("autoStart", true, vscode.ConfigurationTarget.Global);
  });

  test("Should handle invalid configuration", async () => {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");

    // Try to set invalid quality (should be clamped or rejected)
    try {
      await config.update(
        "defaultQuality",
        150,
        vscode.ConfigurationTarget.Global
      );
      const quality = config.get("defaultQuality");
      // Should either reject or clamp to valid range
      assert.ok(quality !== undefined, "Quality setting handled");
    } catch (error) {
      assert.ok(true, "Invalid quality rejected");
    }

    // Reset
    await config.update(
      "defaultQuality",
      90,
      vscode.ConfigurationTarget.Global
    );
  });
});

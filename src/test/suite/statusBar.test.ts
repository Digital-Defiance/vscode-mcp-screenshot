import * as assert from "assert";
import * as vscode from "vscode";
import {
  getStatusBarItem,
  getActiveExtensionCount,
} from "@ai-capabilities-suite/vscode-shared-status-bar";

suite("Status Bar Tests", () => {
  suiteSetup(async function () {
    // Increase timeout for extension activation
    this.timeout(30000);

    // Wait for extension to activate
    const ext = vscode.extensions.getExtension(
      "DigitalDefiance.mcp-screenshot"
    );
    if (ext && !ext.isActive) {
      await ext.activate();
    }

    // Give the extension time to register status bar
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  test("Extension should be activated", async function () {
    this.timeout(5000);

    const ext = vscode.extensions.getExtension(
      "DigitalDefiance.mcp-screenshot"
    );
    assert.ok(ext, "Extension should exist");
    assert.ok(ext.isActive, "Extension should be activated by test runner");
  });

  test("Status bar created and extension registered", async function () {
    this.timeout(5000);

    // Status bar should be created and extension registered
    assert.ok(getStatusBarItem(), "Status bar should exist");
    assert.strictEqual(
      getActiveExtensionCount(),
      1,
      "Should have 1 active extension"
    );
  });

  test("Commands should be registered", async function () {
    this.timeout(5000);

    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("mcp-screenshot.captureFullScreen"),
      "Capture command should be registered"
    );
  });
});

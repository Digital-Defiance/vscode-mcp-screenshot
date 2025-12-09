import * as assert from "assert";
import * as vscode from "vscode";

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

    // Note: We cannot verify registeredExtensions via getDiagnosticInfo() here because
    // the test runner uses a different instance of the shared-status-bar module than the extension.
    // Instead, we verify that the diagnostic command (which is registered by the shared module) exists.

    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("mcp-acs.diagnostics"),
      "Diagnostic command should be registered, indicating status bar is active"
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

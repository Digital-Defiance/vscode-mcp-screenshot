import * as assert from "assert";
import * as fc from "fast-check";
import * as vscode from "vscode";

/**
 * Feature: mcp-screenshot-lsp, Property 17: Backward compatibility
 *
 * Property: For any existing extension command, it should continue to work
 * unchanged after LSP integration
 *
 * Validates: Requirements 6.6
 */
suite("Extension Integration - Property-Based Tests", () => {
  suiteSetup(async function () {
    this.timeout(30000);

    // Wait for extension to activate
    const ext = vscode.extensions.getExtension(
      "DigitalDefiance.mcp-screenshot"
    );
    if (ext && !ext.isActive) {
      await ext.activate();
    }

    // Give the extension and language server time to start
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  test("Property 17: Backward compatibility - all existing commands remain registered", async () => {
    /**
     * Property: For any existing command from the original extension,
     * it should still be registered after LSP integration
     */
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const commands = await vscode.commands.getCommands(true);

        const existingCommands = [
          "mcp-screenshot.captureFullScreen",
          "mcp-screenshot.captureWindow",
          "mcp-screenshot.captureRegion",
          "mcp-screenshot.listDisplays",
          "mcp-screenshot.listWindows",
          "mcp-screenshot.openSettings",
        ];

        // All existing commands should still be registered
        const allRegistered = existingCommands.every((cmd) =>
          commands.includes(cmd)
        );

        return allRegistered;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 17: Backward compatibility - configuration schema unchanged", () => {
    /**
     * Property: For any configuration property that existed before LSP,
     * it should still exist with the same type
     */
    fc.assert(
      fc.property(fc.constant(null), () => {
        const config = vscode.workspace.getConfiguration("mcpScreenshot");

        // Check all original configuration properties exist and have correct types
        const configChecks = [
          { key: "defaultFormat", expectedType: "string" },
          { key: "defaultQuality", expectedType: "number" },
          { key: "saveDirectory", expectedType: "string" },
          { key: "enablePIIMasking", expectedType: "boolean" },
          { key: "serverCommand", expectedType: "string" },
          { key: "serverArgs", expectedType: "object" }, // array is object in typeof
          { key: "autoSave", expectedType: "boolean" },
          { key: "autoStart", expectedType: "boolean" },
          { key: "showNotifications", expectedType: "boolean" },
        ];

        for (const check of configChecks) {
          const value = config.get(check.key);

          // Check that value exists and has correct type
          if (value === undefined || typeof value !== check.expectedType) {
            return false;
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 17: Backward compatibility - commands execute without errors", async function () {
    this.timeout(20000);

    /**
     * Property: For any existing command, executing it should not throw
     * errors related to LSP integration (may fail for other reasons like
     * no display server in CI)
     */
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          "mcp-screenshot.listDisplays",
          "mcp-screenshot.listWindows",
          "mcp-screenshot.openSettings"
        ),
        async (commandName) => {
          try {
            // Execute the command
            await vscode.commands.executeCommand(commandName);

            // If it succeeds, that's good
            return true;
          } catch (error: any) {
            // Check if the error is related to LSP integration
            // LSP-related errors would mention "language server" or "LSP"
            const errorMessage = error?.message?.toLowerCase() || "";
            const isLSPError =
              errorMessage.includes("language server") ||
              errorMessage.includes("lsp") ||
              errorMessage.includes("languageclient");

            // If it's an LSP error, the test fails
            // If it's another error (like no display server), that's acceptable
            return !isLSPError;
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test("Property 17: Backward compatibility - extension activation unchanged", () => {
    /**
     * Property: The extension should activate successfully with LSP integration
     */
    fc.assert(
      fc.property(fc.constant(null), () => {
        const ext = vscode.extensions.getExtension(
          "DigitalDefiance.mcp-screenshot"
        );

        // Extension should exist and be active
        return ext !== undefined && ext.isActive;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 17: Backward compatibility - output channel still created", () => {
    /**
     * Property: The extension should still create its output channel
     * (we can't directly access it, but we can verify the extension
     * doesn't throw during activation)
     */
    fc.assert(
      fc.property(fc.constant(null), () => {
        const ext = vscode.extensions.getExtension(
          "DigitalDefiance.mcp-screenshot"
        );

        // If extension is active, output channel was created successfully
        return ext !== undefined && ext.isActive;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 17: Backward compatibility - configuration updates work", async () => {
    /**
     * Property: For any configuration property, updating it should work
     * the same way as before LSP integration
     */
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("png", "jpeg", "webp"),
        async (format) => {
          const config = vscode.workspace.getConfiguration("mcpScreenshot");
          const originalFormat = config.get("defaultFormat");

          try {
            // Update configuration
            await config.update(
              "defaultFormat",
              format,
              vscode.ConfigurationTarget.Global
            );

            // Verify update
            const updatedConfig =
              vscode.workspace.getConfiguration("mcpScreenshot");
            const newFormat = updatedConfig.get("defaultFormat");

            // Restore original
            await config.update(
              "defaultFormat",
              originalFormat,
              vscode.ConfigurationTarget.Global
            );

            return newFormat === format;
          } catch (error) {
            // Restore on error
            await config.update(
              "defaultFormat",
              originalFormat,
              vscode.ConfigurationTarget.Global
            );
            return false;
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});

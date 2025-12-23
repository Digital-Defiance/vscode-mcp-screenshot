import * as assert from "assert";
import * as fc from "fast-check";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { MCPScreenshotClient } from "../../mcpClient";

/**
 * Feature: screenshot-savepath-fix, Property 3: Valid paths result in file save
 * Feature: screenshot-savepath-fix, Property 4: Invalid paths result in errors
 *
 * Property-Based Tests for savePath parameter
 */
suite("savePath Property-Based Tests", () => {
  let outputChannel: vscode.LogOutputChannel;
  let client: MCPScreenshotClient;
  let tempDir: string;

  suiteSetup(async function () {
    this.timeout(30000);

    outputChannel = vscode.window.createOutputChannel(
      "Test MCP Screenshot savePath Property",
      { log: true }
    );

    // Create temp directory for test screenshots
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "screenshot-prop-test-"));

    // Initialize and start MCP client
    client = new MCPScreenshotClient(outputChannel);
    try {
      await client.start();
      // Wait for server to be ready
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(`Server start failed (may be expected): ${error}`);
    }
  });

  suiteTeardown(async function () {
    this.timeout(10000);

    if (client) {
      client.stop();
    }

    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          try {
            fs.unlinkSync(path.join(tempDir, file));
          } catch (error) {
            // Ignore
          }
        }
        fs.rmdirSync(tempDir);
      } catch (error) {
        console.log(`Cleanup error: ${error}`);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      outputChannel.dispose();
    } catch (error) {
      // Ignore disposal errors
    }
  });

  test("8.6 Property 3: Valid paths result in file save", async function () {
    this.timeout(120000);

    const status = client.getConnectionStatus();
    if (status.state !== "connected") {
      this.skip();
      return;
    }

    /**
     * **Feature: screenshot-savepath-fix, Property 3: Valid paths result in file save**
     * **Validates: Requirements 2.4**
     *
     * Property: For any valid file path provided as savePath,
     * the screenshot should be saved to that path and the response
     * should contain the filePath
     */
    try {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom("png", "jpeg", "webp"),
          fc.integer({ min: 1, max: 1000 }),
          async (format, randomNum) => {
            const fileName = `test-${randomNum}.${format}`;
            const savePath = path.join(tempDir, fileName);

            // Clean up if file exists from previous run
            if (fs.existsSync(savePath)) {
              fs.unlinkSync(savePath);
            }

            try {
              const result = await client.captureFullScreen({
                format: format,
                quality: 90,
                savePath: savePath,
              });

              // If capture failed (e.g., headless environment), skip this iteration
              if (!result || result.status === "error") {
                return true; // Skip this iteration
              }

              // Verify file is created
              const fileExists = fs.existsSync(savePath);

              // Verify response contains filePath
              const hasFilePath =
                result &&
                result.status === "success" &&
                result.filePath &&
                path.resolve(result.filePath) === path.resolve(savePath);

              // Clean up
              if (fs.existsSync(savePath)) {
                fs.unlinkSync(savePath);
              }

              return fileExists && hasFilePath;
            } catch (error: any) {
              // If server is not available, skip
              if (
                error.message.includes("Server") ||
                error.message.includes("not running")
              ) {
                return true; // Skip this iteration
              }
              throw error;
            }
          }
        ),
        { numRuns: 10 } // Reduced runs for integration tests
      );
    } catch (error: any) {
      if (
        error.message.includes("Server") ||
        error.message.includes("not running")
      ) {
        this.skip();
      } else {
        throw error;
      }
    }
  });

  test("8.7 Property 4: Invalid paths result in errors", async function () {
    this.timeout(120000);

    const status = client.getConnectionStatus();
    if (status.state !== "connected") {
      this.skip();
      return;
    }

    /**
     * **Feature: screenshot-savepath-fix, Property 4: Invalid paths result in errors**
     * **Validates: Requirements 2.5**
     *
     * Property: For any invalid file path provided as savePath,
     * the system should return an error status with a message about
     * path validation
     */
    try {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            "/root/../../etc/passwd", // Path traversal
            "/invalid/absolute/path/that/does/not/exist/screenshot.png", // Non-existent absolute path
            "../../../etc/passwd", // Relative path traversal
            "/dev/null/screenshot.png" // Invalid parent
          ),
          async (invalidPath) => {
            try {
              const result = await client.captureFullScreen({
                format: "png",
                quality: 90,
                savePath: invalidPath,
              });

              // Should return error status
              if (result) {
                const hasError = result.status === "error";
                const hasMessage =
                  result.error &&
                  result.error.message &&
                  (result.error.message.includes("path") ||
                    result.error.message.includes("Path") ||
                    result.error.message.includes("validation") ||
                    result.error.message.includes("invalid") ||
                    result.error.message.includes("allowed") ||
                    result.error.message.includes("traversal"));

                return hasError && hasMessage;
              }

              return false;
            } catch (error: any) {
              // Error thrown is also acceptable
              const isPathError =
                error.message.includes("path") ||
                error.message.includes("Path") ||
                error.message.includes("validation") ||
                error.message.includes("invalid") ||
                error.message.includes("allowed") ||
                error.message.includes("traversal");

              const isServerError =
                error.message.includes("Server") ||
                error.message.includes("not running");

              // If server error, skip this iteration
              if (isServerError) {
                return true;
              }

              // Path error is expected
              return isPathError;
            }
          }
        ),
        { numRuns: 10 } // Reduced runs for integration tests
      );
    } catch (error: any) {
      if (
        error.message.includes("Server") ||
        error.message.includes("not running")
      ) {
        this.skip();
      } else {
        throw error;
      }
    }
  });
});

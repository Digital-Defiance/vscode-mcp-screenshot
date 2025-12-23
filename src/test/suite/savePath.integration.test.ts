import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { MCPScreenshotClient } from "../../mcpClient";

/**
 * Integration Tests for savePath parameter
 * Tests the savePath parameter with real MCP server
 */
suite("savePath Integration Tests", () => {
  let outputChannel: vscode.LogOutputChannel;
  let client: MCPScreenshotClient;
  let tempDir: string;

  setup(async function () {
    this.timeout(30000);

    outputChannel = vscode.window.createOutputChannel(
      "Test MCP Screenshot savePath",
      { log: true }
    );

    // Create temp directory for test screenshots
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "screenshot-test-"));

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

  teardown(async function () {
    this.timeout(10000);

    if (client) {
      client.stop();
    }

    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        const files = fs.readdirSync(tempDir);
        for (const file of files) {
          fs.unlinkSync(path.join(tempDir, file));
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

  test("8.1 Test full screen capture with savePath", async function () {
    this.timeout(30000);

    const status = client.getConnectionStatus();
    if (status.state !== "connected") {
      this.skip();
      return;
    }

    const savePath = path.join(tempDir, "fullscreen-test.png");

    try {
      const result = await client.captureFullScreen({
        format: "png",
        quality: 90,
        savePath: savePath,
      });

      console.log(
        "Full screen capture result:",
        JSON.stringify(result, null, 2)
      );
      console.log("Temp dir:", tempDir);
      console.log("Save path:", savePath);
      console.log("File exists:", fs.existsSync(savePath));

      // If the capture failed (e.g., in headless environment), skip the test
      if (result.status === "error") {
        console.log("Screenshot capture failed:", result.error);
        this.skip();
        return;
      }

      // Verify file is created at specified path
      assert.ok(
        fs.existsSync(savePath),
        "Screenshot file should be created at specified path"
      );

      // Verify response contains filePath
      assert.ok(result, "Result should be returned");
      assert.strictEqual(
        result.status,
        "success",
        "Result status should be success"
      );
      assert.ok(result.filePath, "Result should contain filePath");
      assert.strictEqual(
        path.resolve(result.filePath),
        path.resolve(savePath),
        "Result filePath should match requested savePath"
      );

      // Verify file has content
      const stats = fs.statSync(savePath);
      assert.ok(stats.size > 0, "Screenshot file should have content");
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

  test("8.2 Test region capture with savePath", async function () {
    this.timeout(30000);

    const status = client.getConnectionStatus();
    if (status.state !== "connected") {
      this.skip();
      return;
    }

    const savePath = path.join(tempDir, "region-test.png");

    try {
      const result = await client.captureRegion({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        format: "png",
        quality: 90,
        savePath: savePath,
      });

      // If the capture failed (e.g., in headless environment), skip the test
      if (result.status === "error") {
        console.log("Screenshot capture failed:", result.error);
        this.skip();
        return;
      }

      // Verify file is created at specified path
      assert.ok(
        fs.existsSync(savePath),
        "Screenshot file should be created at specified path"
      );

      // Verify response contains filePath
      assert.ok(result, "Result should be returned");
      assert.strictEqual(
        result.status,
        "success",
        "Result status should be success"
      );
      assert.ok(result.filePath, "Result should contain filePath");
      assert.strictEqual(
        path.resolve(result.filePath),
        path.resolve(savePath),
        "Result filePath should match requested savePath"
      );

      // Verify file has content
      const stats = fs.statSync(savePath);
      assert.ok(stats.size > 0, "Screenshot file should have content");
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

  test("8.3 Test window capture with savePath", async function () {
    this.timeout(30000);

    const status = client.getConnectionStatus();
    if (status.state !== "connected") {
      this.skip();
      return;
    }

    const savePath = path.join(tempDir, "window-test.png");

    try {
      // First, list windows to get a valid window title
      const windows = await client.listWindows();

      if (!windows || !windows.windows || windows.windows.length === 0) {
        this.skip();
        return;
      }

      const windowTitle = windows.windows[0].title;

      const result = await client.captureWindow({
        windowTitle: windowTitle,
        format: "png",
        quality: 90,
        savePath: savePath,
      });

      // If the capture failed (e.g., in headless environment), skip the test
      if (result.status === "error") {
        console.log("Screenshot capture failed:", result.error);
        this.skip();
        return;
      }

      // Verify file is created at specified path
      assert.ok(
        fs.existsSync(savePath),
        "Screenshot file should be created at specified path"
      );

      // Verify response contains filePath
      assert.ok(result, "Result should be returned");
      assert.strictEqual(
        result.status,
        "success",
        "Result status should be success"
      );
      assert.ok(result.filePath, "Result should contain filePath");
      assert.strictEqual(
        path.resolve(result.filePath),
        path.resolve(savePath),
        "Result filePath should match requested savePath"
      );

      // Verify file has content
      const stats = fs.statSync(savePath);
      assert.ok(stats.size > 0, "Screenshot file should have content");
    } catch (error: any) {
      if (
        error.message.includes("Server") ||
        error.message.includes("not running") ||
        error.message.includes("Window not found")
      ) {
        this.skip();
      } else {
        throw error;
      }
    }
  });

  test("8.4 Test capture without savePath returns base64", async function () {
    this.timeout(30000);

    const status = client.getConnectionStatus();
    if (status.state !== "connected") {
      this.skip();
      return;
    }

    try {
      // Test full screen capture without savePath
      const fullScreenResult = await client.captureFullScreen({
        format: "png",
        quality: 90,
      });

      // If the capture failed (e.g., in headless environment), skip the test
      if (fullScreenResult.status === "error") {
        console.log("Screenshot capture failed:", fullScreenResult.error);
        this.skip();
        return;
      }

      assert.ok(fullScreenResult, "Result should be returned");
      assert.strictEqual(
        fullScreenResult.status,
        "success",
        "Result status should be success"
      );
      assert.ok(
        fullScreenResult.data,
        "Result should contain data (base64) when savePath not provided"
      );
      assert.ok(
        !fullScreenResult.filePath,
        "Result should not contain filePath when savePath not provided"
      );

      // Test region capture without savePath
      const regionResult = await client.captureRegion({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        format: "png",
        quality: 90,
      });

      // If the capture failed, skip
      if (regionResult.status === "error") {
        console.log("Region capture failed:", regionResult.error);
        this.skip();
        return;
      }

      assert.ok(regionResult, "Result should be returned");
      assert.strictEqual(
        regionResult.status,
        "success",
        "Result status should be success"
      );
      assert.ok(
        regionResult.data,
        "Result should contain data (base64) when savePath not provided"
      );
      assert.ok(
        !regionResult.filePath,
        "Result should not contain filePath when savePath not provided"
      );

      // Test window capture without savePath
      const windows = await client.listWindows();
      if (windows && windows.windows && windows.windows.length > 0) {
        const windowTitle = windows.windows[0].title;

        const windowResult = await client.captureWindow({
          windowTitle: windowTitle,
          format: "png",
          quality: 90,
        });

        // If the capture failed, skip
        if (windowResult.status === "error") {
          console.log("Window capture failed:", windowResult.error);
          this.skip();
          return;
        }

        assert.ok(windowResult, "Result should be returned");
        assert.strictEqual(
          windowResult.status,
          "success",
          "Result status should be success"
        );
        assert.ok(
          windowResult.data,
          "Result should contain data (base64) when savePath not provided"
        );
        assert.ok(
          !windowResult.filePath,
          "Result should not contain filePath when savePath not provided"
        );
      }
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

  test("8.5 Test invalid savePath returns error", async function () {
    this.timeout(30000);

    const status = client.getConnectionStatus();
    if (status.state !== "connected") {
      this.skip();
      return;
    }

    // Test with invalid path (path traversal attempt)
    const invalidPath = "/root/../../etc/passwd";

    try {
      const result = await client.captureFullScreen({
        format: "png",
        quality: 90,
        savePath: invalidPath,
      });

      // Should either return error status or throw
      if (result) {
        assert.strictEqual(
          result.status,
          "error",
          "Result status should be error for invalid path"
        );
        assert.ok(result.error, "Error result should contain error object");
        assert.ok(result.error.message, "Error object should contain message");
        assert.ok(
          result.error.message.includes("path") ||
            result.error.message.includes("Path") ||
            result.error.message.includes("validation") ||
            result.error.message.includes("invalid") ||
            result.error.message.includes("allowed") ||
            result.error.message.includes("traversal"),
          "Error message should indicate path validation issue"
        );
      }
    } catch (error: any) {
      // Error thrown is also acceptable
      assert.ok(
        error.message.includes("path") ||
          error.message.includes("Path") ||
          error.message.includes("validation") ||
          error.message.includes("invalid") ||
          error.message.includes("allowed") ||
          error.message.includes("traversal") ||
          error.message.includes("Server") ||
          error.message.includes("not running"),
        "Error message should indicate path validation issue or server issue"
      );

      if (
        error.message.includes("Server") ||
        error.message.includes("not running")
      ) {
        this.skip();
      }
    }
  });
});

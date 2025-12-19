import * as vscode from "vscode";
import * as path from "path";
import {
  BaseMCPClient,
  LogOutputChannel,
} from "@ai-capabilities-suite/mcp-client-base";

export class MCPScreenshotClient extends BaseMCPClient {
  constructor(outputChannel: LogOutputChannel) {
    super("Screenshot", outputChannel);
  }

  // ========== Abstract Method Implementations ==========

  protected getServerCommand(): { command: string; args: string[] } {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    let serverCommand = config.get<string>("serverCommand", "npx");
    let serverArgs = config.get<string[]>("serverArgs", [
      "-y",
      "@ai-capabilities-suite/mcp-screenshot",
    ]);

    if (process.env.VSCODE_TEST_MODE === "true") {
      try {
        // In test mode, use the local build
        // We need to find the extension path to resolve the relative path to the server
        let extensionPath = "";
        const extension = vscode.extensions.getExtension(
          "DigitalDefiance.mcp-screenshot"
        );
        if (extension) {
          extensionPath = extension.extensionPath;
        }

        if (extensionPath) {
          serverCommand = "node";
          const serverScript = path.resolve(
            extensionPath,
            "../mcp-screenshot/dist/cli.js"
          );
          serverArgs = [serverScript];
          this.log("info", `Test mode: Using local server at ${serverScript}`);
        } else {
          this.log(
            "info",
            "Test mode: Could not find extension path, falling back to configuration"
          );
        }
      } catch (error) {
        this.log("warn", `Test mode error: ${error}`);
      }
    }

    // Handle Windows npx command
    if (serverCommand === "npx" && process.platform === "win32") {
      serverCommand = "npx.cmd";
    }

    return { command: serverCommand, args: serverArgs };
  }

  protected getServerEnv(): Record<string, string> {
    const env: Record<string, string> = {};

    // Copy process.env, filtering out undefined values
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }

    return env;
  }

  protected async onServerReady(): Promise<void> {
    // Send initialized notification
    await this.sendNotification("initialized", {});

    // Load configuration - list available tools
    try {
      const tools = await this.sendRequest("tools/list", {});
      this.log("info", `Server tools loaded: ${JSON.stringify(tools)}`);
    } catch (error) {
      this.log("warn", `Failed to list tools: ${error}`);
    }
  }

  // ========== Screenshot-Specific Methods ==========

  async captureFullScreen(params: {
    format: string;
    quality?: number;
    enablePIIMasking?: boolean;
    savePath?: string;
  }): Promise<any> {
    return this.callTool("screenshot_capture_full", params);
  }

  async captureWindow(params: {
    windowId?: string;
    windowTitle?: string;
    format: string;
    includeFrame?: boolean;
  }): Promise<any> {
    return this.callTool("screenshot_capture_window", params);
  }

  async captureRegion(params: {
    x: number;
    y: number;
    width: number;
    height: number;
    format: string;
  }): Promise<any> {
    return this.callTool("screenshot_capture_region", params);
  }

  async listDisplays(): Promise<any> {
    return this.callTool("screenshot_list_displays", {});
  }

  async listWindows(): Promise<any> {
    return this.callTool("screenshot_list_windows", {});
  }

  // Override callTool to handle MCP-specific response format
  protected override async callTool(
    name: string,
    args: unknown
  ): Promise<unknown> {
    const result = (await this.sendRequest("tools/call", {
      name,
      arguments: args,
    })) as any;

    if (result.isError) {
      throw new Error(result.content[0]?.text || "Tool call failed");
    }

    // Parse result content
    const content = result.content[0]?.text;
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    }

    return result;
  }
}

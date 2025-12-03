import * as vscode from "vscode";
import { spawn, ChildProcess } from "child_process";

export class MCPScreenshotClient {
  private process: ChildProcess | undefined;
  private outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  async start(): Promise<void> {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const serverCommand = config.get<string>("serverCommand", "npx");
    const serverArgs = config.get<string[]>("serverArgs", [
      "-y",
      "@ai-capabilities-suite/mcp-screenshot",
    ]);

    this.outputChannel.appendLine(
      `Starting MCP Screenshot server: ${serverCommand} ${serverArgs.join(" ")}`
    );

    this.process = spawn(serverCommand, serverArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (this.process.stdout) {
      this.process.stdout.on("data", (data) => {
        this.outputChannel.appendLine(`[stdout] ${data.toString()}`);
      });
    }

    if (this.process.stderr) {
      this.process.stderr.on("data", (data) => {
        this.outputChannel.appendLine(`[stderr] ${data.toString()}`);
      });
    }

    this.process.on("error", (error) => {
      this.outputChannel.appendLine(`Process error: ${error.message}`);
    });

    this.process.on("exit", (code) => {
      this.outputChannel.appendLine(`Process exited with code ${code}`);
    });

    // Give the server a moment to start
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
  }

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

  private async callTool(toolName: string, params: any): Promise<any> {
    if (!this.process || !this.process.stdin) {
      throw new Error("MCP server not running");
    }

    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: toolName,
          arguments: params,
        },
      };

      const requestStr = JSON.stringify(request) + "\n";
      this.outputChannel.appendLine(`Sending request: ${requestStr}`);

      let responseData = "";
      const responseHandler = (data: Buffer) => {
        responseData += data.toString();

        // Try to parse complete JSON response
        try {
          const lines = responseData.split("\n");
          for (const line of lines) {
            if (line.trim()) {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                this.process?.stdout?.removeListener("data", responseHandler);

                if (response.error) {
                  reject(new Error(response.error.message));
                } else {
                  resolve(response.result);
                }
                return;
              }
            }
          }
        } catch (e) {
          // Not a complete JSON yet, wait for more data
        }
      };

      this.process?.stdout?.on("data", responseHandler);

      // Set timeout
      const timeout = setTimeout(() => {
        this.process?.stdout?.removeListener("data", responseHandler);
        reject(new Error("Request timeout"));
      }, 30000);

      this.process?.stdin?.write(requestStr, (err) => {
        if (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });
    });
  }
}

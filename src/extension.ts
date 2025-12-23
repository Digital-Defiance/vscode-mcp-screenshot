import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import {
  registerExtension,
  unregisterExtension,
  setOutputChannel,
} from "@ai-capabilities-suite/vscode-shared-status-bar";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { MCPScreenshotClient } from "./mcpClient";
import { mcpClientAccessor } from "./mcpClientAccessor";

let mcpClient: MCPScreenshotClient | undefined;
let languageClient: LanguageClient | undefined;
let outputChannel: vscode.LogOutputChannel;

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("MCP ACS Screenshot", {
    log: true,
  });
  outputChannel.appendLine("MCP ACS Screenshot extension activating...");

  // Register chat participant for Copilot integration
  const participant = vscode.chat.createChatParticipant(
    "mcp-screenshot.participant",
    async (request, context, stream, token) => {
      if (!mcpClient) {
        stream.markdown(
          "MCP ACS Screenshot server is not running. Please start it first."
        );
        return;
      }

      const prompt = request.prompt;
      stream.markdown(`Processing: ${prompt}\n\n`);

      if (prompt.includes("full") || prompt.includes("screen")) {
        stream.markdown("Capturing full screen...");
        await captureFullScreen();
        stream.markdown("Screenshot captured successfully!");
      } else if (prompt.includes("window")) {
        stream.markdown("Capturing window...");
      } else if (prompt.includes("region")) {
        stream.markdown("Capturing region...");
      } else {
        stream.markdown(
          "Available commands:\n- Capture full screen\n- Capture window\n- Capture region\n- List displays"
        );
      }
    }
  );

  context.subscriptions.push(participant);

  // Register language model tools
  try {
    const tools = [
      {
        name: "screenshot_capture_full",
        tool: {
          description: "Capture full screen screenshot",
          inputSchema: {
            type: "object",
            properties: {
              format: {
                type: "string",
                enum: ["png", "jpeg", "webp", "bmp"],
                description: "Image format",
              },
              quality: {
                type: "number",
                minimum: 1,
                maximum: 100,
                description: "Quality for lossy formats",
              },
              savePath: {
                type: "string",
                description:
                  "File path to save screenshot (optional, returns base64 if not provided)",
              },
            },
          },
          invoke: async (
            options: vscode.LanguageModelToolInvocationOptions<any>,
            token: vscode.CancellationToken
          ) => {
            const args = options.input as any;
            const result = await captureFullScreenWithArgs(args);
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result)),
            ]);
          },
        },
      },
      {
        name: "screenshot_capture_region",
        tool: {
          description: "Capture a rectangular region of the screen",
          inputSchema: {
            type: "object",
            properties: {
              x: {
                type: "number",
                description: "X coordinate",
              },
              y: {
                type: "number",
                description: "Y coordinate",
              },
              width: {
                type: "number",
                description: "Width",
              },
              height: {
                type: "number",
                description: "Height",
              },
              format: {
                type: "string",
                enum: ["png", "jpeg", "webp", "bmp"],
                description: "Image format",
              },
              quality: {
                type: "number",
                minimum: 1,
                maximum: 100,
                description: "Quality for lossy formats",
              },
              savePath: {
                type: "string",
                description:
                  "File path to save screenshot (optional, returns base64 if not provided)",
              },
            },
            required: ["x", "y", "width", "height"],
          },
          invoke: async (
            options: vscode.LanguageModelToolInvocationOptions<any>,
            token: vscode.CancellationToken
          ) => {
            const args = options.input as any;
            const result = await captureRegionWithArgs(args);
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result)),
            ]);
          },
        },
      },
      {
        name: "screenshot_capture_window",
        tool: {
          description: "Capture specific window screenshot",
          inputSchema: {
            type: "object",
            properties: {
              windowTitle: {
                type: "string",
                description: "Window title to capture",
              },
              format: {
                type: "string",
                enum: ["png", "jpeg", "webp", "bmp"],
                description: "Image format",
              },
              quality: {
                type: "number",
                minimum: 1,
                maximum: 100,
                description: "Quality for lossy formats",
              },
              savePath: {
                type: "string",
                description:
                  "File path to save screenshot (optional, returns base64 if not provided)",
              },
            },
          },
          invoke: async (
            options: vscode.LanguageModelToolInvocationOptions<any>,
            token: vscode.CancellationToken
          ) => {
            const args = options.input as any;
            const result = await captureWindowWithArgs(args);
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart(JSON.stringify(result)),
            ]);
          },
        },
      },
      {
        name: "screenshot_list_displays",
        tool: {
          description: "List all connected displays",
          inputSchema: { type: "object", properties: {} },
          invoke: async (
            options: vscode.LanguageModelToolInvocationOptions<any>,
            token: vscode.CancellationToken
          ) => {
            await listDisplays();
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart("Displays listed"),
            ]);
          },
        },
      },
      {
        name: "screenshot_list_windows",
        tool: {
          description: "List all visible windows",
          inputSchema: { type: "object", properties: {} },
          invoke: async (
            options: vscode.LanguageModelToolInvocationOptions<any>,
            token: vscode.CancellationToken
          ) => {
            await listWindows();
            return new vscode.LanguageModelToolResult([
              new vscode.LanguageModelTextPart("Windows listed"),
            ]);
          },
        },
      },
    ];

    for (const { name, tool } of tools) {
      context.subscriptions.push(vscode.lm.registerTool(name, tool));
    }
    outputChannel.appendLine(`Registered ${tools.length} language model tools`);
  } catch (error) {
    outputChannel.appendLine(
      `Tool registration skipped (API not available): ${error}`
    );
  }

  // Initialize MCP client
  const config = vscode.workspace.getConfiguration("mcpScreenshot");
  const autoStart = config.get<boolean>("autoStart", true);

  if (autoStart) {
    // In test mode, start the server in the background without waiting
    // This prevents tests from hanging if the server can't start
    const isTestMode =
      process.env.VSCODE_TEST_MODE === "true" ||
      process.env.NODE_ENV === "test";

    if (isTestMode) {
      mcpClient = new MCPScreenshotClient(outputChannel);

      // Start in background, don't wait
      mcpClient.start().then(
        () => {
          outputChannel.appendLine(
            "MCP ACS Screenshot server started successfully"
          );
          if (mcpClient) {
            mcpClientAccessor.setClient(mcpClient);
          }
        },
        (error) => {
          outputChannel.appendLine(`Failed to start MCP server: ${error}`);
        }
      );
    } else {
      // In production, show progress indicator during initialization
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "MCP ACS Screenshot",
          cancellable: false,
        },
        async (progress) => {
          try {
            progress.report({ message: "Starting server..." });

            mcpClient = new MCPScreenshotClient(outputChannel);

            // Subscribe to connection state changes
            const stateSubscription = mcpClient.onStateChange((status) => {
              outputChannel.appendLine(
                `Connection state changed: ${status.state} - ${status.message}`
              );

              // Update progress indicator based on state
              if (status.state === "connecting") {
                progress.report({ message: "Connecting to server..." });
              } else if (status.state === "timeout_retrying") {
                progress.report({
                  message: `Retrying connection (${status.retryCount || 0}/${
                    mcpClient?.getReSyncConfig().maxRetries || 3
                  })...`,
                });
              }
            });

            context.subscriptions.push(stateSubscription);

            progress.report({ message: "Initializing connection..." });
            await mcpClient.start();

            progress.report({ message: "Server ready" });
            outputChannel.appendLine(
              "MCP ACS Screenshot server started successfully"
            );

            // Set the client in the accessor for language server access
            mcpClientAccessor.setClient(mcpClient);
          } catch (error) {
            outputChannel.appendLine(`Failed to start MCP server: ${error}`);
            if (process.env.NODE_ENV === "production") {
              vscode.window.showErrorMessage(
                "Failed to start MCP ACS Screenshot server"
              );
            }
          }
        }
      );
    }
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mcp-screenshot.captureFullScreen",
      async () => {
        await captureFullScreen();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mcp-screenshot.captureWindow",
      async () => {
        await captureWindow();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mcp-screenshot.captureRegion",
      async () => {
        await captureRegion();
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mcp-screenshot.listDisplays", async () => {
      await listDisplays();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mcp-screenshot.listWindows", async () => {
      await listWindows();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("mcp-screenshot.openSettings", () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "mcpScreenshot"
      );
    })
  );

  // Diagnostic commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mcp-screenshot.reconnectToServer",
      async () => {
        if (!mcpClient) {
          vscode.window.showErrorMessage(
            "MCP ACS Screenshot server not running"
          );
          return;
        }

        try {
          outputChannel.appendLine(
            "Reconnecting to MCP ACS Screenshot server..."
          );
          const success = await mcpClient.reconnect();

          if (success) {
            vscode.window.showInformationMessage(
              "Reconnected to MCP ACS Screenshot server"
            );
            outputChannel.appendLine("Reconnection successful");
          } else {
            vscode.window.showErrorMessage(
              "Failed to reconnect to MCP ACS Screenshot server"
            );
            outputChannel.appendLine("Reconnection failed");
          }
        } catch (error: any) {
          vscode.window.showErrorMessage(
            `Reconnection error: ${error.message || error}`
          );
          outputChannel.appendLine(
            `Reconnection error: ${error.message || error}`
          );
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mcp-screenshot.restartServer",
      async () => {
        if (!mcpClient) {
          vscode.window.showErrorMessage(
            "MCP ACS Screenshot server not running"
          );
          return;
        }

        try {
          outputChannel.appendLine("Restarting MCP ACS Screenshot server...");
          mcpClient.stop();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await mcpClient.start();
          vscode.window.showInformationMessage(
            "MCP ACS Screenshot server restarted successfully"
          );
          outputChannel.appendLine("Server restarted successfully");
        } catch (error: any) {
          vscode.window.showErrorMessage(
            `Restart error: ${error.message || error}`
          );
          outputChannel.appendLine(`Restart error: ${error.message || error}`);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "mcp-screenshot.showDiagnostics",
      async () => {
        if (!mcpClient) {
          vscode.window.showErrorMessage(
            "MCP ACS Screenshot server not running"
          );
          return;
        }

        try {
          const diagnostics = mcpClient.getDiagnostics();

          // Show diagnostics in output channel
          outputChannel.clear();
          outputChannel.show(true);
          outputChannel.appendLine("=".repeat(80));
          outputChannel.appendLine("MCP ACS Screenshot Diagnostics");
          outputChannel.appendLine("=".repeat(80));
          outputChannel.appendLine("");
          outputChannel.appendLine(`Extension: ${diagnostics.extensionName}`);
          outputChannel.appendLine(
            `Connection State: ${diagnostics.connectionState}`
          );
          outputChannel.appendLine(
            `Process Running: ${diagnostics.processRunning ? "Yes" : "No"}`
          );
          if (diagnostics.processId) {
            outputChannel.appendLine(`Process ID: ${diagnostics.processId}`);
          }
          outputChannel.appendLine("");
          outputChannel.appendLine(
            `Pending Requests: ${diagnostics.pendingRequestCount}`
          );

          if (diagnostics.pendingRequests.length > 0) {
            outputChannel.appendLine("");
            outputChannel.appendLine("Active Requests:");
            for (const req of diagnostics.pendingRequests) {
              outputChannel.appendLine(
                `  - [${req.id}] ${req.method} (${req.elapsedMs}ms elapsed)`
              );
            }
          }

          if (diagnostics.lastError) {
            outputChannel.appendLine("");
            outputChannel.appendLine(
              `Last Error: ${diagnostics.lastError.message}`
            );
            outputChannel.appendLine(
              `  Timestamp: ${new Date(
                diagnostics.lastError.timestamp
              ).toISOString()}`
            );
          }

          if (diagnostics.recentCommunication.length > 0) {
            outputChannel.appendLine("");
            outputChannel.appendLine("Recent Communication (last 10):");
            const recent = diagnostics.recentCommunication.slice(-10);
            for (const comm of recent) {
              const timestamp = new Date(comm.timestamp).toISOString();
              const status = comm.success ? "✓" : "✗";
              const method = comm.method || "notification";
              outputChannel.appendLine(
                `  ${status} [${timestamp}] ${comm.type}: ${method}`
              );
            }
          }

          if (diagnostics.stateHistory.length > 0) {
            outputChannel.appendLine("");
            outputChannel.appendLine("State History (last 10):");
            const history = diagnostics.stateHistory.slice(-10);
            for (const state of history) {
              const timestamp = new Date(state.timestamp).toISOString();
              outputChannel.appendLine(
                `  [${timestamp}] ${state.state}: ${state.message}`
              );
            }
          }

          outputChannel.appendLine("");
          outputChannel.appendLine("=".repeat(80));
        } catch (error: any) {
          vscode.window.showErrorMessage(
            `Failed to get diagnostics: ${error.message || error}`
          );
          outputChannel.appendLine(
            `Failed to get diagnostics: ${error.message || error}`
          );
        }
      }
    )
  );

  // Start language server
  try {
    await startLanguageServer(context);
    outputChannel.appendLine("Language server started successfully");
  } catch (error) {
    outputChannel.appendLine(`Failed to start language server: ${error}`);
    // Don't fail extension activation if language server fails
    if (process.env.NODE_ENV !== "production") {
      vscode.window.showWarningMessage(
        `MCP ACS Screenshot LSP failed to start: ${error}`
      );
    }
  }

  outputChannel.appendLine("MCP ACS Screenshot extension activated");

  // Register with shared status bar
  await registerExtension("mcp-screenshot", {
    displayName: "MCP ACS Screenshot",
    status: "ok",
    settingsQuery: "mcpScreenshot",
    actions: [
      {
        label: "Capture Full Screen",
        command: "mcp-screenshot.captureFullScreen",
        description: "Take a screenshot of the entire screen",
      },
      {
        label: "Capture Window",
        command: "mcp-screenshot.captureWindow",
        description: "Select a window to capture",
      },
      {
        label: "Capture Region",
        command: "mcp-screenshot.captureRegion",
        description: "Select a region to capture",
      },
      {
        label: "Reconnect to Server",
        command: "mcp-screenshot.reconnectToServer",
        description: "Reconnect to MCP server",
      },
      {
        label: "Restart Server",
        command: "mcp-screenshot.restartServer",
        description: "Restart MCP server",
      },
      {
        label: "Show Diagnostics",
        command: "mcp-screenshot.showDiagnostics",
        description: "Show server diagnostics",
      },
    ],
  });

  // Configure shared status bar output channel (idempotent - only first call takes effect)
  setOutputChannel(outputChannel);

  context.subscriptions.push({
    dispose: () => unregisterExtension("mcp-screenshot"),
  });
}

/**
 * Start the language server for LSP features
 *
 * Initializes and starts the Language Server Protocol server that provides
 * intelligent code assistance for screenshot-related operations including:
 * - Hover information for screenshot functions and parameters
 * - Code lenses for quick actions
 * - Diagnostics for parameter validation
 * - Code completion for configuration objects
 * - Command execution for AI agents
 *
 * The language server runs in a separate Node.js process and communicates
 * with the extension via IPC (Inter-Process Communication).
 *
 * @param context - The VS Code extension context
 * @throws Will log errors but not throw to prevent extension activation failure
 *
 * @remarks
 * The language server is configured to support JavaScript, TypeScript, JSX, TSX,
 * and JSON files. It will automatically activate when these file types are opened.
 *
 * @example
 * ```typescript
 * export async function activate(context: vscode.ExtensionContext) {
 *   await startLanguageServer(context);
 * }
 * ```
 */
async function startLanguageServer(
  context: vscode.ExtensionContext
): Promise<void> {
  // The server is implemented in Node
  const serverModule = context.asAbsolutePath(
    path.join("out", "languageServer.js")
  );

  // If the extension is launched in debug mode, the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ["--nolazy", "--inspect=6009"] },
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for JavaScript, TypeScript, JSX, TSX, and JSON files
    documentSelector: [
      { scheme: "file", language: "javascript" },
      { scheme: "file", language: "typescript" },
      { scheme: "file", language: "javascriptreact" },
      { scheme: "file", language: "typescriptreact" },
      { scheme: "file", language: "json" },
    ],
    synchronize: {
      // Notify the server about file changes to files watched in the workspace
      fileEvents: vscode.workspace.createFileSystemWatcher(
        "**/*.{js,ts,jsx,tsx,json}"
      ),
    },
    outputChannel: outputChannel,
  };

  // Create the language client and start it
  languageClient = new LanguageClient(
    "mcpScreenshotLSP",
    "MCP ACS Screenshot Language Server",
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  await languageClient.start();
}

export async function deactivate() {
  await unregisterExtension("mcp-screenshot");

  // Stop language server
  if (languageClient) {
    try {
      await languageClient.stop();
      outputChannel.appendLine("Language server stopped");
    } catch (error) {
      outputChannel.appendLine(`Error stopping language server: ${error}`);
    }
  }

  mcpClientAccessor.clearClient();

  // Stop MCP client
  if (mcpClient) {
    mcpClient.stop();
  }

  outputChannel.dispose();
}

/**
 * Helper function to capture full screen with arguments from Language Model Tools API
 */
async function captureFullScreenWithArgs(args: {
  format?: string;
  quality?: number;
  savePath?: string;
}): Promise<any> {
  if (!mcpClient) {
    return {
      status: "error",
      message: "MCP ACS Screenshot server not running",
    };
  }

  const status = mcpClient.getConnectionStatus();
  if (status.state !== "connected") {
    return { status: "error", message: `Server not ready (${status.state})` };
  }

  const config = vscode.workspace.getConfiguration("mcpScreenshot");
  const format = args.format || config.get("defaultFormat", "png");
  const quality = args.quality || config.get("defaultQuality", 90);
  const enablePIIMasking = config.get("enablePIIMasking", false);

  return await mcpClient.captureFullScreen({
    format,
    quality,
    enablePIIMasking,
    savePath: args.savePath,
  });
}

/**
 * Helper function to capture region with arguments from Language Model Tools API
 */
async function captureRegionWithArgs(args: {
  x: number;
  y: number;
  width: number;
  height: number;
  format?: string;
  quality?: number;
  savePath?: string;
}): Promise<any> {
  if (!mcpClient) {
    return {
      status: "error",
      message: "MCP ACS Screenshot server not running",
    };
  }

  const status = mcpClient.getConnectionStatus();
  if (status.state !== "connected") {
    return { status: "error", message: `Server not ready (${status.state})` };
  }

  const config = vscode.workspace.getConfiguration("mcpScreenshot");
  const format = args.format || config.get("defaultFormat", "png");
  const quality = args.quality || config.get("defaultQuality", 90);

  return await mcpClient.captureRegion({
    x: args.x,
    y: args.y,
    width: args.width,
    height: args.height,
    format,
    quality,
    savePath: args.savePath,
  });
}

/**
 * Helper function to capture window with arguments from Language Model Tools API
 */
async function captureWindowWithArgs(args: {
  windowTitle: string;
  format?: string;
  quality?: number;
  savePath?: string;
}): Promise<any> {
  if (!mcpClient) {
    return {
      status: "error",
      message: "MCP ACS Screenshot server not running",
    };
  }

  const status = mcpClient.getConnectionStatus();
  if (status.state !== "connected") {
    return { status: "error", message: `Server not ready (${status.state})` };
  }

  const config = vscode.workspace.getConfiguration("mcpScreenshot");
  const format = args.format || config.get("defaultFormat", "png");
  const quality = args.quality || config.get("defaultQuality", 90);

  return await mcpClient.captureWindow({
    windowTitle: args.windowTitle,
    format,
    quality,
    savePath: args.savePath,
  });
}

async function captureFullScreen() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP ACS Screenshot server not running");
    return;
  }

  // Check if server is actually connected
  const status = mcpClient.getConnectionStatus();
  if (status.state !== "connected") {
    vscode.window.showErrorMessage(
      `MCP ACS Screenshot server not ready (${status.state})`
    );
    return;
  }

  try {
    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const format = config.get("defaultFormat", "png");
    const quality = config.get("defaultQuality", 90);
    const enablePIIMasking = config.get("enablePIIMasking", false);
    const autoSave = config.get("autoSave", true);

    let savePath: string | undefined;
    if (autoSave) {
      const saveDir = config.get(
        "saveDirectory",
        "${workspaceFolder}/screenshots"
      );
      const resolvedDir = saveDir.replace(
        "${workspaceFolder}",
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ""
      );
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      savePath = `${resolvedDir}/screenshot-${timestamp}.${format}`;
    }

    outputChannel.appendLine(`Capturing full screen...`);

    const result = await mcpClient.captureFullScreen({
      format,
      quality,
      enablePIIMasking,
      savePath,
    });

    if (result.status === "success") {
      if (savePath) {
        vscode.window.showInformationMessage(
          `Screenshot saved to ${result.filePath}`
        );
        outputChannel.appendLine(`Screenshot saved: ${result.filePath}`);
      } else {
        vscode.window.showInformationMessage(
          "Screenshot captured successfully"
        );
        outputChannel.appendLine("Screenshot captured (base64)");
      }
    } else {
      vscode.window.showErrorMessage(`Screenshot failed: ${result.message}`);
      outputChannel.appendLine(`Screenshot failed: ${result.message}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Screenshot error: ${error}`);
    outputChannel.appendLine(`Screenshot error: ${error}`);
  }
}

async function captureWindow() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP ACS Screenshot server not running");
    return;
  }

  // Check if server is actually connected
  const status = mcpClient.getConnectionStatus();
  if (status.state !== "connected") {
    vscode.window.showErrorMessage(
      `MCP ACS Screenshot server not ready (${status.state})`
    );
    return;
  }

  try {
    // First, list windows
    outputChannel.appendLine("Listing windows...");
    const windowsResult = await mcpClient.listWindows();

    if (windowsResult.status !== "success" || !windowsResult.windows) {
      vscode.window.showErrorMessage("Failed to list windows");
      return;
    }

    // Show quick pick for window selection
    const windowItems = windowsResult.windows.map((w: any) => ({
      label: w.title,
      description: w.processName,
      detail: `${w.bounds.width}x${w.bounds.height}`,
      window: w,
    }));

    const selected = await vscode.window.showQuickPick(windowItems, {
      placeHolder: "Select a window to capture",
    });

    if (!selected) {
      return;
    }

    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const format = config.get("defaultFormat", "png");
    const includeFrameChoice = await vscode.window.showQuickPick(
      ["Yes", "No"],
      {
        placeHolder: "Include window frame?",
      }
    );
    const includeFrame = includeFrameChoice === "Yes";

    outputChannel.appendLine(
      `Capturing window: ${(selected as any).window.title}`
    );

    const result = await mcpClient.captureWindow({
      windowId: (selected as any).window.id,
      format,
      includeFrame,
    });

    if (result.status === "success") {
      vscode.window.showInformationMessage("Window captured successfully");
      outputChannel.appendLine("Window captured successfully");
    } else {
      vscode.window.showErrorMessage(
        `Window capture failed: ${result.message}`
      );
      outputChannel.appendLine(`Window capture failed: ${result.message}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Window capture error: ${error}`);
    outputChannel.appendLine(`Window capture error: ${error}`);
  }
}

async function captureRegion() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP ACS Screenshot server not running");
    return;
  }

  // Check if server is actually connected
  const status = mcpClient.getConnectionStatus();
  if (status.state !== "connected") {
    vscode.window.showErrorMessage(
      `MCP ACS Screenshot server not ready (${status.state})`
    );
    return;
  }

  try {
    // Prompt for region coordinates
    const x = await vscode.window.showInputBox({
      prompt: "Enter X coordinate",
      value: "0",
      validateInput: (value) => {
        const num = parseInt(value);
        return isNaN(num) || num < 0 ? "Must be a non-negative number" : null;
      },
    });

    if (x === undefined) return;

    const y = await vscode.window.showInputBox({
      prompt: "Enter Y coordinate",
      value: "0",
      validateInput: (value) => {
        const num = parseInt(value);
        return isNaN(num) || num < 0 ? "Must be a non-negative number" : null;
      },
    });

    if (y === undefined) return;

    const width = await vscode.window.showInputBox({
      prompt: "Enter width",
      value: "800",
      validateInput: (value) => {
        const num = parseInt(value);
        return isNaN(num) || num <= 0 ? "Must be a positive number" : null;
      },
    });

    if (width === undefined) return;

    const height = await vscode.window.showInputBox({
      prompt: "Enter height",
      value: "600",
      validateInput: (value) => {
        const num = parseInt(value);
        return isNaN(num) || num <= 0 ? "Must be a positive number" : null;
      },
    });

    if (height === undefined) return;

    const config = vscode.workspace.getConfiguration("mcpScreenshot");
    const format = config.get("defaultFormat", "png");

    outputChannel.appendLine(`Capturing region: ${x},${y} ${width}x${height}`);

    const result = await mcpClient.captureRegion({
      x: parseInt(x),
      y: parseInt(y),
      width: parseInt(width),
      height: parseInt(height),
      format,
    });

    if (result.status === "success") {
      vscode.window.showInformationMessage("Region captured successfully");
      outputChannel.appendLine("Region captured successfully");
    } else {
      vscode.window.showErrorMessage(
        `Region capture failed: ${result.message}`
      );
      outputChannel.appendLine(`Region capture failed: ${result.message}`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Region capture error: ${error}`);
    outputChannel.appendLine(`Region capture error: ${error}`);
  }
}

async function listDisplays() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP ACS Screenshot server not running");
    return;
  }

  // Check if server is actually connected
  const status = mcpClient.getConnectionStatus();
  if (status.state !== "connected") {
    vscode.window.showErrorMessage(
      `MCP ACS Screenshot server not ready (${status.state})`
    );
    return;
  }

  try {
    outputChannel.appendLine("Listing displays...");
    const result = await mcpClient.listDisplays();

    if (result.status === "success" && result.displays) {
      const displayInfo = result.displays
        .map(
          (d: any) =>
            `${d.name} (${d.resolution.width}x${d.resolution.height})${
              d.isPrimary ? " [Primary]" : ""
            }`
        )
        .join("\n");

      vscode.window.showInformationMessage(`Displays:\n${displayInfo}`, {
        modal: true,
      });
      outputChannel.appendLine(`Displays:\n${displayInfo}`);
    } else {
      vscode.window.showErrorMessage("Failed to list displays");
      outputChannel.appendLine("Failed to list displays");
    }
  } catch (error) {
    vscode.window.showErrorMessage(`List displays error: ${error}`);
    outputChannel.appendLine(`List displays error: ${error}`);
  }
}

async function listWindows() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP ACS Screenshot server not running");
    return;
  }

  // Check if server is actually connected
  const status = mcpClient.getConnectionStatus();
  if (status.state !== "connected") {
    vscode.window.showErrorMessage(
      `MCP ACS Screenshot server not ready (${status.state})`
    );
    return;
  }

  try {
    outputChannel.appendLine("Listing windows...");
    const result = await mcpClient.listWindows();

    if (result.status === "success" && result.windows) {
      const windowInfo = result.windows
        .map(
          (w: any) =>
            `${w.title} - ${w.processName} (${w.bounds.width}x${w.bounds.height})`
        )
        .join("\n");

      vscode.window.showInformationMessage(`Windows:\n${windowInfo}`, {
        modal: true,
      });
      outputChannel.appendLine(`Windows:\n${windowInfo}`);
    } else {
      vscode.window.showErrorMessage("Failed to list windows");
      outputChannel.appendLine("Failed to list windows");
    }
  } catch (error) {
    vscode.window.showErrorMessage(`List windows error: ${error}`);
    outputChannel.appendLine(`List windows error: ${error}`);
  }
}

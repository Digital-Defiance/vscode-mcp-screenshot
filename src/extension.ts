import * as vscode from "vscode";
import * as path from "path";
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
let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("MCP Screenshot");
  outputChannel.appendLine("MCP Screenshot extension activating...");

  // Initialize MCP client
  const config = vscode.workspace.getConfiguration("mcpScreenshot");
  const autoStart = config.get<boolean>("autoStart", true);

  if (autoStart) {
    try {
      mcpClient = new MCPScreenshotClient(outputChannel);
      await mcpClient.start();
      outputChannel.appendLine("MCP Screenshot server started successfully");

      // Set the client in the accessor for language server access
      mcpClientAccessor.setClient(mcpClient);
    } catch (error) {
      outputChannel.appendLine(`Failed to start MCP server: ${error}`);
      if (process.env.NODE_ENV === "production") {
        vscode.window.showErrorMessage("Failed to start MCP Screenshot server");
      }
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

  // Start language server
  try {
    await startLanguageServer(context);
    outputChannel.appendLine("Language server started successfully");
  } catch (error) {
    outputChannel.appendLine(`Failed to start language server: ${error}`);
    // Don't fail extension activation if language server fails
    if (process.env.NODE_ENV !== "production") {
      vscode.window.showWarningMessage(
        `MCP Screenshot LSP failed to start: ${error}`
      );
    }
  }

  outputChannel.appendLine("MCP Screenshot extension activated");
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
    "MCP Screenshot Language Server",
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  await languageClient.start();
}

export async function deactivate() {
  // Stop language server
  if (languageClient) {
    try {
      await languageClient.stop();
      outputChannel.appendLine("Language server stopped");
    } catch (error) {
      outputChannel.appendLine(`Error stopping language server: ${error}`);
    }
  }

  // Clear MCP client reference
  mcpClientAccessor.clearClient();

  // Stop MCP client
  if (mcpClient) {
    mcpClient.stop();
  }

  outputChannel.dispose();
}

async function captureFullScreen() {
  if (!mcpClient) {
    vscode.window.showErrorMessage("MCP Screenshot server not running");
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
    vscode.window.showErrorMessage("MCP Screenshot server not running");
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
    vscode.window.showErrorMessage("MCP Screenshot server not running");
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
    vscode.window.showErrorMessage("MCP Screenshot server not running");
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
    vscode.window.showErrorMessage("MCP Screenshot server not running");
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

import { MCPScreenshotClient } from "./mcpClient";

/**
 * Singleton accessor for the MCP Screenshot client.
 *
 * This class provides a safe way for the language server to access the MCP client
 * instance that is managed by the extension. It uses the singleton pattern to ensure
 * a single point of access across the extension and language server.
 *
 * @remarks
 * The accessor is necessary because the language server runs in a separate process
 * from the extension, but needs to delegate screenshot commands to the MCP client.
 *
 * @example
 * ```typescript
 * // In extension.ts
 * mcpClientAccessor.setClient(mcpClient);
 *
 * // In languageServer.ts
 * const client = mcpClientAccessor.getClient();
 * if (client) {
 *   await client.captureFullScreen({ format: 'png' });
 * }
 * ```
 */
class MCPClientAccessor {
  private static instance: MCPClientAccessor;
  private client: MCPScreenshotClient | undefined;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.client = undefined;
  }

  /**
   * Get the singleton instance of the accessor
   *
   * @returns The singleton MCPClientAccessor instance
   *
   * @example
   * ```typescript
   * const accessor = MCPClientAccessor.getInstance();
   * ```
   */
  public static getInstance(): MCPClientAccessor {
    if (!MCPClientAccessor.instance) {
      MCPClientAccessor.instance = new MCPClientAccessor();
    }
    return MCPClientAccessor.instance;
  }

  /**
   * Set the MCP client instance
   *
   * This should be called by the extension after the MCP client is initialized.
   *
   * @param client - The MCP Screenshot client instance to store
   *
   * @example
   * ```typescript
   * const mcpClient = new MCPScreenshotClient(outputChannel);
   * await mcpClient.start();
   * mcpClientAccessor.setClient(mcpClient);
   * ```
   */
  public setClient(client: MCPScreenshotClient): void {
    this.client = client;
  }

  /**
   * Get the MCP client instance
   *
   * @returns The MCP Screenshot client instance or undefined if not set
   *
   * @example
   * ```typescript
   * const client = mcpClientAccessor.getClient();
   * if (client) {
   *   const result = await client.listDisplays();
   * }
   * ```
   */
  public getClient(): MCPScreenshotClient | undefined {
    return this.client;
  }

  /**
   * Check if the MCP client is available
   *
   * @returns True if the client is set and available, false otherwise
   *
   * @example
   * ```typescript
   * if (mcpClientAccessor.isAvailable()) {
   *   // Safe to use the client
   *   const client = mcpClientAccessor.getClient();
   * }
   * ```
   */
  public isAvailable(): boolean {
    return this.client !== undefined;
  }

  /**
   * Clear the client reference
   *
   * This should be called during extension deactivation to clean up resources.
   *
   * @example
   * ```typescript
   * export async function deactivate() {
   *   mcpClientAccessor.clearClient();
   * }
   * ```
   */
  public clearClient(): void {
    this.client = undefined;
  }
}

/**
 * Singleton instance of the MCP client accessor
 *
 * Use this instance throughout the extension and language server to access
 * the MCP Screenshot client.
 *
 * @public
 */
export const mcpClientAccessor = MCPClientAccessor.getInstance();

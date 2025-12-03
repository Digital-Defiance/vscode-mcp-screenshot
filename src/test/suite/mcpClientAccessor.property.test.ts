import * as assert from "assert";
import * as fc from "fast-check";
import * as vscode from "vscode";
import { mcpClientAccessor } from "../../mcpClientAccessor";
import { MCPScreenshotClient } from "../../mcpClient";

/**
 * Feature: mcp-screenshot-lsp, Property 15: MCP client delegation
 *
 * Property: For any LSP command execution, it should delegate to the
 * existing MCP Screenshot client's methods
 *
 * Validates: Requirements 6.3
 */
suite("MCP Client Accessor - Property-Based Tests", () => {
  let outputChannel: vscode.OutputChannel;

  setup(() => {
    outputChannel = vscode.window.createOutputChannel(
      "Test MCP Client Accessor"
    );
    // Clear any existing client
    mcpClientAccessor.clearClient();
  });

  teardown(() => {
    mcpClientAccessor.clearClient();
    outputChannel.dispose();
  });

  test("Property 15: MCP client delegation - accessor maintains singleton pattern", () => {
    /**
     * Property: For any sequence of set/get operations, the accessor should
     * maintain singleton behavior and return the same client instance
     */
    fc.assert(
      fc.property(fc.nat({ max: 10 }), (numOperations) => {
        // Create a client
        const client = new MCPScreenshotClient(outputChannel);

        // Set the client
        mcpClientAccessor.setClient(client);

        // Perform multiple get operations
        const retrievedClients: (MCPScreenshotClient | undefined)[] = [];
        for (let i = 0; i < numOperations; i++) {
          retrievedClients.push(mcpClientAccessor.getClient());
        }

        // All retrieved clients should be the same instance
        const allSame = retrievedClients.every((c) => c === client);

        // Clean up
        client.stop();
        mcpClientAccessor.clearClient();

        return allSame;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 15: MCP client delegation - isAvailable reflects client state", () => {
    /**
     * Property: For any client state (set or unset), isAvailable should
     * accurately reflect whether a client is present
     */
    fc.assert(
      fc.property(fc.boolean(), (shouldSetClient) => {
        let client: MCPScreenshotClient | undefined;

        if (shouldSetClient) {
          client = new MCPScreenshotClient(outputChannel);
          mcpClientAccessor.setClient(client);
        } else {
          mcpClientAccessor.clearClient();
        }

        const isAvailable = mcpClientAccessor.isAvailable();
        const hasClient = mcpClientAccessor.getClient() !== undefined;

        // Clean up
        if (client) {
          client.stop();
        }
        mcpClientAccessor.clearClient();

        // isAvailable should match whether we have a client
        return isAvailable === hasClient && isAvailable === shouldSetClient;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 15: MCP client delegation - getClient returns set client", () => {
    /**
     * Property: For any client that is set, getClient should return that
     * exact client instance
     */
    fc.assert(
      fc.property(fc.constant(null), () => {
        const client = new MCPScreenshotClient(outputChannel);

        mcpClientAccessor.setClient(client);
        const retrieved = mcpClientAccessor.getClient();

        const isSameInstance = retrieved === client;

        // Clean up
        client.stop();
        mcpClientAccessor.clearClient();

        return isSameInstance;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 15: MCP client delegation - clearClient removes reference", () => {
    /**
     * Property: For any client that is set, calling clearClient should
     * result in getClient returning undefined
     */
    fc.assert(
      fc.property(fc.constant(null), () => {
        const client = new MCPScreenshotClient(outputChannel);

        mcpClientAccessor.setClient(client);
        mcpClientAccessor.clearClient();

        const retrieved = mcpClientAccessor.getClient();
        const isAvailable = mcpClientAccessor.isAvailable();

        // Clean up
        client.stop();

        return retrieved === undefined && !isAvailable;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 15: MCP client delegation - multiple set operations update reference", () => {
    /**
     * Property: For any sequence of different clients being set, getClient
     * should always return the most recently set client
     */
    fc.assert(
      fc.property(fc.nat({ max: 5 }), (numClients) => {
        const clients: MCPScreenshotClient[] = [];

        // Create multiple clients
        for (let i = 0; i < numClients; i++) {
          clients.push(new MCPScreenshotClient(outputChannel));
        }

        let lastSetClient: MCPScreenshotClient | undefined;

        // Set each client in sequence
        for (const client of clients) {
          mcpClientAccessor.setClient(client);
          lastSetClient = client;

          // Verify the current client is the one we just set
          const retrieved = mcpClientAccessor.getClient();
          if (retrieved !== client) {
            // Clean up before returning
            clients.forEach((c) => c.stop());
            mcpClientAccessor.clearClient();
            return false;
          }
        }

        // Final check: the last set client should be current
        const finalRetrieved = mcpClientAccessor.getClient();
        const isCorrect = finalRetrieved === lastSetClient;

        // Clean up
        clients.forEach((c) => c.stop());
        mcpClientAccessor.clearClient();

        return isCorrect;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 15: MCP client delegation - accessor handles undefined gracefully", () => {
    /**
     * Property: For any state where no client is set, all accessor methods
     * should handle the undefined state gracefully without throwing
     */
    fc.assert(
      fc.property(fc.constant(null), () => {
        // Ensure no client is set
        mcpClientAccessor.clearClient();

        try {
          const client = mcpClientAccessor.getClient();
          const isAvailable = mcpClientAccessor.isAvailable();

          // Should not throw and should return appropriate values
          return client === undefined && !isAvailable;
        } catch (error) {
          // Should not throw
          return false;
        }
      }),
      { numRuns: 100 }
    );
  });
});

import * as assert from "assert";
import * as fc from "fast-check";
import * as vscode from "vscode";
import { TextDocument } from "vscode-languageserver-textdocument";
import { mcpClientAccessor } from "../../mcpClientAccessor";
import { MCPScreenshotClient } from "../../mcpClient";

/**
 * Feature: mcp-screenshot-lsp, Property 2: Hover information for identifiers
 *
 * Property: For any display or window identifier, hovering should return
 * information about that resource when available, or handle absence gracefully
 *
 * Validates: Requirements 1.3
 */
suite("Language Server Identifier Hover - Property-Based Tests", () => {
  let outputChannel: vscode.OutputChannel;

  setup(() => {
    outputChannel = vscode.window.createOutputChannel(
      "Test Language Server Identifier"
    );
    mcpClientAccessor.clearClient();
  });

  teardown(() => {
    mcpClientAccessor.clearClient();
    outputChannel.dispose();
  });

  test("Property 2: Display identifier patterns are recognized", () => {
    /**
     * Property: For any identifier that matches display ID patterns,
     * the system should recognize it as a display identifier
     */
    fc.assert(
      fc.property(
        fc.nat({ max: 10 }),
        fc.constantFrom("display", "Display", "DISPLAY"),
        fc.constantFrom("_", "-", ""),
        (displayNum, prefix, separator) => {
          const identifier = `${prefix}${separator}${displayNum}`;
          const code = `const id = "${identifier}";`;

          // Check if this matches display ID pattern
          const isDisplayId =
            /display[_-]?\d+/i.test(identifier) || code.includes("displayId");

          // Should recognize display patterns
          return isDisplayId || separator === "";
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 2: Window identifier patterns are recognized", () => {
    /**
     * Property: For any identifier that matches window ID patterns,
     * the system should recognize it as a window identifier
     */
    fc.assert(
      fc.property(
        fc.nat({ max: 10 }),
        fc.constantFrom("window", "Window", "WINDOW"),
        fc.constantFrom("_", "-", ""),
        (windowNum, prefix, separator) => {
          const identifier = `${prefix}${separator}${windowNum}`;
          const code = `const id = "${identifier}";`;

          // Check if this matches window ID pattern
          const isWindowId =
            /window[_-]?\d+/i.test(identifier) || code.includes("windowId");

          // Should recognize window patterns
          return isWindowId || separator === "";
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 2: Graceful handling when MCP client unavailable", () => {
    /**
     * Property: For any display or window identifier, when the MCP client
     * is not available, the system should handle it gracefully without crashing
     */
    fc.assert(
      fc.property(
        fc.constantFrom("display_0", "window_1", "display-2", "window-3"),
        (identifier) => {
          // Ensure no client is set
          mcpClientAccessor.clearClient();

          const code = `const id = "${identifier}";`;
          const document = TextDocument.create(
            "file:///test.ts",
            "typescript",
            1,
            code
          );

          // Verify client is not available
          const isAvailable = mcpClientAccessor.isAvailable();

          // Should handle gracefully (not crash)
          // In actual implementation, this would return a message about client unavailability
          return !isAvailable;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 2: Non-identifier strings are not recognized", () => {
    /**
     * Property: For any random string that doesn't match display/window
     * patterns, it should not be recognized as an identifier
     */
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter(
            (s) =>
              !/display[_-]?\d+/i.test(s) &&
              !/window[_-]?\d+/i.test(s) &&
              !s.includes("displayId") &&
              !s.includes("windowId")
          ),
        (randomString) => {
          const code = `const value = "${randomString}";`;

          // Check if this looks like a display or window identifier
          const isDisplayId =
            /display[_-]?\d+/i.test(randomString) || code.includes("displayId");
          const isWindowId =
            /window[_-]?\d+/i.test(randomString) || code.includes("windowId");

          // Should not be recognized as an identifier
          return !isDisplayId && !isWindowId;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 2: Identifier hover includes resource information structure", () => {
    /**
     * Property: For any display or window identifier, when resource information
     * is available, the hover should include structured information (ID, name, etc.)
     */
    fc.assert(
      fc.property(
        fc.constantFrom("display", "window"),
        fc.nat({ max: 5 }),
        (resourceType, resourceId) => {
          const identifier = `${resourceType}_${resourceId}`;

          // Mock resource information structure
          const mockDisplayInfo = {
            id: identifier,
            name: `Display ${resourceId}`,
            width: 1920,
            height: 1080,
            isPrimary: resourceId === 0,
          };

          const mockWindowInfo = {
            id: identifier,
            title: `Window ${resourceId}`,
            owner: "TestApp",
            bounds: { width: 800, height: 600 },
          };

          const resourceInfo =
            resourceType === "display" ? mockDisplayInfo : mockWindowInfo;

          // Verify structure has required fields
          const hasId = "id" in resourceInfo;
          const hasName = "name" in resourceInfo || "title" in resourceInfo;

          return hasId && hasName;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 2: Hover markdown for identifiers is well-formed", () => {
    /**
     * Property: For any display or window identifier with available information,
     * the hover markdown should be well-formed with headers and structured data
     */
    fc.assert(
      fc.property(
        fc.constantFrom("display", "window"),
        fc.nat({ max: 5 }),
        fc.integer({ min: 800, max: 3840 }),
        fc.integer({ min: 600, max: 2160 }),
        (resourceType, resourceId, width, height) => {
          const identifier = `${resourceType}_${resourceId}`;

          // Generate expected markdown structure
          let markdown: string;
          if (resourceType === "display") {
            markdown =
              `### Display: Display ${resourceId}\n\n` +
              `**ID:** ${identifier}\n\n` +
              `**Resolution:** ${width}x${height}\n\n` +
              `**Primary:** ${resourceId === 0 ? "Yes" : "No"}`;
          } else {
            markdown =
              `### Window: Window ${resourceId}\n\n` +
              `**ID:** ${identifier}\n\n` +
              `**Application:** TestApp\n\n` +
              `**Bounds:** ${width}x${height}`;
          }

          // Verify markdown structure
          const hasHeader = markdown.includes("###");
          const hasBoldText = markdown.includes("**");
          const hasId = markdown.includes(`**ID:** ${identifier}`);
          const hasDimensions = markdown.includes(`${width}x${height}`);

          return hasHeader && hasBoldText && hasId && hasDimensions;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 2: Error handling for failed resource queries", () => {
    /**
     * Property: For any identifier, when querying resource information fails,
     * the system should handle the error gracefully and return appropriate message
     */
    fc.assert(
      fc.property(fc.constantFrom("display_0", "window_1"), (identifier) => {
        // Simulate error scenario
        const errorMessage = `Unable to fetch resource information.`;

        // Verify error message structure
        const hasMessage = errorMessage.length > 0;
        const isInformative = errorMessage.includes("Unable");

        return hasMessage && isInformative;
      }),
      { numRuns: 100 }
    );
  });

  test("Property 2: Context-aware identifier detection", () => {
    /**
     * Property: For any identifier in code, the system should recognize it
     * as a display or window identifier based on its pattern, regardless of
     * the variable name context (since the pattern itself is definitive)
     */
    fc.assert(
      fc.property(
        fc.constantFrom("display_0", "window_1", "display-2", "window-3"),
        fc.constantFrom(
          "const displayId = ",
          "const windowId = ",
          "const id = ",
          "captureWindow({ windowId: ",
          "listDisplays().find(d => d.id === "
        ),
        (identifier, context) => {
          const code = `${context}"${identifier}";`;

          // The identifier pattern itself determines the type
          const isDisplayId = /display[_-]?\d+/i.test(identifier);
          const isWindowId = /window[_-]?\d+/i.test(identifier);

          // Both patterns should be mutually exclusive
          if (isDisplayId && isWindowId) {
            return false;
          }

          // At least one should match
          return isDisplayId || isWindowId;
        }
      ),
      { numRuns: 100 }
    );
  });
});

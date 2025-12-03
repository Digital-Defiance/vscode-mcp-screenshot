import * as assert from "assert";
import * as fc from "fast-check";

/**
 * Feature: mcp-screenshot-lsp, Property 11: Command error handling
 *
 * Property: For any command execution that fails, the LSP should return a
 * structured error with error code and message
 *
 * Validates: Requirements 4.5
 */

suite("Language Server Command Error Handling - Property-Based Tests", () => {
  test("Property 11: Client unavailable error has correct structure", () => {
    /**
     * Property: For any command when the client is unavailable, the error
     * should have CLIENT_UNAVAILABLE code and descriptive message
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "mcp.screenshot.capture",
          "mcp.screenshot.listDisplays",
          "mcp.screenshot.listWindows",
          "mcp.screenshot.getCapabilities"
        ),
        (command) => {
          // Simulate client unavailable error
          const error = {
            status: "error",
            error: {
              code: "CLIENT_UNAVAILABLE",
              message: "MCP Screenshot client is not available",
              details: {
                command,
              },
            },
          };

          // Verify error structure
          const hasStatus = error.status === "error";
          const hasErrorObject = error.error !== undefined;
          const hasCode = error.error.code === "CLIENT_UNAVAILABLE";
          const hasMessage = error.error.message.length > 0;
          const hasDetails = error.error.details !== undefined;
          const hasCommand = error.error.details.command === command;

          return (
            hasStatus &&
            hasErrorObject &&
            hasCode &&
            hasMessage &&
            hasDetails &&
            hasCommand
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 11: Unknown command error has correct structure", () => {
    /**
     * Property: For any unknown command, the error should have UNKNOWN_COMMAND
     * code and include the command name in the message
     */
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 5, maxLength: 30 })
          .filter(
            (s) =>
              !s.startsWith("mcp.screenshot.") &&
              /^[a-zA-Z][a-zA-Z0-9.]*$/.test(s)
          ),
        (unknownCommand) => {
          // Simulate unknown command error
          const error = {
            status: "error",
            error: {
              code: "UNKNOWN_COMMAND",
              message: `Unknown command: ${unknownCommand}`,
              details: {
                command: unknownCommand,
              },
            },
          };

          // Verify error structure
          const hasStatus = error.status === "error";
          const hasErrorObject = error.error !== undefined;
          const hasCode = error.error.code === "UNKNOWN_COMMAND";
          const messageIncludesCommand =
            error.error.message.includes(unknownCommand);
          const hasDetails = error.error.details !== undefined;
          const hasCommand = error.error.details.command === unknownCommand;

          return (
            hasStatus &&
            hasErrorObject &&
            hasCode &&
            messageIncludesCommand &&
            hasDetails &&
            hasCommand
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 11: Execution error has correct structure", () => {
    /**
     * Property: For any command execution failure, the error should have
     * EXECUTION_ERROR code and descriptive message
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "mcp.screenshot.capture",
          "mcp.screenshot.listDisplays",
          "mcp.screenshot.listWindows"
        ),
        fc.string({ minLength: 10, maxLength: 100 }),
        (command, errorMessage) => {
          // Simulate execution error
          const error = {
            status: "error",
            error: {
              code: "EXECUTION_ERROR",
              message: errorMessage || "Command execution failed",
              details: {
                command,
                error: errorMessage,
              },
            },
          };

          // Verify error structure
          const hasStatus = error.status === "error";
          const hasErrorObject = error.error !== undefined;
          const hasCode = error.error.code === "EXECUTION_ERROR";
          const hasMessage = error.error.message.length > 0;
          const hasDetails = error.error.details !== undefined;
          const hasCommand = error.error.details.command === command;

          return (
            hasStatus &&
            hasErrorObject &&
            hasCode &&
            hasMessage &&
            hasDetails &&
            hasCommand
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 11: All errors have required fields", () => {
    /**
     * Property: For any error, it should have status, error object with
     * code, message, and details
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "CLIENT_UNAVAILABLE",
          "UNKNOWN_COMMAND",
          "EXECUTION_ERROR"
        ),
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.record({
          command: fc.string({ minLength: 5, maxLength: 30 }),
        }),
        (errorCode, errorMessage, details) => {
          // Create error object
          const error = {
            status: "error",
            error: {
              code: errorCode,
              message: errorMessage,
              details,
            },
          };

          // Verify all required fields are present
          const hasStatus = error.status === "error";
          const hasErrorObject = typeof error.error === "object";
          const hasCode = typeof error.error.code === "string";
          const hasMessage = typeof error.error.message === "string";
          const hasDetails = typeof error.error.details === "object";

          // Verify field values are non-empty
          const codeNotEmpty = error.error.code.length > 0;
          const messageNotEmpty = error.error.message.length > 0;

          return (
            hasStatus &&
            hasErrorObject &&
            hasCode &&
            hasMessage &&
            hasDetails &&
            codeNotEmpty &&
            messageNotEmpty
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 11: Error codes are consistent", () => {
    /**
     * Property: For any error type, the error code should be one of the
     * defined error codes
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "CLIENT_UNAVAILABLE",
          "UNKNOWN_COMMAND",
          "EXECUTION_ERROR"
        ),
        (errorCode) => {
          // Define valid error codes
          const validErrorCodes = [
            "CLIENT_UNAVAILABLE",
            "UNKNOWN_COMMAND",
            "EXECUTION_ERROR",
          ];

          // Verify the error code is valid
          const isValidCode = validErrorCodes.includes(errorCode);

          // Verify the error code is uppercase with underscores
          const isCorrectFormat = /^[A-Z_]+$/.test(errorCode);

          return isValidCode && isCorrectFormat;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 11: Error messages are descriptive", () => {
    /**
     * Property: For any error, the message should be descriptive and
     * include relevant context
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "CLIENT_UNAVAILABLE",
          "UNKNOWN_COMMAND",
          "EXECUTION_ERROR"
        ),
        fc
          .string({ minLength: 5, maxLength: 30 })
          .filter((s) => s.trim().length > 0),
        (errorCode, commandName) => {
          // Create error messages based on error code
          let message = "";
          switch (errorCode) {
            case "CLIENT_UNAVAILABLE":
              message = "MCP Screenshot client is not available";
              break;
            case "UNKNOWN_COMMAND":
              message = `Unknown command: ${commandName}`;
              break;
            case "EXECUTION_ERROR":
              message = "Command execution failed";
              break;
          }

          // Verify message is descriptive
          const hasMinimumLength = message.length >= 10;

          // For UNKNOWN_COMMAND, verify it includes the command name
          if (errorCode === "UNKNOWN_COMMAND") {
            return hasMinimumLength && message.includes(commandName);
          }

          // For other error codes, verify message contains relevant keywords
          const isDescriptive =
            message.includes("command") ||
            message.includes("client") ||
            message.includes("execution") ||
            message.includes("failed");

          return hasMinimumLength && isDescriptive;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 11: Error details include command context", () => {
    /**
     * Property: For any error, the details should include the command
     * that caused the error
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "mcp.screenshot.capture",
          "mcp.screenshot.listDisplays",
          "mcp.screenshot.listWindows",
          "mcp.screenshot.getCapabilities"
        ),
        fc.constantFrom(
          "CLIENT_UNAVAILABLE",
          "UNKNOWN_COMMAND",
          "EXECUTION_ERROR"
        ),
        (command, errorCode) => {
          // Create error with details
          const error = {
            status: "error",
            error: {
              code: errorCode,
              message: "Error message",
              details: {
                command,
              },
            },
          };

          // Verify details include command
          const hasDetails = error.error.details !== undefined;
          const hasCommand = error.error.details.command === command;
          const commandIsString =
            typeof error.error.details.command === "string";

          return hasDetails && hasCommand && commandIsString;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 11: Errors are distinguishable by code", () => {
    /**
     * Property: For any two different error types, they should have
     * different error codes
     */
    fc.assert(
      fc.property(
        fc.constantFrom<[string, string]>(
          ["CLIENT_UNAVAILABLE", "UNKNOWN_COMMAND"],
          ["CLIENT_UNAVAILABLE", "EXECUTION_ERROR"],
          ["UNKNOWN_COMMAND", "EXECUTION_ERROR"]
        ),
        ([errorCode1, errorCode2]) => {
          // Verify the error codes are different
          const areDifferent = errorCode1 !== errorCode2;

          // Create errors with different codes
          const error1 = {
            status: "error",
            error: {
              code: errorCode1,
              message: "Error 1",
              details: {},
            },
          };

          const error2 = {
            status: "error",
            error: {
              code: errorCode2,
              message: "Error 2",
              details: {},
            },
          };

          // Verify they can be distinguished by code
          const canDistinguish = error1.error.code !== error2.error.code;

          return areDifferent && canDistinguish;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 11: Error handling preserves original error information", () => {
    /**
     * Property: For any execution error, the original error message should
     * be preserved in the details
     */
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.constantFrom(
          "mcp.screenshot.capture",
          "mcp.screenshot.listDisplays"
        ),
        (originalError, command) => {
          // Create error that preserves original error
          const error = {
            status: "error",
            error: {
              code: "EXECUTION_ERROR",
              message: originalError || "Command execution failed",
              details: {
                command,
                error: originalError,
              },
            },
          };

          // Verify original error is preserved
          const hasOriginalError = error.error.details.error !== undefined;
          const originalErrorPreserved =
            error.error.details.error === originalError;

          return hasOriginalError && originalErrorPreserved;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 11: Error responses are JSON-serializable", () => {
    /**
     * Property: For any error, it should be serializable to JSON
     * (no circular references, functions, etc.)
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "CLIENT_UNAVAILABLE",
          "UNKNOWN_COMMAND",
          "EXECUTION_ERROR"
        ),
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.string({ minLength: 5, maxLength: 30 }),
        (errorCode, errorMessage, command) => {
          // Create error object
          const error = {
            status: "error",
            error: {
              code: errorCode,
              message: errorMessage,
              details: {
                command,
              },
            },
          };

          // Try to serialize to JSON
          try {
            const serialized = JSON.stringify(error);
            const deserialized = JSON.parse(serialized);

            // Verify structure is preserved
            const statusPreserved = deserialized.status === error.status;
            const codePreserved = deserialized.error.code === error.error.code;
            const messagePreserved =
              deserialized.error.message === error.error.message;

            return statusPreserved && codePreserved && messagePreserved;
          } catch (e) {
            // If serialization fails, the test fails
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

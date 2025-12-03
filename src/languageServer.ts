import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  Hover,
  MarkupKind,
  TextDocumentPositionParams,
  CodeLens,
  CodeLensParams,
  Command,
  ExecuteCommandParams,
  Diagnostic,
  DiagnosticSeverity,
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
  InsertTextFormat,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { mcpClientAccessor } from "./mcpClientAccessor";

// Create a connection for the server using Node's IPC as a transport
const connection = createConnection(ProposedFeatures.all);

// Create a text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

/**
 * Cache for parsed patterns to improve performance
 *
 * Stores the results of pattern detection for each document version to avoid
 * re-parsing the same document multiple times. The cache is keyed by document URI
 * and includes the document version to ensure cache invalidation on changes.
 *
 * @property version - The document version number when patterns were detected
 * @property patterns - Array of detected screenshot patterns
 * @property timestamp - When the patterns were cached (for potential TTL cleanup)
 */
interface PatternCache {
  version: number;
  patterns: ScreenshotPattern[];
  timestamp: number;
}

const patternCache = new Map<string, PatternCache>();

/**
 * Debounce timers for document validation
 */
const validationTimers = new Map<string, NodeJS.Timeout>();

/**
 * Debounce delay in milliseconds
 */
const DEBOUNCE_DELAY = 100;

/**
 * Supported file types for LSP features
 *
 * Defines the file types that the language server can provide features for.
 * Different file types receive different levels of support:
 * - JS/TS/JSX/TSX: Full LSP features (hover, completion, diagnostics, code lenses)
 * - JSON: Configuration validation only
 * - Unsupported: No LSP features
 *
 * @enum {string}
 */
enum FileType {
  /** JavaScript files (.js) */
  JavaScript = "javascript",
  /** TypeScript files (.ts) */
  TypeScript = "typescript",
  /** JSX files (.jsx) */
  JavaScriptReact = "javascriptreact",
  /** TSX files (.tsx) */
  TypeScriptReact = "typescriptreact",
  /** JSON configuration files (.json) */
  JSON = "json",
  /** Unsupported file types */
  Unsupported = "unsupported",
}

/**
 * Get the file type from a document
 *
 * Determines the file type based on the document's language ID. This is used
 * to decide which LSP features to provide for the document.
 *
 * @param document - The text document to check
 * @returns The file type enum value
 *
 * @example
 * ```typescript
 * const fileType = getFileType(document);
 * if (supportsFullFeatures(fileType)) {
 *   // Provide all LSP features
 * }
 * ```
 */
function getFileType(document: TextDocument): FileType {
  const languageId = document.languageId;

  switch (languageId) {
    case "javascript":
      return FileType.JavaScript;
    case "typescript":
      return FileType.TypeScript;
    case "javascriptreact":
      return FileType.JavaScriptReact;
    case "typescriptreact":
      return FileType.TypeScriptReact;
    case "json":
      return FileType.JSON;
    default:
      return FileType.Unsupported;
  }
}

/**
 * Check if file type supports full screenshot features
 *
 * Full features include hover information, code lenses, diagnostics, and code completion.
 * JavaScript, TypeScript, JSX, and TSX files support all features.
 *
 * @param fileType - The file type to check
 * @returns True if the file type supports full LSP features
 *
 * @example
 * ```typescript
 * if (supportsFullFeatures(fileType)) {
 *   // Provide hover, completion, diagnostics, code lenses
 * }
 * ```
 */
function supportsFullFeatures(fileType: FileType): boolean {
  return (
    fileType === FileType.JavaScript ||
    fileType === FileType.TypeScript ||
    fileType === FileType.JavaScriptReact ||
    fileType === FileType.TypeScriptReact
  );
}

/**
 * Check if file type supports JSON configuration validation
 */
function supportsJSONValidation(fileType: FileType): boolean {
  return fileType === FileType.JSON;
}

/**
 * Check if file type is supported at all
 */
function isSupportedFileType(fileType: FileType): boolean {
  return fileType !== FileType.Unsupported;
}

// Initialize the language server
connection.onInitialize((params: InitializeParams): InitializeResult => {
  connection.console.log("MCP Screenshot Language Server initializing...");

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      hoverProvider: true,
      codeLensProvider: {
        resolveProvider: false,
      },
      executeCommandProvider: {
        commands: [
          "mcp.screenshot.capture",
          "mcp.screenshot.listDisplays",
          "mcp.screenshot.listWindows",
          "mcp.screenshot.getCapabilities",
        ],
      },
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: [".", ":", '"', "'"],
      },
    },
  };

  return result;
});

connection.onInitialized(() => {
  connection.console.log("MCP Screenshot Language Server initialized");
});

// Listen for document open events
documents.onDidOpen((event) => {
  connection.console.log(`Document opened: ${event.document.uri}`);
  // Clear any existing timer
  clearValidationTimer(event.document.uri);
  // Validate immediately on open
  validateTextDocument(event.document);
});

// Listen for document change events with debouncing
documents.onDidChangeContent((change) => {
  connection.console.log(`Document changed: ${change.document.uri}`);

  // Clear any existing timer for this document
  clearValidationTimer(change.document.uri);

  // Set a new timer to validate after debounce delay
  const timer = setTimeout(() => {
    validateTextDocument(change.document);
    validationTimers.delete(change.document.uri);
  }, DEBOUNCE_DELAY);

  validationTimers.set(change.document.uri, timer);
});

// Listen for document close events
documents.onDidClose((event) => {
  connection.console.log(`Document closed: ${event.document.uri}`);

  // Clear any pending validation timer
  clearValidationTimer(event.document.uri);

  // Clear pattern cache
  patternCache.delete(event.document.uri);

  // Clear diagnostics when document is closed
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

/**
 * Clear validation timer for a document
 *
 * Cancels any pending validation timer for the specified document URI.
 * This is used to implement debouncing of document validation.
 *
 * @param uri - The document URI
 *
 * @remarks
 * This function is called when:
 * - A new change event occurs (to reset the debounce timer)
 * - A document is closed (to clean up resources)
 * - A document is opened (to clear any stale timers)
 */
function clearValidationTimer(uri: string): void {
  const timer = validationTimers.get(uri);
  if (timer) {
    clearTimeout(timer);
    validationTimers.delete(uri);
  }
}

/**
 * Validate a text document and send diagnostics
 *
 * Performs comprehensive validation of screenshot-related code and sends
 * diagnostics to VS Code. The validation includes:
 * - Format value validation (png, jpeg, webp)
 * - Quality range validation (0-100)
 * - Missing parameter detection
 * - Deprecated API detection
 * - Region parameter validation
 * - JSON configuration validation (for JSON files)
 *
 * @param textDocument - The document to validate
 *
 * @remarks
 * This function is debounced to avoid excessive validation during rapid typing.
 * It uses pattern detection with caching for improved performance.
 *
 * @example
 * ```typescript
 * documents.onDidChangeContent((change) => {
 *   validateTextDocument(change.document);
 * });
 * ```
 */
function validateTextDocument(textDocument: TextDocument): void {
  const fileType = getFileType(textDocument);

  // Skip unsupported file types
  if (!isSupportedFileType(fileType)) {
    return;
  }

  const text = textDocument.getText();
  const diagnostics: Diagnostic[] = [];

  // For JSON files, only validate configuration structure
  if (supportsJSONValidation(fileType)) {
    diagnostics.push(...validateJSONConfiguration(text, textDocument));
  }

  // For JS/TS files, provide full validation
  if (supportsFullFeatures(fileType)) {
    // Use pattern detection to identify screenshot operations with caching
    const patterns = detectScreenshotPatterns(
      text,
      textDocument.uri,
      textDocument.version
    );

    // Validate format values
    diagnostics.push(...validateFormatValues(text, textDocument));

    // Validate quality ranges
    diagnostics.push(...validateQualityRanges(text, textDocument));

    // Validate missing parameters
    diagnostics.push(...validateMissingParameters(text, textDocument));

    // Validate deprecated APIs
    diagnostics.push(...validateDeprecatedAPIs(text, textDocument));

    // Validate region capture parameters using pattern detection
    diagnostics.push(...validateRegionParameters(patterns, text, textDocument));
  }

  // Send diagnostics to VSCode
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

/**
 * Validate JSON configuration files for screenshot settings
 */
function validateJSONConfiguration(
  text: string,
  textDocument: TextDocument
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  try {
    // Try to parse as JSON
    const config = JSON.parse(text);

    // Check if it looks like a screenshot configuration
    if (
      config &&
      typeof config === "object" &&
      (config.format ||
        config.quality ||
        config.enablePIIMasking ||
        config.savePath)
    ) {
      // Validate format if present
      if (config.format) {
        const validFormats = ["png", "jpeg", "webp"];
        if (!validFormats.includes(config.format)) {
          // Find the format field in the text
          const formatMatch = text.match(/"format"\s*:\s*"([^"]+)"/);
          if (formatMatch) {
            const startPos = textDocument.positionAt(
              text.indexOf(formatMatch[0])
            );
            const endPos = textDocument.positionAt(
              text.indexOf(formatMatch[0]) + formatMatch[0].length
            );

            diagnostics.push({
              severity: DiagnosticSeverity.Warning,
              range: { start: startPos, end: endPos },
              message: `Invalid format value '${
                config.format
              }'. Valid formats are: ${validFormats.join(", ")}`,
              source: "mcp-screenshot",
              code: "invalid-format",
            });
          }
        }
      }

      // Validate quality if present
      if (config.quality !== undefined) {
        const quality = Number(config.quality);
        if (isNaN(quality) || quality < 0 || quality > 100) {
          const qualityMatch = text.match(/"quality"\s*:\s*(\d+)/);
          if (qualityMatch) {
            const startPos = textDocument.positionAt(
              text.indexOf(qualityMatch[0])
            );
            const endPos = textDocument.positionAt(
              text.indexOf(qualityMatch[0]) + qualityMatch[0].length
            );

            diagnostics.push({
              severity: DiagnosticSeverity.Error,
              range: { start: startPos, end: endPos },
              message: `Quality value ${quality} is out of range. Quality must be between 0 and 100.`,
              source: "mcp-screenshot",
              code: "quality-out-of-range",
            });
          }
        }
      }
    }
  } catch (error) {
    // Not valid JSON or not a screenshot config, skip validation
  }

  return diagnostics;
}

/**
 * Validate format values in screenshot configurations
 */
function validateFormatValues(
  text: string,
  textDocument: TextDocument
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const validFormats = ["png", "jpeg", "webp"];

  // Pattern to match format: 'value' or format: "value"
  const formatPattern = /format\s*:\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = formatPattern.exec(text)) !== null) {
    const formatValue = match[1];
    if (!validFormats.includes(formatValue)) {
      const startPos = textDocument.positionAt(match.index);
      const endPos = textDocument.positionAt(match.index + match[0].length);

      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Warning,
        range: {
          start: startPos,
          end: endPos,
        },
        message: `Invalid format value '${formatValue}'. Valid formats are: ${validFormats.join(
          ", "
        )}`,
        source: "mcp-screenshot",
        code: "invalid-format",
      };

      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}

/**
 * Validate quality parameter ranges
 */
function validateQualityRanges(
  text: string,
  textDocument: TextDocument
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Pattern to match quality: number (including negative numbers)
  const qualityPattern = /quality\s*:\s*(-?\d+)/g;
  let match;

  while ((match = qualityPattern.exec(text)) !== null) {
    const qualityValue = parseInt(match[1], 10);
    if (qualityValue < 0 || qualityValue > 100) {
      const startPos = textDocument.positionAt(match.index);
      const endPos = textDocument.positionAt(match.index + match[0].length);

      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: startPos,
          end: endPos,
        },
        message: `Quality value ${qualityValue} is out of range. Quality must be between 0 and 100.`,
        source: "mcp-screenshot",
        code: "quality-out-of-range",
      };

      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}

/**
 * Validate missing required parameters in screenshot calls
 */
function validateMissingParameters(
  text: string,
  textDocument: TextDocument
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = text.split("\n");

  lines.forEach((line, lineIndex) => {
    // Check for captureFullScreen calls
    const fullScreenMatch = line.match(/captureFullScreen\s*\(\s*\)/);
    if (fullScreenMatch) {
      const startPos = {
        line: lineIndex,
        character: fullScreenMatch.index || 0,
      };
      const endPos = {
        line: lineIndex,
        character: (fullScreenMatch.index || 0) + fullScreenMatch[0].length,
      };

      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: startPos,
          end: endPos,
        },
        message:
          "captureFullScreen requires a configuration object with at least a 'format' parameter",
        source: "mcp-screenshot",
        code: "missing-parameters",
      };

      diagnostics.push(diagnostic);
    }

    // Check for captureWindow calls
    const windowMatch = line.match(/captureWindow\s*\(\s*\)/);
    if (windowMatch) {
      const startPos = { line: lineIndex, character: windowMatch.index || 0 };
      const endPos = {
        line: lineIndex,
        character: (windowMatch.index || 0) + windowMatch[0].length,
      };

      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: startPos,
          end: endPos,
        },
        message:
          "captureWindow requires a configuration object with 'format' and either 'windowId' or 'windowTitle'",
        source: "mcp-screenshot",
        code: "missing-parameters",
      };

      diagnostics.push(diagnostic);
    }

    // Check for captureRegion calls
    const regionMatch = line.match(/captureRegion\s*\(\s*\)/);
    if (regionMatch) {
      const startPos = { line: lineIndex, character: regionMatch.index || 0 };
      const endPos = {
        line: lineIndex,
        character: (regionMatch.index || 0) + regionMatch[0].length,
      };

      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: startPos,
          end: endPos,
        },
        message:
          "captureRegion requires a configuration object with 'x', 'y', 'width', 'height', and 'format' parameters",
        source: "mcp-screenshot",
        code: "missing-parameters",
      };

      diagnostics.push(diagnostic);
    }
  });

  return diagnostics;
}

/**
 * Validate deprecated API usage
 */
function validateDeprecatedAPIs(
  text: string,
  textDocument: TextDocument
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Define deprecated APIs and their replacements
  const deprecatedAPIs: Record<
    string,
    { replacement: string; message: string }
  > = {
    takeScreenshot: {
      replacement: "captureFullScreen",
      message: "takeScreenshot is deprecated. Use captureFullScreen instead.",
    },
    getScreenshot: {
      replacement: "captureFullScreen",
      message: "getScreenshot is deprecated. Use captureFullScreen instead.",
    },
    screenshotWindow: {
      replacement: "captureWindow",
      message: "screenshotWindow is deprecated. Use captureWindow instead.",
    },
    screenshotRegion: {
      replacement: "captureRegion",
      message: "screenshotRegion is deprecated. Use captureRegion instead.",
    },
    getDisplayList: {
      replacement: "listDisplays",
      message: "getDisplayList is deprecated. Use listDisplays instead.",
    },
    getWindowList: {
      replacement: "listWindows",
      message: "getWindowList is deprecated. Use listWindows instead.",
    },
  };

  for (const [deprecatedAPI, info] of Object.entries(deprecatedAPIs)) {
    const pattern = new RegExp(`\\b${deprecatedAPI}\\b`, "g");
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const startPos = textDocument.positionAt(match.index);
      const endPos = textDocument.positionAt(match.index + match[0].length);

      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Information,
        range: {
          start: startPos,
          end: endPos,
        },
        message: `${info.message}\n\nMigration: Replace with ${info.replacement}()`,
        source: "mcp-screenshot",
        code: "deprecated-api",
      };

      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}

/**
 * Validate region capture parameters using pattern detection
 */
function validateRegionParameters(
  patterns: ScreenshotPattern[],
  text: string,
  textDocument: TextDocument
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Filter for region patterns
  const regionPatterns = patterns.filter((p) => p.type === "region");

  for (const pattern of regionPatterns) {
    const params = pattern.parameters || {};
    const requiredParams = ["x", "y", "width", "height"];
    const missingParams = requiredParams.filter((p) => params[p] === undefined);

    // Check for missing required parameters
    if (missingParams.length > 0) {
      const startPos = { line: pattern.line, character: pattern.character };
      const endPos = {
        line: pattern.line,
        character: pattern.character + pattern.matchedText.length,
      };

      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: { start: startPos, end: endPos },
        message: `Region capture is missing required parameters: ${missingParams.join(
          ", "
        )}`,
        source: "mcp-screenshot",
        code: "missing-region-parameters",
      };

      diagnostics.push(diagnostic);
    }

    // Validate parameter values
    if (params.width !== undefined && params.width <= 0) {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: pattern.line, character: 0 },
          end: { line: pattern.line, character: 1000 },
        },
        message: `Region width must be positive, got ${params.width}`,
        source: "mcp-screenshot",
        code: "invalid-region-width",
      };
      diagnostics.push(diagnostic);
    }

    if (params.height !== undefined && params.height <= 0) {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: pattern.line, character: 0 },
          end: { line: pattern.line, character: 1000 },
        },
        message: `Region height must be positive, got ${params.height}`,
        source: "mcp-screenshot",
        code: "invalid-region-height",
      };
      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}

// Hover provider
connection.onHover(
  async (params: TextDocumentPositionParams): Promise<Hover | null> => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }

    const fileType = getFileType(document);

    // Only provide hover for supported file types with full features
    if (!supportsFullFeatures(fileType)) {
      return null;
    }

    const position = params.position;
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Use pattern detection to identify screenshot-related code with caching
    const patterns = detectScreenshotPatterns(
      text,
      document.uri,
      document.version
    );
    const currentLinePatterns = patterns.filter(
      (p) => p.line === position.line
    );

    // Get the word at the current position
    const wordRange = getWordRangeAtPosition(text, offset);
    if (!wordRange) {
      return null;
    }

    const word = text.substring(wordRange.start, wordRange.end);
    const line = document.getText({
      start: { line: position.line, character: 0 },
      end: { line: position.line + 1, character: 0 },
    });

    // If we're on a line with a detected pattern, provide enhanced hover
    if (currentLinePatterns.length > 0) {
      const pattern = currentLinePatterns[0];

      // For region patterns, provide parameter validation info
      if (pattern.type === "region" && pattern.parameters) {
        const regionHover = getRegionPatternHover(pattern);
        if (regionHover) {
          return regionHover;
        }
      }
    }

    // Check for screenshot function calls
    const functionHover = getScreenshotFunctionHover(word, line);
    if (functionHover) {
      return functionHover;
    }

    // Check for configuration object properties
    const configHover = getConfigurationHover(word, text, offset);
    if (configHover) {
      return configHover;
    }

    // Check for display/window identifiers
    const identifierHover = await getIdentifierHover(word, line);
    if (identifierHover) {
      return identifierHover;
    }

    return null;
  }
);

/**
 * Get the word range at a given position
 */
function getWordRangeAtPosition(
  text: string,
  offset: number
): { start: number; end: number } | null {
  if (offset < 0 || offset > text.length) {
    return null;
  }

  // Find word boundaries
  let start = offset;
  let end = offset;

  // Move start backward to find word start
  while (start > 0 && /[a-zA-Z0-9_]/.test(text[start - 1])) {
    start--;
  }

  // Move end forward to find word end
  while (end < text.length && /[a-zA-Z0-9_]/.test(text[end])) {
    end++;
  }

  if (start === end) {
    return null;
  }

  return { start, end };
}

/**
 * Get hover information for screenshot functions
 */
function getScreenshotFunctionHover(word: string, line: string): Hover | null {
  const functionDocs: Record<string, string> = {
    captureFullScreen: `
### captureFullScreen

Captures a screenshot of the entire screen.

**Parameters:**
- \`format\`: string - Image format ('png', 'jpeg', 'webp')
- \`quality?\`: number - Image quality (0-100, for jpeg/webp)
- \`enablePIIMasking?\`: boolean - Enable PII masking
- \`savePath?\`: string - Path to save the screenshot

**Returns:** Promise with screenshot data

**Example:**
\`\`\`typescript
await captureFullScreen({ format: 'png' });
\`\`\`
    `,
    captureWindow: `
### captureWindow

Captures a screenshot of a specific window.

**Parameters:**
- \`windowId?\`: string - Window identifier
- \`windowTitle?\`: string - Window title to match
- \`format\`: string - Image format ('png', 'jpeg', 'webp')
- \`includeFrame?\`: boolean - Include window frame

**Returns:** Promise with screenshot data

**Example:**
\`\`\`typescript
await captureWindow({ windowTitle: 'VSCode', format: 'png' });
\`\`\`
    `,
    captureRegion: `
### captureRegion

Captures a screenshot of a specific screen region.

**Parameters:**
- \`x\`: number - X coordinate of top-left corner
- \`y\`: number - Y coordinate of top-left corner
- \`width\`: number - Width of the region
- \`height\`: number - Height of the region
- \`format\`: string - Image format ('png', 'jpeg', 'webp')

**Returns:** Promise with screenshot data

**Example:**
\`\`\`typescript
await captureRegion({ x: 0, y: 0, width: 800, height: 600, format: 'png' });
\`\`\`
    `,
    listDisplays: `
### listDisplays

Lists all available displays.

**Parameters:** None

**Returns:** Promise with array of display information

**Example:**
\`\`\`typescript
const displays = await listDisplays();
\`\`\`
    `,
    listWindows: `
### listWindows

Lists all available windows.

**Parameters:** None

**Returns:** Promise with array of window information

**Example:**
\`\`\`typescript
const windows = await listWindows();
\`\`\`
    `,
  };

  if (functionDocs[word]) {
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: functionDocs[word].trim(),
      },
    };
  }

  return null;
}

/**
 * Get hover information for configuration object properties
 */
function getConfigurationHover(
  word: string,
  text: string,
  offset: number
): Hover | null {
  const configDocs: Record<string, string> = {
    format: `
### format

Image format for the screenshot.

**Type:** \`'png' | 'jpeg' | 'webp'\`

**Valid values:**
- \`'png'\` - PNG format (lossless)
- \`'jpeg'\` - JPEG format (lossy, supports quality parameter)
- \`'webp'\` - WebP format (lossy, supports quality parameter)
    `,
    quality: `
### quality

Image quality for lossy formats (jpeg, webp).

**Type:** \`number\`

**Range:** 0-100

**Default:** 90

Higher values produce better quality but larger file sizes.
    `,
    enablePIIMasking: `
### enablePIIMasking

Enable automatic masking of Personally Identifiable Information.

**Type:** \`boolean\`

**Default:** false

When enabled, the system will attempt to detect and mask PII in screenshots.
    `,
    savePath: `
### savePath

Path where the screenshot should be saved.

**Type:** \`string\`

If not provided, the screenshot data will be returned without saving to disk.
    `,
    windowId: `
### windowId

Unique identifier for the window to capture.

**Type:** \`string\`

Use \`listWindows()\` to get available window IDs.
    `,
    windowTitle: `
### windowTitle

Title of the window to capture.

**Type:** \`string\`

The system will search for a window with a matching title.
    `,
    includeFrame: `
### includeFrame

Include the window frame in the capture.

**Type:** \`boolean\`

**Default:** true

When false, only the window content is captured.
    `,
    x: `
### x

X coordinate of the top-left corner of the region.

**Type:** \`number\`

Coordinate is relative to the screen origin.
    `,
    y: `
### y

Y coordinate of the top-left corner of the region.

**Type:** \`number\`

Coordinate is relative to the screen origin.
    `,
    width: `
### width

Width of the region to capture.

**Type:** \`number\`

Must be a positive number.
    `,
    height: `
### height

Height of the region to capture.

**Type:** \`number\`

Must be a positive number.
    `,
  };

  if (configDocs[word]) {
    // Check if we're in a configuration context
    const before = text.substring(Math.max(0, offset - 200), offset);
    if (
      before.includes("capture") ||
      before.includes("screenshot") ||
      before.includes("{")
    ) {
      return {
        contents: {
          kind: MarkupKind.Markdown,
          value: configDocs[word].trim(),
        },
      };
    }
  }

  return null;
}

/**
 * Get hover information for region capture patterns
 */
function getRegionPatternHover(pattern: ScreenshotPattern): Hover | null {
  if (!pattern.parameters) {
    return null;
  }

  const params = pattern.parameters;
  const hasAllParams =
    params.x !== undefined &&
    params.y !== undefined &&
    params.width !== undefined &&
    params.height !== undefined;

  let message = `### Region Capture\n\n`;

  if (hasAllParams) {
    message += `**Detected Parameters:**\n`;
    message += `- X: ${params.x}\n`;
    message += `- Y: ${params.y}\n`;
    message += `- Width: ${params.width}\n`;
    message += `- Height: ${params.height}\n\n`;
    message += `**Region:** ${params.width}x${params.height} at (${params.x}, ${params.y})`;
  } else {
    message += `**Missing Parameters:**\n`;
    if (params.x === undefined) message += `- x (required)\n`;
    if (params.y === undefined) message += `- y (required)\n`;
    if (params.width === undefined) message += `- width (required)\n`;
    if (params.height === undefined) message += `- height (required)\n`;
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: message,
    },
  };
}

/**
 * Get hover information for display/window identifiers
 */
async function getIdentifierHover(
  word: string,
  line: string
): Promise<Hover | null> {
  // Check if this looks like a display or window identifier
  const isDisplayId =
    /display[_-]?\d+/i.test(word) || line.includes("displayId");
  const isWindowId = /window[_-]?\d+/i.test(word) || line.includes("windowId");

  if (!isDisplayId && !isWindowId) {
    return null;
  }

  const client = mcpClientAccessor.getClient();
  if (!client) {
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: `### ${word}\n\nMCP Screenshot client not available. Start the extension to get resource information.`,
      },
    };
  }

  try {
    if (isDisplayId) {
      const displays = await client.listDisplays();
      if (displays && displays.displays) {
        const displayInfo = displays.displays.find(
          (d: any) => d.id === word || d.name === word
        );
        if (displayInfo) {
          return {
            contents: {
              kind: MarkupKind.Markdown,
              value:
                `### Display: ${displayInfo.name || displayInfo.id}\n\n` +
                `**ID:** ${displayInfo.id}\n\n` +
                `**Resolution:** ${displayInfo.width}x${displayInfo.height}\n\n` +
                `**Primary:** ${displayInfo.isPrimary ? "Yes" : "No"}`,
            },
          };
        }
      }
    } else if (isWindowId) {
      const windows = await client.listWindows();
      if (windows && windows.windows) {
        const windowInfo = windows.windows.find(
          (w: any) => w.id === word || w.title === word
        );
        if (windowInfo) {
          return {
            contents: {
              kind: MarkupKind.Markdown,
              value:
                `### Window: ${windowInfo.title}\n\n` +
                `**ID:** ${windowInfo.id}\n\n` +
                `**Application:** ${windowInfo.owner || "Unknown"}\n\n` +
                `**Bounds:** ${windowInfo.bounds?.width}x${windowInfo.bounds?.height}`,
            },
          };
        }
      }
    }
  } catch (error) {
    connection.console.error(`Error fetching resource info: ${error}`);
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: `### ${word}\n\nUnable to fetch resource information.`,
      },
    };
  }

  return null;
}

/**
 * Pattern detection for screenshot operations
 *
 * Represents a detected screenshot-related pattern in the code. Patterns are used
 * to provide contextual LSP features like code lenses and enhanced hover information.
 *
 * @property type - The type of screenshot operation detected
 * @property line - The line number where the pattern was found (0-indexed)
 * @property character - The character position where the pattern starts (0-indexed)
 * @property matchedText - The actual text that matched the pattern
 * @property parameters - Optional extracted parameters (e.g., x, y, width, height for regions)
 *
 * @example
 * ```typescript
 * const pattern: ScreenshotPattern = {
 *   type: 'region',
 *   line: 10,
 *   character: 5,
 *   matchedText: 'captureRegion',
 *   parameters: { x: 0, y: 0, width: 800, height: 600 }
 * };
 * ```
 */
interface ScreenshotPattern {
  type: "capture" | "list_displays" | "list_windows" | "region";
  line: number;
  character: number;
  matchedText: string;
  parameters?: Record<string, any>;
}

/**
 * Comprehensive pattern detection for screenshot operations with caching
 *
 * Detects various screenshot-related patterns in code including:
 * - Capture operations (fullscreen, window, region)
 * - Display enumeration (listDisplays, getDisplays)
 * - Window selection (listWindows, getWindows)
 * - Region capture with parameter extraction
 *
 * Results are cached per document version to improve performance during
 * rapid document changes.
 *
 * @param text - The document text to analyze
 * @param uri - Optional document URI for caching
 * @param version - Optional document version for cache validation
 * @returns Array of detected screenshot patterns
 *
 * @remarks
 * Pattern detection uses regex matching to identify screenshot-related code.
 * For region captures, it attempts to extract x, y, width, and height parameters.
 *
 * The cache is keyed by URI and version, ensuring that cached results are only
 * used when the document hasn't changed.
 *
 * @example
 * ```typescript
 * const patterns = detectScreenshotPatterns(
 *   document.getText(),
 *   document.uri,
 *   document.version
 * );
 *
 * for (const pattern of patterns) {
 *   if (pattern.type === 'capture') {
 *     // Generate code lens for capture operation
 *   }
 * }
 * ```
 */
function detectScreenshotPatterns(
  text: string,
  uri?: string,
  version?: number
): ScreenshotPattern[] {
  // Check cache if uri and version are provided
  if (uri && version !== undefined) {
    const cached = patternCache.get(uri);
    if (cached && cached.version === version) {
      connection.console.log(`Using cached patterns for ${uri}`);
      return cached.patterns;
    }
  }

  const patterns: ScreenshotPattern[] = [];
  const lines = text.split("\n");

  // Patterns to detect capture operations (fullscreen and window)
  const capturePatterns = [
    /captureFullScreen/,
    /captureWindow/,
    /screenshot.*capture/i,
    /capture.*screenshot/i,
    /takeScreenshot/i,
    /getScreenshot/i,
    /screenshotWindow/i,
  ];

  // Patterns to detect region capture specifically
  const regionCapturePatterns = [
    /captureRegion/,
    /screenshot.*region/i,
    /region.*capture/i,
    /screenshotRegion/i,
    /capture.*area/i,
    /screenshot.*area/i,
  ];

  // Patterns to detect display enumeration
  const listDisplaysPatterns = [
    /listDisplays/,
    /getDisplays/,
    /displays.*list/i,
    /enumerate.*displays/i,
    /getDisplayList/i,
    /availableDisplays/i,
    /screenList/i,
  ];

  // Patterns to detect window selection/enumeration
  const listWindowsPatterns = [
    /listWindows/,
    /getWindows/,
    /windows.*list/i,
    /enumerate.*windows/i,
    /getWindowList/i,
    /availableWindows/i,
    /windowList/i,
  ];

  lines.forEach((line, lineIndex) => {
    // Track if we've already matched this line to avoid duplicates
    let matched = false;

    // Check for region capture patterns first (more specific)
    if (!matched) {
      for (const pattern of regionCapturePatterns) {
        const match = line.match(pattern);
        if (match && match.index !== undefined) {
          // Try to extract parameters if present
          const params = extractRegionParameters(line);
          patterns.push({
            type: "region",
            line: lineIndex,
            character: match.index,
            matchedText: match[0],
            parameters: params,
          });
          matched = true;
          break;
        }
      }
    }

    // Check for general capture patterns
    if (!matched) {
      for (const pattern of capturePatterns) {
        const match = line.match(pattern);
        if (match && match.index !== undefined) {
          patterns.push({
            type: "capture",
            line: lineIndex,
            character: match.index,
            matchedText: match[0],
          });
          matched = true;
          break;
        }
      }
    }

    // Check for list displays patterns
    if (!matched) {
      for (const pattern of listDisplaysPatterns) {
        const match = line.match(pattern);
        if (match && match.index !== undefined) {
          patterns.push({
            type: "list_displays",
            line: lineIndex,
            character: match.index,
            matchedText: match[0],
          });
          matched = true;
          break;
        }
      }
    }

    // Check for list windows patterns
    if (!matched) {
      for (const pattern of listWindowsPatterns) {
        const match = line.match(pattern);
        if (match && match.index !== undefined) {
          patterns.push({
            type: "list_windows",
            line: lineIndex,
            character: match.index,
            matchedText: match[0],
          });
          matched = true;
          break;
        }
      }
    }
  });

  // Cache the results if uri and version are provided
  if (uri && version !== undefined) {
    patternCache.set(uri, {
      version,
      patterns,
      timestamp: Date.now(),
    });
  }

  return patterns;
}

/**
 * Extract region parameters from a line of code
 *
 * Attempts to parse x, y, width, and height parameters from a line containing
 * a region capture operation. Uses regex to match parameter patterns like:
 * - `x: 100`
 * - `y: 200`
 * - `width: 800`
 * - `height: 600`
 *
 * @param line - The line of code to parse
 * @returns Object containing extracted parameters, or undefined if none found
 *
 * @remarks
 * This function only extracts numeric literal values. It does not evaluate
 * expressions or variables.
 *
 * @example
 * ```typescript
 * const line = "captureRegion({ x: 0, y: 0, width: 800, height: 600 })";
 * const params = extractRegionParameters(line);
 * // params = { x: 0, y: 0, width: 800, height: 600 }
 * ```
 */
function extractRegionParameters(
  line: string
): Record<string, any> | undefined {
  const params: Record<string, any> = {};

  // Try to extract x, y, width, height parameters
  const xMatch = line.match(/\bx\s*:\s*(\d+)/);
  const yMatch = line.match(/\by\s*:\s*(\d+)/);
  const widthMatch = line.match(/\bwidth\s*:\s*(\d+)/);
  const heightMatch = line.match(/\bheight\s*:\s*(\d+)/);

  if (xMatch) params.x = parseInt(xMatch[1], 10);
  if (yMatch) params.y = parseInt(yMatch[1], 10);
  if (widthMatch) params.width = parseInt(widthMatch[1], 10);
  if (heightMatch) params.height = parseInt(heightMatch[1], 10);

  // Only return params if we found at least one
  return Object.keys(params).length > 0 ? params : undefined;
}

// Code lens provider
connection.onCodeLens(async (params: CodeLensParams): Promise<CodeLens[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  const fileType = getFileType(document);

  // Only provide code lenses for supported file types with full features
  if (!supportsFullFeatures(fileType)) {
    return [];
  }

  const text = document.getText();
  const codeLenses: CodeLens[] = [];

  // Detect screenshot patterns and generate code lenses with caching
  const patterns = detectScreenshotPatterns(
    text,
    document.uri,
    document.version
  );

  for (const pattern of patterns) {
    let command: Command;
    let title: string;

    switch (pattern.type) {
      case "capture":
        title = "📸 Capture Screenshot";
        command = {
          title,
          command: "mcp.screenshot.capture",
          arguments: [{ format: "png" }],
        };
        break;

      case "list_displays":
        title = "🖥️ List Displays";
        command = {
          title,
          command: "mcp.screenshot.listDisplays",
        };
        break;

      case "list_windows":
        title = "🪟 List Windows";
        command = {
          title,
          command: "mcp.screenshot.listWindows",
        };
        break;

      default:
        continue;
    }

    // Create code lens at the pattern location
    const codeLens: CodeLens = {
      range: {
        start: { line: pattern.line, character: pattern.character },
        end: {
          line: pattern.line,
          character: pattern.character + pattern.matchedText.length,
        },
      },
      command,
    };

    codeLenses.push(codeLens);
  }

  return codeLenses;
});

// Execute command handler
connection.onExecuteCommand(
  async (params: ExecuteCommandParams): Promise<any> => {
    connection.console.log(`Executing command: ${params.command}`);

    const client = mcpClientAccessor.getClient();
    if (!client) {
      const error = {
        code: "CLIENT_UNAVAILABLE",
        message: "MCP Screenshot client is not available",
        details: {
          command: params.command,
        },
      };
      connection.console.error(JSON.stringify(error));
      return { status: "error", error };
    }

    try {
      switch (params.command) {
        case "mcp.screenshot.capture": {
          const args = params.arguments?.[0] || {};
          const format = args.format || "png";
          const quality = args.quality || 90;
          const enablePIIMasking = args.enablePIIMasking || false;
          const savePath = args.savePath;

          connection.console.log(`Capturing screenshot with format: ${format}`);

          const result = await client.captureFullScreen({
            format,
            quality,
            enablePIIMasking,
            savePath,
          });

          return {
            status: "success",
            result,
          };
        }

        case "mcp.screenshot.listDisplays": {
          connection.console.log("Listing displays");
          const result = await client.listDisplays();
          return {
            status: "success",
            result,
          };
        }

        case "mcp.screenshot.listWindows": {
          connection.console.log("Listing windows");
          const result = await client.listWindows();
          return {
            status: "success",
            result,
          };
        }

        case "mcp.screenshot.getCapabilities": {
          connection.console.log("Getting capabilities");
          // Return static capabilities for now
          const capabilities = {
            formats: ["png", "jpeg", "webp"],
            features: [
              "fullscreen",
              "window",
              "region",
              "pii-masking",
              "display-enumeration",
              "window-enumeration",
            ],
          };
          return {
            status: "success",
            result: capabilities,
          };
        }

        default: {
          const error = {
            code: "UNKNOWN_COMMAND",
            message: `Unknown command: ${params.command}`,
            details: {
              command: params.command,
            },
          };
          connection.console.error(JSON.stringify(error));
          return { status: "error", error };
        }
      }
    } catch (err: any) {
      const error = {
        code: "EXECUTION_ERROR",
        message: err.message || "Command execution failed",
        details: {
          command: params.command,
          error: err.toString(),
        },
      };
      connection.console.error(JSON.stringify(error));
      return { status: "error", error };
    }
  }
);

// Completion provider
connection.onCompletion(
  async (params: CompletionParams): Promise<CompletionItem[]> => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return [];
    }

    const fileType = getFileType(document);

    // Only provide completions for supported file types with full features
    if (!supportsFullFeatures(fileType)) {
      return [];
    }

    const position = params.position;
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Get context around cursor position
    const lineText = document.getText({
      start: { line: position.line, character: 0 },
      end: { line: position.line + 1, character: 0 },
    });

    const beforeCursor = text.substring(Math.max(0, offset - 200), offset);

    // Check if we're in a screenshot configuration object
    const completionItems: CompletionItem[] = [];

    // Detect if we're in a configuration context
    const inConfigObject = isInConfigurationObject(beforeCursor, lineText);

    if (inConfigObject) {
      // Provide configuration object completions
      completionItems.push(...getConfigurationCompletions());
    }

    // Check for parameter-specific completions
    const parameterCompletions = getParameterSpecificCompletions(
      beforeCursor,
      lineText
    );
    if (parameterCompletions.length > 0) {
      completionItems.push(...parameterCompletions);
    }

    return completionItems;
  }
);

/**
 * Check if cursor is in a screenshot configuration object
 *
 * Determines whether the cursor position is inside a configuration object
 * for a screenshot function call. This is used to decide whether to provide
 * configuration property completions.
 *
 * @param beforeCursor - Text before the cursor position (up to 200 chars)
 * @param lineText - The current line text
 * @returns True if cursor is inside a screenshot configuration object
 *
 * @remarks
 * Detection works by:
 * 1. Looking for screenshot function calls (captureFullScreen, captureWindow, etc.)
 * 2. Counting opening and closing braces to determine if we're inside an object
 * 3. Checking for general screenshot-related context with unclosed braces
 *
 * @example
 * ```typescript
 * // Returns true for cursor position marked with |
 * captureFullScreen({ |format: 'png' });
 * captureWindow({ windowId: '123', |includeFrame: true });
 * ```
 */
function isInConfigurationObject(
  beforeCursor: string,
  lineText: string
): boolean {
  // Check if we're inside a configuration object for screenshot functions
  const screenshotFunctions = [
    "captureFullScreen",
    "captureWindow",
    "captureRegion",
  ];

  // Look for function call with opening brace
  for (const func of screenshotFunctions) {
    const funcPattern = new RegExp(`${func}\\s*\\(`);
    if (funcPattern.test(beforeCursor)) {
      // Count braces to see if we're inside the object
      const afterFunc = beforeCursor.substring(
        beforeCursor.lastIndexOf(func) + func.length
      );
      const openBraces = (afterFunc.match(/{/g) || []).length;
      const closeBraces = (afterFunc.match(/}/g) || []).length;

      if (openBraces > closeBraces) {
        return true;
      }
    }
  }

  // Also check if we're in a general screenshot config object
  if (
    beforeCursor.includes("screenshot") &&
    beforeCursor.includes("{") &&
    !beforeCursor.endsWith("}")
  ) {
    const lastOpenBrace = beforeCursor.lastIndexOf("{");
    const lastCloseBrace = beforeCursor.lastIndexOf("}");
    return lastOpenBrace > lastCloseBrace;
  }

  return false;
}

/**
 * Get configuration object completion items
 *
 * Returns an array of completion items for screenshot configuration properties.
 * Each completion item includes:
 * - Label: The property name
 * - Kind: Property type
 * - Detail: Short description
 * - Documentation: Full markdown documentation
 * - Insert text: The property with a default value
 *
 * @returns Array of completion items for configuration properties
 *
 * @remarks
 * Completion items include all valid screenshot configuration properties:
 * - format, quality, enablePIIMasking, savePath (common)
 * - windowId, windowTitle, includeFrame (window capture)
 * - x, y, width, height (region capture)
 *
 * @example
 * ```typescript
 * const completions = getConfigurationCompletions();
 * // User types in config object and sees all available properties
 * ```
 */
function getConfigurationCompletions(): CompletionItem[] {
  return [
    {
      label: "format",
      kind: CompletionItemKind.Property,
      detail: "Image format",
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          "Image format for the screenshot.\n\n**Type:** `'png' | 'jpeg' | 'webp'`\n\n**Valid values:**\n- `'png'` - PNG format (lossless)\n- `'jpeg'` - JPEG format (lossy)\n- `'webp'` - WebP format (lossy)",
      },
      insertText: 'format: "png"',
      insertTextFormat: InsertTextFormat.PlainText,
    },
    {
      label: "quality",
      kind: CompletionItemKind.Property,
      detail: "Image quality (0-100)",
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          "Image quality for lossy formats (jpeg, webp).\n\n**Type:** `number`\n\n**Range:** 0-100\n\n**Default:** 90\n\nHigher values produce better quality but larger file sizes.",
      },
      insertText: "quality: 90",
      insertTextFormat: InsertTextFormat.PlainText,
    },
    {
      label: "enablePIIMasking",
      kind: CompletionItemKind.Property,
      detail: "Enable PII masking",
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          "Enable automatic masking of Personally Identifiable Information.\n\n**Type:** `boolean`\n\n**Default:** false\n\nWhen enabled, the system will attempt to detect and mask PII in screenshots.",
      },
      insertText: "enablePIIMasking: false",
      insertTextFormat: InsertTextFormat.PlainText,
    },
    {
      label: "savePath",
      kind: CompletionItemKind.Property,
      detail: "Path to save screenshot",
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          "Path where the screenshot should be saved.\n\n**Type:** `string`\n\nIf not provided, the screenshot data will be returned without saving to disk.",
      },
      insertText: 'savePath: ""',
      insertTextFormat: InsertTextFormat.PlainText,
    },
    {
      label: "windowId",
      kind: CompletionItemKind.Property,
      detail: "Window identifier",
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          "Unique identifier for the window to capture.\n\n**Type:** `string`\n\nUse `listWindows()` to get available window IDs.",
      },
      insertText: 'windowId: ""',
      insertTextFormat: InsertTextFormat.PlainText,
    },
    {
      label: "windowTitle",
      kind: CompletionItemKind.Property,
      detail: "Window title",
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          "Title of the window to capture.\n\n**Type:** `string`\n\nThe system will search for a window with a matching title.",
      },
      insertText: 'windowTitle: ""',
      insertTextFormat: InsertTextFormat.PlainText,
    },
    {
      label: "includeFrame",
      kind: CompletionItemKind.Property,
      detail: "Include window frame",
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          "Include the window frame in the capture.\n\n**Type:** `boolean`\n\n**Default:** true\n\nWhen false, only the window content is captured.",
      },
      insertText: "includeFrame: true",
      insertTextFormat: InsertTextFormat.PlainText,
    },
    {
      label: "x",
      kind: CompletionItemKind.Property,
      detail: "X coordinate",
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          "X coordinate of the top-left corner of the region.\n\n**Type:** `number`\n\nCoordinate is relative to the screen origin.",
      },
      insertText: "x: 0",
      insertTextFormat: InsertTextFormat.PlainText,
    },
    {
      label: "y",
      kind: CompletionItemKind.Property,
      detail: "Y coordinate",
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          "Y coordinate of the top-left corner of the region.\n\n**Type:** `number`\n\nCoordinate is relative to the screen origin.",
      },
      insertText: "y: 0",
      insertTextFormat: InsertTextFormat.PlainText,
    },
    {
      label: "width",
      kind: CompletionItemKind.Property,
      detail: "Width of region",
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          "Width of the region to capture.\n\n**Type:** `number`\n\nMust be a positive number.",
      },
      insertText: "width: 800",
      insertTextFormat: InsertTextFormat.PlainText,
    },
    {
      label: "height",
      kind: CompletionItemKind.Property,
      detail: "Height of region",
      documentation: {
        kind: MarkupKind.Markdown,
        value:
          "Height of the region to capture.\n\n**Type:** `number`\n\nMust be a positive number.",
      },
      insertText: "height: 600",
      insertTextFormat: InsertTextFormat.PlainText,
    },
  ];
}

/**
 * Get parameter-specific completion items
 *
 * Provides context-aware completions for specific parameter values:
 * - Format parameter: Suggests 'png', 'jpeg', 'webp'
 * - Quality parameter: Suggests 80, 90, 95, 100
 *
 * @param beforeCursor - Text before the cursor position
 * @param lineText - The current line text
 * @returns Array of completion items for the current parameter context
 *
 * @remarks
 * Detection is based on regex patterns that match:
 * - `format: "` or `format: '` (for format completions)
 * - `quality: ` followed by optional digits (for quality completions)
 *
 * @example
 * ```typescript
 * // User types: captureFullScreen({ format: "|
 * // Returns: ['png', 'jpeg', 'webp']
 *
 * // User types: captureFullScreen({ quality: |
 * // Returns: [80, 90, 95, 100]
 * ```
 */
function getParameterSpecificCompletions(
  beforeCursor: string,
  lineText: string
): CompletionItem[] {
  const completions: CompletionItem[] = [];

  // Check if we're completing a format parameter
  if (
    /format\s*:\s*["']?$/.test(beforeCursor) ||
    /format\s*:\s*["'][^"']*$/.test(beforeCursor)
  ) {
    completions.push(
      {
        label: "png",
        kind: CompletionItemKind.Value,
        detail: "PNG format (lossless)",
        documentation: {
          kind: MarkupKind.Markdown,
          value:
            "PNG format - lossless compression, best for screenshots with text",
        },
        insertText: '"png"',
        insertTextFormat: InsertTextFormat.PlainText,
      },
      {
        label: "jpeg",
        kind: CompletionItemKind.Value,
        detail: "JPEG format (lossy)",
        documentation: {
          kind: MarkupKind.Markdown,
          value:
            "JPEG format - lossy compression, smaller file sizes, supports quality parameter",
        },
        insertText: '"jpeg"',
        insertTextFormat: InsertTextFormat.PlainText,
      },
      {
        label: "webp",
        kind: CompletionItemKind.Value,
        detail: "WebP format (lossy)",
        documentation: {
          kind: MarkupKind.Markdown,
          value:
            "WebP format - modern format with good compression, supports quality parameter",
        },
        insertText: '"webp"',
        insertTextFormat: InsertTextFormat.PlainText,
      }
    );
  }

  // Check if we're completing a quality parameter
  if (
    /quality\s*:\s*$/.test(beforeCursor) ||
    /quality\s*:\s*\d*$/.test(beforeCursor)
  ) {
    completions.push(
      {
        label: "80",
        kind: CompletionItemKind.Value,
        detail: "Good quality, smaller size",
        documentation: {
          kind: MarkupKind.Markdown,
          value: "Quality 80 - Good balance between quality and file size",
        },
        insertText: "80",
        insertTextFormat: InsertTextFormat.PlainText,
      },
      {
        label: "90",
        kind: CompletionItemKind.Value,
        detail: "High quality (default)",
        documentation: {
          kind: MarkupKind.Markdown,
          value: "Quality 90 - High quality, recommended default",
        },
        insertText: "90",
        insertTextFormat: InsertTextFormat.PlainText,
      },
      {
        label: "95",
        kind: CompletionItemKind.Value,
        detail: "Very high quality",
        documentation: {
          kind: MarkupKind.Markdown,
          value: "Quality 95 - Very high quality, larger file size",
        },
        insertText: "95",
        insertTextFormat: InsertTextFormat.PlainText,
      },
      {
        label: "100",
        kind: CompletionItemKind.Value,
        detail: "Maximum quality",
        documentation: {
          kind: MarkupKind.Markdown,
          value: "Quality 100 - Maximum quality, largest file size",
        },
        insertText: "100",
        insertTextFormat: InsertTextFormat.PlainText,
      }
    );
  }

  return completions;
}

// Make the text document manager listen on the connection
documents.listen(connection);

// Start listening for messages
connection.listen();

export { connection, documents };

import {
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
  MarkupKind,
} from "vscode-languageserver/node";

/**
 * Get signature help for screenshot functions
 */
export function getSignatureHelp(
  functionName: string,
  activeParameter: number
): SignatureHelp | null {
  const signatures = screenshotSignatures[functionName];
  if (!signatures) return null;

  return {
    signatures: [signatures],
    activeSignature: 0,
    activeParameter: Math.min(activeParameter, (signatures.parameters?.length || 1) - 1),
  };
}

const screenshotSignatures: Record<string, SignatureInformation> = {
  captureFull: {
    label: "captureFull(config: { format: string, quality?: number, enablePIIMasking?: boolean, savePath?: string })",
    documentation: {
      kind: MarkupKind.Markdown,
      value: "Capture a screenshot of the entire screen.\n\n**Example:**\n```typescript\nawait captureFull({ format: 'png' });\n```",
    },
    parameters: [
      {
        label: "config",
        documentation: {
          kind: MarkupKind.Markdown,
          value: "**format**: 'png' | 'jpeg' | 'webp'\n**quality?**: 0-100 (for jpeg/webp)\n**enablePIIMasking?**: boolean\n**savePath?**: string",
        },
      },
    ],
  },
  captureFullScreen: {
    label: "captureFullScreen(config: { format: string, quality?: number, enablePIIMasking?: boolean, savePath?: string })",
    documentation: {
      kind: MarkupKind.Markdown,
      value: "Capture a screenshot of the entire screen.\n\n**Example:**\n```typescript\nawait captureFullScreen({ format: 'png' });\n```",
    },
    parameters: [
      {
        label: "config",
        documentation: {
          kind: MarkupKind.Markdown,
          value: "**format**: 'png' | 'jpeg' | 'webp'\n**quality?**: 0-100 (for jpeg/webp)\n**enablePIIMasking?**: boolean\n**savePath?**: string",
        },
      },
    ],
  },
  captureWindow: {
    label: "captureWindow(config: { windowId?: string, windowTitle?: string, format: string, includeFrame?: boolean })",
    documentation: {
      kind: MarkupKind.Markdown,
      value: "Capture a screenshot of a specific window.\n\n**Example:**\n```typescript\nawait captureWindow({ windowTitle: 'VSCode', format: 'png' });\n```",
    },
    parameters: [
      {
        label: "config",
        documentation: {
          kind: MarkupKind.Markdown,
          value: "**windowId?**: string\n**windowTitle?**: string\n**format**: 'png' | 'jpeg' | 'webp'\n**includeFrame?**: boolean",
        },
      },
    ],
  },
  captureRegion: {
    label: "captureRegion(config: { x: number, y: number, width: number, height: number, format: string })",
    documentation: {
      kind: MarkupKind.Markdown,
      value: "Capture a screenshot of a specific screen region.\n\n**Example:**\n```typescript\nawait captureRegion({ x: 0, y: 0, width: 800, height: 600, format: 'png' });\n```",
    },
    parameters: [
      {
        label: "config",
        documentation: {
          kind: MarkupKind.Markdown,
          value: "**x**: number - X coordinate\n**y**: number - Y coordinate\n**width**: number - Width in pixels\n**height**: number - Height in pixels\n**format**: 'png' | 'jpeg' | 'webp'",
        },
      },
    ],
  },
  listDisplays: {
    label: "listDisplays()",
    documentation: {
      kind: MarkupKind.Markdown,
      value: "List all available displays.\n\n**Returns:** Array of display information",
    },
    parameters: [],
  },
  listWindows: {
    label: "listWindows()",
    documentation: {
      kind: MarkupKind.Markdown,
      value: "List all available windows.\n\n**Returns:** Array of window information",
    },
    parameters: [],
  },
};

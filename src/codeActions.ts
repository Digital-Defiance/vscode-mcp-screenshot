import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  TextEdit,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

/**
 * Generate code actions for diagnostics
 */
export function getCodeActions(
  document: TextDocument,
  diagnostic: Diagnostic
): CodeAction[] {
  const actions: CodeAction[] = [];

  switch (diagnostic.code) {
    case "invalid-format":
      actions.push(...fixInvalidFormat(document, diagnostic));
      break;
    case "quality-out-of-range":
      actions.push(fixQualityRange(document, diagnostic));
      break;
    case "missing-parameters":
      actions.push(addMissingParameters(document, diagnostic));
      break;
    case "deprecated-api":
      actions.push(migrateDeprecatedAPI(document, diagnostic));
      break;
  }

  return actions;
}

/**
 * Fix invalid format value
 */
function fixInvalidFormat(
  document: TextDocument,
  diagnostic: Diagnostic
): CodeAction[] {
  const validFormats = ["png", "jpeg", "webp"];
  return validFormats.map((format) => ({
    title: `✅ Change to '${format}'`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    edit: {
      changes: {
        [document.uri]: [
          TextEdit.replace(
            diagnostic.range,
            `format: "${format}"`
          ),
        ],
      },
    },
  }));
}

/**
 * Fix quality range
 */
function fixQualityRange(
  document: TextDocument,
  diagnostic: Diagnostic
): CodeAction {
  const line = document.getText(diagnostic.range);
  const match = line.match(/quality\s*:\s*(-?\d+)/);
  const value = match ? parseInt(match[1], 10) : 90;
  const clamped = Math.max(0, Math.min(100, value));

  return {
    title: `✅ Fix to ${clamped}`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    edit: {
      changes: {
        [document.uri]: [
          TextEdit.replace(diagnostic.range, `quality: ${clamped}`),
        ],
      },
    },
  };
}

/**
 * Add missing parameters
 */
function addMissingParameters(
  document: TextDocument,
  diagnostic: Diagnostic
): CodeAction {
  const line = document.getText(diagnostic.range);
  let template = "";

  if (line.includes("captureFullScreen")) {
    template = "captureFullScreen({ format: 'png' })";
  } else if (line.includes("captureWindow")) {
    template = "captureWindow({ windowTitle: '', format: 'png' })";
  } else if (line.includes("captureRegion")) {
    template = "captureRegion({ x: 0, y: 0, width: 800, height: 600, format: 'png' })";
  }

  return {
    title: "✅ Add required parameters",
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    edit: {
      changes: {
        [document.uri]: [TextEdit.replace(diagnostic.range, template)],
      },
    },
  };
}

/**
 * Migrate deprecated API
 */
function migrateDeprecatedAPI(
  document: TextDocument,
  diagnostic: Diagnostic
): CodeAction {
  const line = document.getText(diagnostic.range);
  const migrations: Record<string, string> = {
    takeScreenshot: "captureFullScreen",
    getScreenshot: "captureFullScreen",
    screenshotWindow: "captureWindow",
    screenshotRegion: "captureRegion",
    getDisplayList: "listDisplays",
    getWindowList: "listWindows",
  };

  let newText = line;
  for (const [old, replacement] of Object.entries(migrations)) {
    if (line.includes(old)) {
      newText = line.replace(new RegExp(`\\b${old}\\b`, "g"), replacement);
      break;
    }
  }

  return {
    title: "🔄 Migrate to modern API",
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    edit: {
      changes: {
        [document.uri]: [TextEdit.replace(diagnostic.range, newText)],
      },
    },
  };
}

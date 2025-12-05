import {
  InlayHint,
  InlayHintKind,
  Position,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

/**
 * Provide inlay hints for screenshot code
 */
export function getInlayHints(document: TextDocument): InlayHint[] {
  const hints: InlayHint[] = [];
  const text = document.getText();
  const lines = text.split("\n");

  lines.forEach((line, lineIndex) => {
    // Show image dimensions for region captures
    const regionMatch = line.match(/captureRegion\s*\(\s*\{[^}]*width:\s*(\d+)[^}]*height:\s*(\d+)/);
    if (regionMatch) {
      const width = regionMatch[1];
      const height = regionMatch[2];
      hints.push({
        position: Position.create(lineIndex, line.length),
        label: ` → ${width}×${height}px`,
        kind: InlayHintKind.Type,
        paddingLeft: true,
      });
    }

    // Show estimated file size
    const formatMatch = line.match(/format:\s*['"](\w+)['"]/);
    const qualityMatch = line.match(/quality:\s*(\d+)/);
    if (formatMatch) {
      const format = formatMatch[1];
      const quality = qualityMatch ? parseInt(qualityMatch[1]) : 90;
      const size = estimateFileSize(format, quality);
      hints.push({
        position: Position.create(lineIndex, line.length),
        label: ` ≈${size}`,
        kind: InlayHintKind.Parameter,
        paddingLeft: true,
      });
    }
  });

  return hints;
}

function estimateFileSize(format: string, quality: number): string {
  const baseSize = format === "png" ? 500 : format === "webp" ? 200 : 300;
  const qualityFactor = quality / 100;
  const estimated = Math.round(baseSize * qualityFactor);
  return estimated > 1000 ? `${(estimated / 1000).toFixed(1)}MB` : `${estimated}KB`;
}

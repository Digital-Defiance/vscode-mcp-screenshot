import { ColorInformation, Color, ColorPresentation, Range } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

/**
 * Provide color information for screenshot code
 */
export function getDocumentColors(document: TextDocument): ColorInformation[] {
  const colors: ColorInformation[] = [];
  const text = document.getText();
  const lines = text.split("\n");

  lines.forEach((line, lineIndex) => {
    // Detect format colors
    const formatColors: Record<string, Color> = {
      png: { red: 0.2, green: 0.6, blue: 1, alpha: 1 },
      jpeg: { red: 1, green: 0.6, blue: 0, alpha: 1 },
      webp: { red: 0.4, green: 0.8, blue: 0.4, alpha: 1 },
      bmp: { red: 0.8, green: 0.2, blue: 0.2, alpha: 1 },
    };

    Object.entries(formatColors).forEach(([format, color]) => {
      const regex = new RegExp(`['"]${format}['"]`, "gi");
      let match;
      while ((match = regex.exec(line)) !== null) {
        colors.push({
          range: Range.create(lineIndex, match.index + 1, lineIndex, match.index + format.length + 1),
          color,
        });
      }
    });
  });

  return colors;
}

/**
 * Provide color presentations
 */
export function getColorPresentations(color: Color): ColorPresentation[] {
  const { red, green, blue, alpha } = color;
  return [
    { label: `rgba(${Math.round(red * 255)}, ${Math.round(green * 255)}, ${Math.round(blue * 255)}, ${alpha})` },
  ];
}

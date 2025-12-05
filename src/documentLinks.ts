import { DocumentLink, Range } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

const DOCS_BASE = "https://github.com/Digital-Defiance/mcp-screenshot/blob/main";
const EXAMPLES_BASE = `${DOCS_BASE}/EXAMPLES.md`;

/**
 * Provide document links for screenshot code
 */
export function getDocumentLinks(document: TextDocument): DocumentLink[] {
  const links: DocumentLink[] = [];
  const text = document.getText();
  const lines = text.split("\n");

  const functionDocs: Record<string, string> = {
    captureFull: `${EXAMPLES_BASE}#full-screen-capture`,
    captureFullScreen: `${EXAMPLES_BASE}#full-screen-capture`,
    captureWindow: `${EXAMPLES_BASE}#window-capture`,
    captureRegion: `${EXAMPLES_BASE}#region-capture`,
    listDisplays: `${EXAMPLES_BASE}#listing-displays`,
    listWindows: `${EXAMPLES_BASE}#listing-windows`,
  };

  lines.forEach((line, lineIndex) => {
    Object.entries(functionDocs).forEach(([func, url]) => {
      const index = line.indexOf(func);
      if (index !== -1) {
        links.push({
          range: Range.create(lineIndex, index, lineIndex, index + func.length),
          target: url,
          tooltip: `View ${func} examples`,
        });
      }
    });
  });

  return links;
}

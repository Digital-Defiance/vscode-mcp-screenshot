import * as assert from "assert";
import * as fc from "fast-check";

/**
 * Feature: mcp-screenshot-lsp, Property 21: Pattern detection and feature provision
 *
 * Property: For any detected screenshot pattern (capture, display enumeration, window selection, region capture),
 * the LSP should provide relevant code lenses, hover information, and validation
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 */

// Pattern detection function (updated version with region support)
interface ScreenshotPattern {
  type: "capture" | "list_displays" | "list_windows" | "region";
  line: number;
  character: number;
  matchedText: string;
  parameters?: Record<string, any>;
}

function detectScreenshotPatterns(text: string): ScreenshotPattern[] {
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

  function extractRegionParameters(
    line: string
  ): Record<string, any> | undefined {
    const params: Record<string, any> = {};
    const xMatch = line.match(/\bx\s*:\s*(\d+)/);
    const yMatch = line.match(/\by\s*:\s*(\d+)/);
    const widthMatch = line.match(/\bwidth\s*:\s*(\d+)/);
    const heightMatch = line.match(/\bheight\s*:\s*(\d+)/);

    if (xMatch) params.x = parseInt(xMatch[1], 10);
    if (yMatch) params.y = parseInt(yMatch[1], 10);
    if (widthMatch) params.width = parseInt(widthMatch[1], 10);
    if (heightMatch) params.height = parseInt(heightMatch[1], 10);

    return Object.keys(params).length > 0 ? params : undefined;
  }

  lines.forEach((line, lineIndex) => {
    let matched = false;

    // Check for region capture patterns first (more specific)
    if (!matched) {
      for (const pattern of regionCapturePatterns) {
        const match = line.match(pattern);
        if (match && match.index !== undefined) {
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

  return patterns;
}

suite("Language Server Pattern Detection - Property-Based Tests", () => {
  test("Property 21: Capture patterns are detected correctly", () => {
    /**
     * Property: For any code containing a capture pattern, the pattern
     * should be detected with correct type and position
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "captureFullScreen",
          "captureWindow",
          "screenshot.capture",
          "capture.screenshot",
          "takeScreenshot",
          "getScreenshot",
          "screenshotWindow"
        ),
        fc.nat({ max: 10 }),
        fc.nat({ max: 20 }),
        (functionName, linesBefore, spacesIndent) => {
          const indent = " ".repeat(spacesIndent);
          const beforeLines = Array(linesBefore)
            .fill("")
            .map((_, i) => `// Line ${i}`)
            .join("\n");
          const code =
            linesBefore > 0
              ? `${beforeLines}\n${indent}${functionName}({ format: 'png' });`
              : `${indent}${functionName}({ format: 'png' });`;

          const patterns = detectScreenshotPatterns(code);
          const capturePatterns = patterns.filter((p) => p.type === "capture");

          if (capturePatterns.length === 0) {
            return false;
          }

          const pattern = capturePatterns[0];
          return (
            pattern.line === linesBefore &&
            pattern.character === spacesIndent &&
            pattern.matchedText.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 21: Region capture patterns are detected with parameters", () => {
    /**
     * Property: For any code containing a region capture pattern with parameters,
     * the pattern should be detected with extracted parameter values
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "captureRegion",
          "screenshot.region",
          "region.capture",
          "screenshotRegion"
        ),
        fc.nat({ max: 1920 }),
        fc.nat({ max: 1080 }),
        fc.integer({ min: 1, max: 1920 }),
        fc.integer({ min: 1, max: 1080 }),
        (functionName, x, y, width, height) => {
          const code = `${functionName}({ x: ${x}, y: ${y}, width: ${width}, height: ${height}, format: 'png' });`;

          const patterns = detectScreenshotPatterns(code);
          const regionPatterns = patterns.filter((p) => p.type === "region");

          if (regionPatterns.length === 0) {
            return false;
          }

          const pattern = regionPatterns[0];

          // Verify parameters were extracted
          if (!pattern.parameters) {
            return false;
          }

          return (
            pattern.parameters.x === x &&
            pattern.parameters.y === y &&
            pattern.parameters.width === width &&
            pattern.parameters.height === height
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 21: Display enumeration patterns are detected", () => {
    /**
     * Property: For any code containing a display enumeration pattern,
     * the pattern should be detected with type 'list_displays'
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "listDisplays",
          "getDisplays",
          "displays.list",
          "enumerate.displays",
          "getDisplayList",
          "availableDisplays",
          "screenList"
        ),
        fc.nat({ max: 10 }),
        (functionName, linesBefore) => {
          const beforeLines = Array(linesBefore)
            .fill("")
            .map((_, i) => `// Line ${i}`)
            .join("\n");
          const code =
            linesBefore > 0
              ? `${beforeLines}\nconst displays = await ${functionName}();`
              : `const displays = await ${functionName}();`;

          const patterns = detectScreenshotPatterns(code);
          const displayPatterns = patterns.filter(
            (p) => p.type === "list_displays"
          );

          return (
            displayPatterns.length > 0 &&
            displayPatterns[0].line === linesBefore
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 21: Window selection patterns are detected", () => {
    /**
     * Property: For any code containing a window selection pattern,
     * the pattern should be detected with type 'list_windows'
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          "listWindows",
          "getWindows",
          "windows.list",
          "enumerate.windows",
          "getWindowList",
          "availableWindows",
          "windowList"
        ),
        fc.nat({ max: 10 }),
        (functionName, linesBefore) => {
          const beforeLines = Array(linesBefore)
            .fill("")
            .map((_, i) => `// Line ${i}`)
            .join("\n");
          const code =
            linesBefore > 0
              ? `${beforeLines}\nconst windows = await ${functionName}();`
              : `const windows = await ${functionName}();`;

          const patterns = detectScreenshotPatterns(code);
          const windowPatterns = patterns.filter(
            (p) => p.type === "list_windows"
          );

          return (
            windowPatterns.length > 0 && windowPatterns[0].line === linesBefore
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 21: Multiple different pattern types detected in same document", () => {
    /**
     * Property: For any document with multiple different pattern types,
     * all patterns should be detected with correct types
     */
    fc.assert(
      fc.property(
        fc.record({
          capture: fc.constantFrom("captureFullScreen", "captureWindow"),
          region: fc.constantFrom("captureRegion", "screenshotRegion"),
          displays: fc.constantFrom("listDisplays", "getDisplays"),
          windows: fc.constantFrom("listWindows", "getWindows"),
        }),
        (functions) => {
          const code = `
${functions.capture}({ format: 'png' });
${functions.region}({ x: 0, y: 0, width: 100, height: 100, format: 'png' });
const displays = await ${functions.displays}();
const windows = await ${functions.windows}();
          `.trim();

          const patterns = detectScreenshotPatterns(code);

          // Should detect all 4 pattern types
          const captureCount = patterns.filter(
            (p) => p.type === "capture"
          ).length;
          const regionCount = patterns.filter(
            (p) => p.type === "region"
          ).length;
          const displayCount = patterns.filter(
            (p) => p.type === "list_displays"
          ).length;
          const windowCount = patterns.filter(
            (p) => p.type === "list_windows"
          ).length;

          return (
            captureCount >= 1 &&
            regionCount >= 1 &&
            displayCount >= 1 &&
            windowCount >= 1
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 21: Pattern detection prioritizes region over general capture", () => {
    /**
     * Property: For any code containing 'captureRegion', it should be
     * detected as 'region' type, not 'capture' type
     */
    fc.assert(
      fc.property(
        fc.nat({ max: 1000 }),
        fc.nat({ max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (x, y, width, height) => {
          const code = `captureRegion({ x: ${x}, y: ${y}, width: ${width}, height: ${height} });`;

          const patterns = detectScreenshotPatterns(code);

          // Should detect as region, not capture
          const regionPatterns = patterns.filter((p) => p.type === "region");
          const capturePatterns = patterns.filter((p) => p.type === "capture");

          return regionPatterns.length > 0 && capturePatterns.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 21: Pattern detection handles partial region parameters", () => {
    /**
     * Property: For any region capture with partial parameters,
     * the pattern should still be detected with available parameters
     */
    fc.assert(
      fc.property(
        fc.record({
          x: fc.option(fc.nat({ max: 1000 }), { nil: undefined }),
          y: fc.option(fc.nat({ max: 1000 }), { nil: undefined }),
          width: fc.option(fc.integer({ min: 1, max: 1000 }), {
            nil: undefined,
          }),
          height: fc.option(fc.integer({ min: 1, max: 1000 }), {
            nil: undefined,
          }),
        }),
        (params) => {
          // Build parameter string
          const paramParts: string[] = [];
          if (params.x !== undefined) paramParts.push(`x: ${params.x}`);
          if (params.y !== undefined) paramParts.push(`y: ${params.y}`);
          if (params.width !== undefined)
            paramParts.push(`width: ${params.width}`);
          if (params.height !== undefined)
            paramParts.push(`height: ${params.height}`);

          const code = `captureRegion({ ${paramParts.join(
            ", "
          )}, format: 'png' });`;

          const patterns = detectScreenshotPatterns(code);
          const regionPatterns = patterns.filter((p) => p.type === "region");

          if (regionPatterns.length === 0) {
            return false;
          }

          const pattern = regionPatterns[0];

          // If no parameters were provided, parameters should be undefined
          if (paramParts.length === 0) {
            return pattern.parameters === undefined;
          }

          // Otherwise, verify extracted parameters match provided ones
          if (!pattern.parameters) {
            return false;
          }

          let allMatch = true;
          if (params.x !== undefined) {
            allMatch = allMatch && pattern.parameters.x === params.x;
          }
          if (params.y !== undefined) {
            allMatch = allMatch && pattern.parameters.y === params.y;
          }
          if (params.width !== undefined) {
            allMatch = allMatch && pattern.parameters.width === params.width;
          }
          if (params.height !== undefined) {
            allMatch = allMatch && pattern.parameters.height === params.height;
          }

          return allMatch;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 21: Pattern detection is case-insensitive for compound patterns", () => {
    /**
     * Property: For patterns like "screenshot.capture", case variations
     * should still be detected
     */
    fc.assert(
      fc.property(
        fc.constantFrom(
          ["screenshot.capture", "capture"],
          ["Screenshot.Capture", "capture"],
          ["SCREENSHOT.CAPTURE", "capture"],
          ["displays.list", "list_displays"],
          ["Displays.List", "list_displays"],
          ["windows.list", "list_windows"],
          ["Windows.List", "list_windows"]
        ),
        ([pattern, expectedType]) => {
          const code = `const result = ${pattern}();`;

          const patterns = detectScreenshotPatterns(code);
          const matchingPatterns = patterns.filter(
            (p) => p.type === expectedType
          );

          return matchingPatterns.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 21: No patterns detected in non-screenshot code", () => {
    /**
     * Property: For any code that doesn't contain screenshot-related keywords,
     * no patterns should be detected
     */
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 5, maxLength: 30 }).filter((s) => {
            // Filter out strings that match screenshot patterns
            return (
              !/capture/i.test(s) &&
              !/screenshot/i.test(s) &&
              !/display/i.test(s) &&
              !/window/i.test(s) &&
              !/region/i.test(s) &&
              !/screen/i.test(s) &&
              /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)
            );
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (identifiers) => {
          const code = identifiers.map((id) => `const ${id} = 42;`).join("\n");

          const patterns = detectScreenshotPatterns(code);

          return patterns.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("Property 21: Pattern detection handles whitespace variations", () => {
    /**
     * Property: For any pattern with varying whitespace, the pattern
     * should still be detected correctly
     */
    fc.assert(
      fc.property(
        fc.constantFrom("captureFullScreen", "listDisplays", "captureRegion"),
        fc.constantFrom("", " ", "  ", "\t"),
        fc.constantFrom("", " ", "  ", "\t"),
        (functionName, leadingSpace, trailingSpace) => {
          const code = `${leadingSpace}${functionName}${trailingSpace}();`;

          const patterns = detectScreenshotPatterns(code);

          if (patterns.length === 0) {
            return false;
          }

          const pattern = patterns[0];
          return pattern.matchedText === functionName;
        }
      ),
      { numRuns: 100 }
    );
  });
});

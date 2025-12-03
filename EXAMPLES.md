# MCP Screenshot LSP Examples

This document provides comprehensive examples of using the Language Server Protocol (LSP) features in the MCP Screenshot extension.

## Table of Contents

- [Hover Information](#hover-information)
- [Code Lenses](#code-lenses)
- [Diagnostics](#diagnostics)
- [Code Completion](#code-completion)
- [AI Agent Commands](#ai-agent-commands)
- [File Type Support](#file-type-support)

## Hover Information

### Function Hover

Hover over screenshot function names to see documentation:

```javascript
// Hover over 'captureFullScreen' to see:
// - Parameter documentation
// - Return type information
// - Usage examples
const screenshot = await captureFullScreen({
  format: 'png',
  quality: 90
});
```

### Configuration Property Hover

Hover over configuration properties to see their types and valid values:

```typescript
const config = {
  format: 'png',      // Hover: Shows valid formats (png, jpeg, webp)
  quality: 90,        // Hover: Shows valid range (0-100)
  enablePIIMasking: false,  // Hover: Shows boolean type and description
  savePath: './screenshots/capture.png'  // Hover: Shows string type
};

await captureFullScreen(config);
```

### Identifier Hover

Hover over display or window identifiers to see resource information:

```javascript
// Hover over 'display_0' to see display information
const displayId = 'display_0';

// Hover over 'window_123' to see window information
const windowId = 'window_123';

await captureWindow({ windowId, format: 'png' });
```

## Code Lenses

### Capture Screenshot Code Lens

Code lenses appear above screenshot capture functions:

```javascript
// 📸 Capture Screenshot  <-- Click to execute
async function takeScreenshot() {
  return await captureFullScreen({ format: 'png' });
}
```

### List Displays Code Lens

Code lenses appear above display enumeration code:

```javascript
// 🖥️ List Displays  <-- Click to see all displays
async function getAvailableDisplays() {
  const displays = await listDisplays();
  return displays;
}
```

### List Windows Code Lens

Code lenses appear above window enumeration code:

```javascript
// 🪟 List Windows  <-- Click to see all windows
async function getOpenWindows() {
  const windows = await listWindows();
  return windows;
}
```

### Multiple Code Lenses

Multiple code lenses can appear in the same file:

```typescript
// 📸 Capture Screenshot
async function captureScreen() {
  return await captureFullScreen({ format: 'png' });
}

// 🖥️ List Displays
async function enumerateDisplays() {
  return await listDisplays();
}

// 🪟 List Windows
async function enumerateWindows() {
  return await listWindows();
}
```

## Diagnostics

### Invalid Format Diagnostic

Warning when format value is invalid:

```javascript
// ⚠️ Warning: Invalid format value 'gif'. Valid formats are: png, jpeg, webp
const screenshot = await captureFullScreen({
  format: 'gif'  // Diagnostic appears here
});
```

### Quality Range Diagnostic

Error when quality is out of range:

```javascript
// ❌ Error: Quality value 150 is out of range. Quality must be between 0 and 100.
const screenshot = await captureFullScreen({
  format: 'jpeg',
  quality: 150  // Diagnostic appears here
});

// ❌ Error: Quality value -10 is out of range. Quality must be between 0 and 100.
const screenshot2 = await captureFullScreen({
  format: 'jpeg',
  quality: -10  // Diagnostic appears here
});
```

### Missing Parameters Diagnostic

Error when required parameters are missing:

```javascript
// ❌ Error: captureFullScreen requires a configuration object with at least a 'format' parameter
const screenshot = await captureFullScreen();  // Diagnostic appears here

// ❌ Error: captureWindow requires a configuration object with 'format' and either 'windowId' or 'windowTitle'
const windowShot = await captureWindow();  // Diagnostic appears here

// ❌ Error: captureRegion requires a configuration object with 'x', 'y', 'width', 'height', and 'format' parameters
const regionShot = await captureRegion();  // Diagnostic appears here
```

### Deprecated API Diagnostic

Informational message for deprecated APIs:

```javascript
// ℹ️ Info: takeScreenshot is deprecated. Use captureFullScreen instead.
// Migration: Replace with captureFullScreen()
const screenshot = await takeScreenshot({ format: 'png' });  // Diagnostic appears here

// ℹ️ Info: getDisplayList is deprecated. Use listDisplays instead.
// Migration: Replace with listDisplays()
const displays = await getDisplayList();  // Diagnostic appears here
```

### Multiple Diagnostics

Multiple diagnostics can appear in the same file:

```javascript
async function captureScreenshots() {
  // ⚠️ Warning: Invalid format
  const shot1 = await captureFullScreen({ format: 'bmp' });
  
  // ❌ Error: Quality out of range
  const shot2 = await captureFullScreen({ format: 'jpeg', quality: 200 });
  
  // ❌ Error: Missing parameters
  const shot3 = await captureFullScreen();
  
  // ℹ️ Info: Deprecated API
  const shot4 = await takeScreenshot({ format: 'png' });
}
```

## Code Completion

### Configuration Object Completion

Type inside a configuration object to see all available properties:

```javascript
const screenshot = await captureFullScreen({
  // Type here to see completions:
  // - format
  // - quality
  // - enablePIIMasking
  // - savePath
});
```

### Format Parameter Completion

Type after `format:` to see format options:

```javascript
const screenshot = await captureFullScreen({
  format: "  // Type here to see: 'png', 'jpeg', 'webp'
});
```

### Quality Parameter Completion

Type after `quality:` to see quality suggestions:

```javascript
const screenshot = await captureFullScreen({
  format: 'jpeg',
  quality:   // Type here to see: 80, 90, 95, 100
});
```

### Window Capture Completion

Completions for window-specific parameters:

```javascript
const windowShot = await captureWindow({
  // Type here to see:
  // - windowId
  // - windowTitle
  // - format
  // - includeFrame
});
```

### Region Capture Completion

Completions for region-specific parameters:

```javascript
const regionShot = await captureRegion({
  // Type here to see:
  // - x
  // - y
  // - width
  // - height
  // - format
});
```

### Complete Example with Completions

```typescript
// Full example showing all completion contexts
async function captureWithCompletions() {
  // Configuration object completion
  const fullScreen = await captureFullScreen({
    format: 'png',      // Format completion
    quality: 90,        // Quality completion
    enablePIIMasking: false,
    savePath: './screenshots/full.png'
  });

  // Window capture completion
  const window = await captureWindow({
    windowTitle: 'VS Code',
    format: 'jpeg',     // Format completion
    includeFrame: true
  });

  // Region capture completion
  const region = await captureRegion({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    format: 'webp'      // Format completion
  });

  return { fullScreen, window, region };
}
```

## AI Agent Commands

### Capture Command

Execute screenshot capture programmatically:

```javascript
// AI agent executes capture command
const result = await vscode.commands.executeCommand(
  'mcp.screenshot.capture',
  {
    type: 'fullscreen',
    format: 'png',
    quality: 90,
    enablePIIMasking: false
  }
);

console.log('Capture result:', result);
// Output: { status: 'success', result: { ... } }
```

### List Displays Command

Get list of available displays:

```javascript
// AI agent lists displays
const displays = await vscode.commands.executeCommand(
  'mcp.screenshot.listDisplays'
);

console.log('Available displays:', displays);
// Output: { status: 'success', result: { displays: [...] } }
```

### List Windows Command

Get list of available windows:

```javascript
// AI agent lists windows
const windows = await vscode.commands.executeCommand(
  'mcp.screenshot.listWindows'
);

console.log('Available windows:', windows);
// Output: { status: 'success', result: { windows: [...] } }
```

### Get Capabilities Command

Query screenshot system capabilities:

```javascript
// AI agent gets capabilities
const capabilities = await vscode.commands.executeCommand(
  'mcp.screenshot.getCapabilities'
);

console.log('System capabilities:', capabilities);
// Output: {
//   status: 'success',
//   result: {
//     formats: ['png', 'jpeg', 'webp'],
//     features: ['fullscreen', 'window', 'region', 'pii-masking', ...]
//   }
// }
```

### Error Handling

Commands return structured errors on failure:

```javascript
try {
  const result = await vscode.commands.executeCommand(
    'mcp.screenshot.capture',
    { format: 'invalid' }
  );
  
  if (result.status === 'error') {
    console.error('Command failed:', result.error);
    // Output: {
    //   code: 'EXECUTION_ERROR',
    //   message: 'Invalid format',
    //   details: { ... }
    // }
  }
} catch (error) {
  console.error('Command execution failed:', error);
}
```

### Complete AI Agent Workflow

```javascript
// Complete workflow for AI agent
async function aiAgentWorkflow() {
  // 1. Get capabilities
  const capabilities = await vscode.commands.executeCommand(
    'mcp.screenshot.getCapabilities'
  );
  
  console.log('Supported formats:', capabilities.result.formats);
  
  // 2. List available displays
  const displays = await vscode.commands.executeCommand(
    'mcp.screenshot.listDisplays'
  );
  
  console.log('Found displays:', displays.result.displays.length);
  
  // 3. List available windows
  const windows = await vscode.commands.executeCommand(
    'mcp.screenshot.listWindows'
  );
  
  console.log('Found windows:', windows.result.windows.length);
  
  // 4. Capture screenshot
  const screenshot = await vscode.commands.executeCommand(
    'mcp.screenshot.capture',
    {
      format: 'png',
      quality: 95,
      enablePIIMasking: true
    }
  );
  
  if (screenshot.status === 'success') {
    console.log('Screenshot captured successfully');
    return screenshot.result;
  } else {
    console.error('Screenshot failed:', screenshot.error);
    throw new Error(screenshot.error.message);
  }
}
```

## File Type Support

### JavaScript Files (.js)

Full LSP features available:

```javascript
// hover-example.js
// All LSP features work in JavaScript files

async function captureScreenshot() {
  // Hover, completion, diagnostics, code lenses all work
  const screenshot = await captureFullScreen({
    format: 'png',
    quality: 90
  });
  
  return screenshot;
}
```

### TypeScript Files (.ts)

Full LSP features with type information:

```typescript
// hover-example.ts
// All LSP features work in TypeScript files

interface ScreenshotConfig {
  format: 'png' | 'jpeg' | 'webp';
  quality?: number;
  enablePIIMasking?: boolean;
}

async function captureScreenshot(config: ScreenshotConfig): Promise<any> {
  // Hover, completion, diagnostics, code lenses all work
  const screenshot = await captureFullScreen(config);
  return screenshot;
}
```

### JSX Files (.jsx)

Full LSP features in React components:

```jsx
// ScreenshotButton.jsx
import React from 'react';

function ScreenshotButton() {
  // All LSP features work in JSX files
  const handleCapture = async () => {
    const screenshot = await captureFullScreen({
      format: 'png',
      quality: 90
    });
    
    console.log('Screenshot captured:', screenshot);
  };
  
  return (
    <button onClick={handleCapture}>
      Capture Screenshot
    </button>
  );
}

export default ScreenshotButton;
```

### TSX Files (.tsx)

Full LSP features in TypeScript React components:

```tsx
// ScreenshotButton.tsx
import React from 'react';

interface Props {
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
}

const ScreenshotButton: React.FC<Props> = ({ format, quality }) => {
  // All LSP features work in TSX files
  const handleCapture = async () => {
    const screenshot = await captureFullScreen({
      format,
      quality,
      enablePIIMasking: true
    });
    
    console.log('Screenshot captured:', screenshot);
  };
  
  return (
    <button onClick={handleCapture}>
      Capture Screenshot
    </button>
  );
};

export default ScreenshotButton;
```

### JSON Configuration Files (.json)

Configuration validation only:

```json
{
  "mcpScreenshot": {
    "defaultFormat": "png",
    "defaultQuality": 90,
    "enablePIIMasking": false,
    "saveDirectory": "${workspaceFolder}/screenshots"
  }
}
```

Diagnostics appear for invalid values:

```json
{
  "mcpScreenshot": {
    "defaultFormat": "gif",  // ⚠️ Warning: Invalid format
    "defaultQuality": 150,   // ❌ Error: Quality out of range
    "enablePIIMasking": false
  }
}
```

## Advanced Examples

### Pattern Detection

The LSP detects various screenshot patterns:

```javascript
// Pattern: Capture operations
async function captureScreenshots() {
  // Detected: capture pattern
  await captureFullScreen({ format: 'png' });
  
  // Detected: capture pattern
  await captureWindow({ windowId: '123', format: 'png' });
  
  // Detected: region pattern (with parameter extraction)
  await captureRegion({ x: 0, y: 0, width: 800, height: 600, format: 'png' });
}

// Pattern: Display enumeration
async function getDisplayInfo() {
  // Detected: list_displays pattern
  const displays = await listDisplays();
  return displays;
}

// Pattern: Window selection
async function getWindowInfo() {
  // Detected: list_windows pattern
  const windows = await listWindows();
  return windows;
}
```

### Performance Optimization

The LSP uses caching and debouncing for performance:

```javascript
// Rapid typing triggers debounced validation
async function captureWithConfig() {
  const screenshot = await captureFullScreen({
    format: 'png',  // Validation debounced (100ms)
    quality: 90,    // Pattern detection cached
    enablePIIMasking: false
  });
  
  return screenshot;
}
```

### Error Recovery

The LSP handles errors gracefully:

```javascript
// MCP client not available - LSP continues with static features
async function captureWhenOffline() {
  // Hover and completion still work
  // Code lenses may not execute
  // Diagnostics still validate syntax
  const screenshot = await captureFullScreen({
    format: 'png',
    quality: 90
  });
}
```

## Tips and Best Practices

### 1. Use Hover for Documentation

Always hover over functions and parameters to see documentation before using them.

### 2. Watch for Diagnostics

Pay attention to diagnostics (warnings and errors) as you type. They catch issues before runtime.

### 3. Use Code Lenses for Quick Actions

Click code lenses to quickly execute screenshot operations without writing test code.

### 4. Leverage Code Completion

Use code completion (Ctrl+Space) inside configuration objects to discover available options.

### 5. Check File Type Support

Ensure you're working in a supported file type (.js, .ts, .jsx, .tsx, .json) to get LSP features.

### 6. Use AI Agent Commands for Automation

Leverage the command API for automated screenshot workflows in scripts and tests.

### 7. Handle Errors Properly

Always check command results for errors and handle them appropriately.

### 8. Keep Configuration Valid

Use diagnostics to ensure your screenshot configurations are always valid.

## Troubleshooting

### LSP Features Not Working

1. Check file type - LSP only works in supported file types
2. Check extension activation - Look for "MCP Screenshot" in output panel
3. Check language server status - Look for language server logs
4. Restart VS Code if features stop working

### Code Lenses Not Appearing

1. Ensure you're in a supported file type (.js, .ts, .jsx, .tsx)
2. Check that code contains screenshot-related patterns
3. Try saving the file to trigger pattern detection

### Completions Not Showing

1. Ensure cursor is inside a screenshot configuration object
2. Try triggering manually with Ctrl+Space
3. Check that you're in a supported file type

### Diagnostics Not Appearing

1. Wait for debounce delay (100ms after typing)
2. Check that file is saved and open
3. Look for validation errors in output panel

## Additional Resources

- [README.md](./README.md) - Main extension documentation
- [API Documentation](./API.md) - MCP Screenshot API reference
- [Configuration Guide](./CONFIGURATION.md) - Extension configuration options
- [GitHub Issues](https://github.com/digital-defiance/ai-capabilities-suite/issues) - Report issues or request features

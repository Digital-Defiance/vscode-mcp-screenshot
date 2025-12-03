# MCP Screenshot - VS Code Extension

Cross-platform screenshot capture extension for Visual Studio Code with Model Context Protocol (MCP) integration.

## Features

### Screenshot Capabilities

- **Full Screen Capture**: Capture entire displays or specific monitors
- **Window Capture**: Target specific application windows
- **Region Capture**: Capture rectangular screen regions
- **Multi-Format Support**: PNG, JPEG, WebP, BMP
- **PII Masking**: Automatic detection and redaction of sensitive information
- **Multi-Monitor Support**: Works seamlessly with multiple displays
- **MCP Integration**: Designed for AI agent workflows

### Language Server Protocol (LSP) Features

The extension includes a built-in Language Server that provides intelligent code assistance for screenshot-related operations:

- **Hover Information**: Get instant documentation when hovering over screenshot functions, configuration objects, and identifiers
- **Code Lenses**: Quick action buttons appear inline for capturing screenshots, listing displays, and listing windows
- **Diagnostics**: Real-time validation of screenshot parameters with helpful error messages and suggestions
- **Code Completion**: Smart autocomplete for screenshot configuration properties and parameter values
- **AI Agent Commands**: Programmatic command execution for automated screenshot workflows
- **Multi-Language Support**: Works with JavaScript, TypeScript, JSX, TSX, and JSON configuration files

## Installation

1. Install from VS Code Marketplace (coming soon)
2. Or install from VSIX file:
   ```bash
   code --install-extension mcp-screenshot-0.0.1.vsix
   ```

## Usage

### Commands

- **MCP Screenshot: Capture Full Screen** - Capture the entire screen
- **MCP Screenshot: Capture Window** - Select and capture a specific window
- **MCP Screenshot: Capture Region** - Capture a rectangular region
- **MCP Screenshot: List Displays** - Show all connected displays
- **MCP Screenshot: List Windows** - Show all visible windows
- **MCP Screenshot: Open Settings** - Configure extension settings

### LSP Features

#### Hover Information

Hover over screenshot-related code to see documentation:

- **Function Calls**: Hover over `captureFullScreen()`, `captureWindow()`, or `captureRegion()` to see parameter documentation and examples
- **Configuration Objects**: Hover over screenshot configuration properties to see valid values and types
- **Identifiers**: Hover over display or window IDs to see information about that resource (when available)

All hover information is formatted as markdown with clear sections for parameters, return values, and usage examples.

#### Code Lenses

Code lenses appear as inline action buttons in your code:

- **📸 Capture Screenshot**: Appears near screenshot capture functions - click to execute the capture
- **🖥️ List Displays**: Appears near display enumeration code - click to see all connected displays
- **🪟 List Windows**: Appears near window enumeration code - click to see all visible windows

Code lenses provide quick access to screenshot operations without leaving your editor.

#### Diagnostics

Real-time validation catches issues before runtime:

- **Invalid Format**: Warns when format is not 'png', 'jpeg', or 'webp' and suggests valid options
- **Quality Range**: Errors when quality parameter is outside 0-100 range
- **Missing Parameters**: Errors when required screenshot parameters are missing
- **Deprecated APIs**: Informational messages for deprecated screenshot APIs with migration guidance

All diagnostics include the exact location, clear messages, and suggested fixes.

#### Code Completion

Smart autocomplete for screenshot code:

- **Configuration Properties**: Type in a screenshot config object to see all valid properties with documentation
- **Format Values**: Autocomplete suggests 'png', 'jpeg', 'webp' when typing format parameters
- **Quality Values**: Autocomplete suggests common quality values (80, 90, 95, 100)

All completion items include documentation and insert with correct syntax.

#### AI Agent Commands

The LSP exposes commands for programmatic execution:

- `mcp.screenshot.capture`: Execute screenshot capture with parameters
- `mcp.screenshot.listDisplays`: Get list of available displays
- `mcp.screenshot.listWindows`: Get list of available windows
- `mcp.screenshot.getCapabilities`: Get screenshot system capabilities

Commands return structured results or errors for reliable automation.

### Keyboard Shortcuts

You can assign custom keyboard shortcuts to any command via VS Code's keyboard shortcuts settings.

## Configuration

Configure the extension via VS Code settings:

```json
{
  "mcpScreenshot.defaultFormat": "png",
  "mcpScreenshot.defaultQuality": 90,
  "mcpScreenshot.saveDirectory": "${workspaceFolder}/screenshots",
  "mcpScreenshot.enablePIIMasking": false,
  "mcpScreenshot.autoSave": true,
  "mcpScreenshot.autoStart": true
}
```

### Settings

- `mcpScreenshot.defaultFormat`: Default image format (png, jpeg, webp, bmp)
- `mcpScreenshot.defaultQuality`: Default quality for lossy formats (1-100)
- `mcpScreenshot.saveDirectory`: Default directory for saving screenshots
- `mcpScreenshot.enablePIIMasking`: Enable PII detection and masking by default
- `mcpScreenshot.autoSave`: Automatically save screenshots to disk
- `mcpScreenshot.autoStart`: Automatically start MCP server when VS Code opens
- `mcpScreenshot.serverCommand`: Command to run MCP screenshot server
- `mcpScreenshot.serverArgs`: Arguments for MCP screenshot server command

## Requirements

- Visual Studio Code 1.85.0 or higher
- Node.js 18.0.0 or higher
- Platform-specific dependencies:
  - **Linux**: X11 or Wayland, ImageMagick
  - **macOS**: screencapture (built-in)
  - **Windows**: screenshot-desktop library

## Examples

### Using Commands

#### Capture Full Screen

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Run "MCP Screenshot: Capture Full Screen"
3. Screenshot is saved to configured directory

#### Capture Specific Window

1. Open Command Palette
2. Run "MCP Screenshot: Capture Window"
3. Select window from the list
4. Choose whether to include window frame
5. Screenshot is captured

#### Capture Region

1. Open Command Palette
2. Run "MCP Screenshot: Capture Region"
3. Enter coordinates and dimensions
4. Screenshot is captured

### Using LSP Features in Code

#### Example 1: Hover Information

```javascript
// Hover over captureFullScreen to see documentation
const screenshot = await captureFullScreen({
  format: 'png',  // Hover to see valid formats
  quality: 90     // Hover to see valid range
});
```

#### Example 2: Code Lenses

```javascript
// A code lens "📸 Capture Screenshot" appears above this function
async function takeScreenshot() {
  const result = await captureFullScreen({ format: 'png' });
  return result;
}

// A code lens "🖥️ List Displays" appears above this function
async function getDisplays() {
  const displays = await listDisplays();
  return displays;
}
```

#### Example 3: Diagnostics

```javascript
// ❌ Error: Quality must be between 0 and 100
const screenshot = await captureFullScreen({
  format: 'png',
  quality: 150  // Diagnostic appears here
});

// ⚠️ Warning: Invalid format, use 'png', 'jpeg', or 'webp'
const screenshot2 = await captureFullScreen({
  format: 'gif'  // Diagnostic appears here
});
```

#### Example 4: Code Completion

```javascript
// Type inside the config object to see completions
const screenshot = await captureFullScreen({
  // Type 'f' to see 'format' completion
  // Type 'q' to see 'quality' completion
  // Type 'e' to see 'enablePIIMasking' completion
});
```

#### Example 5: AI Agent Command Execution

```javascript
// AI agents can execute commands programmatically
const result = await vscode.commands.executeCommand(
  'mcp.screenshot.capture',
  {
    type: 'fullscreen',
    format: 'png',
    quality: 90
  }
);

const displays = await vscode.commands.executeCommand(
  'mcp.screenshot.listDisplays'
);
```

## Privacy & Security

- **PII Masking**: Automatically detect and redact emails, phone numbers, and credit cards
- **Window Exclusion**: Exclude password managers and authentication dialogs
- **Path Validation**: Restrict file saves to allowed directories
- **Rate Limiting**: Prevent capture spam

## Troubleshooting

### Extension Not Starting

Check the Output panel (View → Output → MCP Screenshot) for error messages.

### Permission Errors on Linux

Ensure X11 access:
```bash
xhost +local:
```

### macOS Screen Recording Permission

Grant screen recording permission:
1. System Preferences → Security & Privacy → Privacy
2. Select "Screen Recording"
3. Add Visual Studio Code

## Support

- GitHub: https://github.com/digital-defiance/ai-capabilities-suite
- Issues: https://github.com/digital-defiance/ai-capabilities-suite/issues
- Email: info@digitaldefiance.org

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please see our contributing guidelines in the repository.

## Supported File Types

The LSP features work in the following file types:

- **JavaScript** (`.js`)
- **TypeScript** (`.ts`)
- **JSX** (`.jsx`)
- **TSX** (`.tsx`)
- **JSON** (`.json`) - Configuration validation only

## Changelog

### 0.1.0 (LSP Integration)

- Added Language Server Protocol support
- Hover information for screenshot APIs
- Code lenses for quick actions
- Real-time diagnostics and validation
- Code completion for configuration
- AI agent command execution
- Multi-language support (JS, TS, JSX, TSX, JSON)

### 0.0.1 (Initial Release)

- Full screen capture
- Window capture
- Region capture
- Multi-format support
- PII masking
- Multi-monitor support
- MCP integration

# 📸 MCP Screenshot - VS Code Extension

**Give AI agents visual superpowers to see, analyze, and document your applications like never before.**

This isn't just another screenshot tool—it's the bridge that gives AI agents **visual awareness** of your development environment, enabling them to become intelligent documentation partners, UI analyzers, and visual debugging assistants.

## 🔗 Repository

This package is now maintained in its own repository: **[https://github.com/Digital-Defiance/vscode-mcp-screenshot](https://github.com/Digital-Defiance/vscode-mcp-screenshot)**

This repository is part of the [AI Capabilitites Suite](https://github.com/Digital-Defiance/ai-capabilitites-suite) on GitHub.

## 🤔 Why Do AI Agents Need to See Your Screen?

**AI agents today are powerful but blind.** They can read your code and suggest improvements, but they can't see what your application actually looks like or how users interact with it. This creates a massive gap in their ability to help you.

### 🎯 Revolutionary Use Cases

#### 📚 **"AI, create documentation for this feature"**
```
You: "Document the new dashboard layout"
AI: *Captures screenshots, analyzes UI components*
AI: "Created comprehensive guide with 8 annotated screenshots showing navigation flow, key features, and user interactions..."
```

#### 🐛 **"AI, help debug this UI issue"**
```
You: "The button alignment looks wrong"
AI: *Captures current state, analyzes layout*
AI: "Button is 3px off-center. Here's the CSS fix and a before/after comparison..."
```

#### 🎥 **"AI, create a demo walkthrough"**
```
You: "Show how the authentication flow works"
AI: *Captures key screens, creates step-by-step guide*
AI: "Generated 6-step visual walkthrough with annotations and user journey map..."
```

#### 🔍 **"AI, analyze this design for accessibility"**
```
You: "Check if this form is accessible"
AI: *Captures form, analyzes contrast and layout*
AI: "Found 3 accessibility issues: low contrast on labels, missing focus indicators, inadequate spacing..."
```

#### 📊 **"AI, compare these two implementations"**
```
You: "Which design works better?"
AI: *Captures both versions, analyzes differences*
AI: "Version B has 23% better visual hierarchy and clearer call-to-action placement..."
```

#### 🎨 **"AI, help with responsive design"**
```
You: "How does this look on different screen sizes?"
AI: *Captures multiple viewport sizes*
AI: "Mobile layout breaks at 768px - navigation overlaps content. Here's the media query fix..."
```

---

## ✨ What This Changes

**Before:** AI could only work with code and text descriptions
- ❌ "The button looks weird" → AI guesses what you mean
- ❌ "Create documentation" → AI writes generic text
- ❌ "Check the layout" → AI can't see the actual result

**After:** AI can see and analyze your actual application
- ✅ **Visual debugging** - AI sees exactly what's wrong
- ✅ **Intelligent documentation** - AI creates guides with real screenshots
- ✅ **Design analysis** - AI evaluates actual user interfaces
- ✅ **Accessibility audits** - AI checks real visual contrast and layout
- ✅ **Responsive testing** - AI captures and compares different screen sizes

---

## 🚀 Features

### Screenshot Capabilities

- **Full Screen Capture**: Capture entire displays or specific monitors
- **Window Capture**: Target specific application windows  
- **Region Capture**: Capture rectangular screen regions
- **Multi-Format Support**: PNG, JPEG, WebP, BMP with quality control
- **PII Masking**: Automatic detection and redaction of sensitive information
- **Multi-Monitor Support**: Works seamlessly with multiple displays
- **Privacy Controls**: Exclude sensitive windows and applications
- **MCP Integration**: Purpose-built for AI agent workflows

### 🎨 Language Server Protocol (LSP) Features - 20 Features

The extension includes a comprehensive Language Server providing professional-grade code intelligence:

#### **Code Actions (4 features)**
- **Fix Invalid Format**: Corrects invalid format values (bmp, gif) → suggests valid formats (png, jpeg, webp)
- **Fix Quality Range**: Clamps quality values to 0-100 range
- **Add Missing Parameters**: Generates parameter templates for incomplete function calls
- **Migrate Deprecated API**: Converts 6 deprecated functions to modern equivalents

#### **Real-time Assistance (3 features)**
- **Signature Help**: Shows parameter documentation for all 5 screenshot functions as you type (triggered by `(` and `,`)
- **Inlay Hints - Dimensions**: Shows `// 800x600px` inline after region captures
- **Inlay Hints - File Size**: Shows `// ~2.5MB` inline based on format and quality

#### **Code Navigation (3 features)**
- **Document Symbols**: Navigate capture operations and list operations via outline (Ctrl+Shift+O)
- **Document Links**: Clickable links to EXAMPLES.md for all 5 screenshot functions (Ctrl+Click)
- **Call Hierarchy**: Visualize function dependencies (captureFull→listDisplays)

#### **Visual Enhancements (3 features)**
- **Semantic Highlighting**: Custom colors for `capture*` and `list*` functions, special highlighting for `enablePIIMasking`
- **Color Provider**: Visual colors for image formats (png=blue, jpeg=orange, webp=green, bmp=red)
- **Folding Ranges**: Collapse/expand capture operations and config objects

#### **Smart Editing (3 features)**
- **Selection Ranges**: Smart selection expansion with Shift+Alt+Right
- **Linked Editing**: Simultaneously edit format variables across file
- **Type Hierarchy**: Explore type relationships (CaptureConfig→Object)

#### **Core Intelligence (4 features)**
- **Color Provider**: Visual colors for image formats (png=blue, jpeg=orange, webp=green, bmp=red)
- **Folding Ranges**: Collapse/expand capture operations and config objects
- **Selection Ranges**: Smart selection expansion with Shift+Alt+Right
- **Linked Editing**: Simultaneously edit format variables across file
- **Call Hierarchy**: Visualize function dependencies (captureFull→listDisplays)
- **Type Hierarchy**: Explore type relationships (CaptureConfig→Object)


- **Hover Information**: Contextual help for functions, config properties, and identifiers
- **Code Completion**: Smart autocomplete for configuration properties and values
- **Diagnostics**: Real-time validation with helpful error messages
- **Code Lenses**: Inline action buttons for quick screenshot operations
- **AI Agent Commands**: Programmatic command execution for automation

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

### LSP Features in Action

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

## 🎮 Real-World Examples

### AI-Powered Workflows

#### **Documentation Generation**
```
1. You: "@copilot Document the user registration flow"
2. AI: *Uses MCP Screenshot to capture each step*
3. AI: *Analyzes UI elements and user journey*
4. AI: *Generates markdown with embedded screenshots*
5. Result: Complete documentation with visual guides
```

#### **Bug Report Creation**
```
1. You: "@copilot This form validation isn't working right"
2. AI: *Captures current state and error conditions*
3. AI: *Analyzes expected vs actual behavior*
4. AI: *Creates detailed bug report with screenshots*
5. Result: Professional bug report ready for your team
```

#### **Design Review & Feedback**
```
1. You: "@copilot Review this new feature design"
2. AI: *Captures different states and interactions*
3. AI: *Analyzes usability and accessibility*
4. AI: *Provides specific improvement suggestions*
5. Result: Actionable design feedback with visual examples
```

#### **Responsive Design Testing**
```
1. You: "@copilot Check how this looks on mobile"
2. AI: *Captures multiple viewport sizes*
3. AI: *Identifies layout issues and breakpoints*
4. AI: *Suggests CSS improvements*
5. Result: Responsive design fixes with before/after comparisons
```

### Manual Commands

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

#### Code Actions Examples

**Fix Invalid Format:**
```javascript
// ⚠️ Warning: Invalid format 'bmp'
const screenshot = await captureFull({ format: 'bmp' });
// 💡 Quick Fix: Change to 'png', 'jpeg', or 'webp'
```

**Fix Quality Range:**
```javascript
// ❌ Error: Quality 150 out of range
const screenshot = await captureFull({ format: 'jpeg', quality: 150 });
// 💡 Quick Fix: Clamp to 100
```

**Add Missing Parameters:**
```javascript
// ❌ Error: Missing required parameters
const screenshot = await captureFull();
// 💡 Quick Fix: Add parameter template
const screenshot = await captureFull({ format: 'png', quality: 90 });
```

**Migrate Deprecated API:**
```javascript
// ℹ️ Info: takeScreenshot is deprecated
const screenshot = await takeScreenshot();
// 💡 Quick Fix: Migrate to captureFull
const screenshot = await captureFull({ format: 'png' });
```

#### Real-time Assistance Examples

**Signature Help:**

```javascript
// Type '(' to see parameter hints
captureFull(
  // ↓ Shows: config: { format: string, quality?: number, ... }
  { format: 'png', quality: 90 }
);

// Type ',' to move to next parameter
captureWindow(
  // ↓ Shows all config properties with types and descriptions
);
```

**Inlay Hints:**

```javascript
// Image dimensions hint
const region = await captureRegion({
  x: 0, y: 0, width: 800, height: 600
});  // → 800x600px

// File size estimate hint
const full = await captureFull({
  format: 'png', quality: 90
});  // → ~2.5MB
```

#### Code Navigation Examples

**Document Symbols:**

```javascript
// Press Ctrl+Shift+O to see outline:
// 📸 Capture Operations
//   ├─ captureFull (line 5)
//   ├─ captureWindow (line 10)
//   └─ captureRegion (line 15)
// 📊 List Operations
//   ├─ listDisplays (line 20)
//   └─ listWindows (line 25)

async function screenshots() {
  await captureFull({ format: 'png' });
  await captureWindow({ windowTitle: 'VSCode' });
  await captureRegion({ x: 0, y: 0, width: 800, height: 600 });
  await listDisplays();
  await listWindows();
}
```

**Document Links:**
```javascript
// Hover over function to see underlined link
// Ctrl+Click to open EXAMPLES.md
captureFull({ format: 'png' });  // → Links to captureFull examples
captureWindow({ windowTitle: 'VSCode' });  // → Links to captureWindow examples
```

**Call Hierarchy:**
```javascript
// Right-click 'captureFull' → Show Call Hierarchy
captureFull({ format: 'png' });
// Shows: captureFull → depends on → listDisplays
```

#### Visual Enhancements Examples

**Semantic Highlighting:**

```javascript
// Functions highlighted in distinct color
captureFull({ format: 'png' });  // 'captureFull' highlighted
listDisplays();  // 'listDisplays' highlighted

// PII keyword highlighted for security awareness
const config = {
  format: 'png',
  enablePIIMasking: true  // 'enablePIIMasking' highlighted
};
```

**Color Provider:**
```javascript
// Color squares appear in gutter
format: 'png'   // 🟦 Blue square
format: 'jpeg'  // 🟧 Orange square
format: 'webp'  // 🟩 Green square
```

**Folding Ranges:**
```javascript
// Click fold icon to collapse
captureFull({  // ▼ Click to fold
  format: 'png',
  quality: 90,
  enablePIIMasking: true
});  // ▲ Click to unfold
```

**Selection Ranges:**
```javascript
// Place cursor, press Shift+Alt+Right to expand
captureFull({ format: 'png' });
// 1st press: selects 'captureFull'
// 2nd press: selects entire function call
// 3rd press: selects entire line
```

**Linked Editing:**
```javascript
// Edit 'format' on line 1, line 3 updates automatically
const format = 'png';
captureFull({ format });  // Updates when you edit line 1
captureWindow({ format });  // Also updates
```

#### Smart Editing Examples

**Selection Ranges:**
```javascript
// Place cursor, press Shift+Alt+Right to expand
captureFull({ format: 'png' });
// 1st press: selects 'captureFull'
// 2nd press: selects entire function call
// 3rd press: selects entire line
```

**Linked Editing:**
```javascript
// Edit 'format' on line 1, line 3 updates automatically
const format = 'png';
captureFull({ format });  // Updates when you edit line 1
captureWindow({ format });  // Also updates
```

**Type Hierarchy:**
```typescript
// Right-click 'CaptureConfig' → Show Type Hierarchy
const config: CaptureConfig = { format: 'png' };
// Shows: CaptureConfig → extends → Object
```

#### Core Intelligence Examples

**Hover Information:**

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

### 0.2.0 (Complete LSP Implementation)

**20 LSP Features Organized by Category:**

- **Code Actions**: 4 actions (fix format, fix quality, add parameters, migrate API)
- **Real-time Assistance**: Signature help + 2 inlay hints (dimensions, file size)
- **Code Navigation**: Document symbols, document links, call hierarchy
- **Visual Enhancements**: Semantic highlighting, color provider, folding ranges
- **Smart Editing**: Selection ranges, linked editing, type hierarchy
- **Core Intelligence**: Hover, completion, diagnostics, code lens, AI commands
- **Quality**: 52+ automated tests, 97% LSP coverage (34/35 features)
- **Performance**: 2-5x faster than targets, < 100ms response times

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

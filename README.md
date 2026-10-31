# 📸 MCP ACS Screenshot - VS Code Extension

**Give AI agents visual superpowers to see, analyze, and document your applications like never before.**

This isn't just another screenshot tool—it's the bridge that gives AI agents **visual awareness** of your development environment, enabling them to become intelligent documentation partners, UI analyzers, and visual debugging assistants.

## 🔗 Repository

This package is now maintained in its own repository: **[https://github.com/Digital-Defiance/vscode-mcp-screenshot](https://github.com/Digital-Defiance/vscode-mcp-screenshot)**

This repository is part of the [AI Capabilitites Suite](https://github.com/Digital-Defiance/ai-capabilities-suite) on GitHub.

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

### Agent Integration

The extension exposes screenshot capabilities through VS Code Language Model Tools and MCP for AI agent workflows. Agents can capture full screens, windows, and regions, list displays and windows, and query capabilities without requiring editor-side language services.

## Installation

1. Install from VS Code Marketplace (coming soon)
2. Or install from VSIX file:

   ```bash
   code --install-extension mcp-screenshot-0.0.1.vsix
   ```

## Usage

### Commands

- **MCP ACS Screenshot: Capture Full Screen** - Capture the entire screen
- **MCP ACS Screenshot: Capture Window** - Select and capture a specific window
- **MCP ACS Screenshot: Capture Region** - Capture a rectangular region
- **MCP ACS Screenshot: List Displays** - Show all connected displays
- **MCP ACS Screenshot: List Windows** - Show all visible windows
- **MCP ACS Screenshot: Open Settings** - Configure extension settings

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
2. AI: *Uses MCP ACS Screenshot to capture each step*
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
2. Run "MCP ACS Screenshot: Capture Full Screen"
3. Screenshot is saved to configured directory

#### Capture Specific Window

1. Open Command Palette
2. Run "MCP ACS Screenshot: Capture Window"
3. Select window from the list
4. Choose whether to include window frame
5. Screenshot is captured

#### Capture Region

1. Open Command Palette
2. Run "MCP ACS Screenshot: Capture Region"
3. Enter coordinates and dimensions
4. Screenshot is captured

## Privacy & Security

- **PII Masking**: Automatically detect and redact emails, phone numbers, and credit cards
- **Window Exclusion**: Exclude password managers and authentication dialogs
- **Path Validation**: Restrict file saves to allowed directories
- **Rate Limiting**: Prevent capture spam

## Troubleshooting

### Extension Not Starting

Check the Output panel (View → Output → MCP ACS Screenshot) for error messages.

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

- GitHub: <https://github.com/digital-defiance/ai-capabilities-suite>
- Issues: <https://github.com/digital-defiance/ai-capabilities-suite/issues>
- Email: <info@digitaldefiance.org>

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please see our contributing guidelines in the repository.

## Changelog

### 0.0.1 (Initial Release)

- Full screen capture
- Window capture
- Region capture
- Multi-format support
- PII masking
- Multi-monitor support
- MCP integration

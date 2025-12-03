# VSCode Extension Testing Guide

This document describes how to test the MCP Screenshot VSCode extension.

## Test Structure

```
src/test/
├── runTest.ts              # Test runner entry point
└── suite/
    ├── index.ts            # Test suite configuration
    ├── extension.test.ts   # Extension integration tests
    └── mcpClient.test.ts   # MCP client unit tests
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile
```

### Run All Tests

```bash
npm test
```

This will:
1. Download VSCode test instance (if needed)
2. Compile the extension
3. Launch VSCode with the extension
4. Run all test suites
5. Report results

### Run Tests in Watch Mode

```bash
npm run watch
```

Then in another terminal:
```bash
npm test
```

### Run Specific Test Suite

```bash
# Run only extension tests
npm test -- --grep "Extension Test Suite"

# Run only client tests
npm test -- --grep "MCP Client"
```

## Test Suites

### 1. Extension Integration Tests (`extension.test.ts`)

Tests the full extension integration with VSCode:

**Test Coverage:**
- ✅ Extension activation
- ✅ Command registration
- ✅ Configuration management
- ✅ Command execution
- ✅ Error handling
- ✅ Output channel creation

**Key Tests:**
- Extension should be present and activate
- All 6 commands should be registered
- Configuration should have correct defaults
- Commands should execute without crashing
- Error handling should be graceful

### 2. MCP Client Tests (`mcpClient.test.ts`)

Tests the MCP client functionality:

**Test Coverage:**
- ✅ Client creation
- ✅ Method availability
- ✅ Server startup/shutdown
- ✅ Request handling
- ✅ Error handling
- ✅ Timeout handling

**Key Tests:**
- Client should have all required methods
- Client should handle start/stop lifecycle
- Client should reject operations before start
- Client should handle server failures gracefully
- All capture methods should accept valid parameters

## Manual Testing

### Testing in Development

1. **Open Extension Development Host:**
   ```bash
   # In VSCode, press F5 or:
   code --extensionDevelopmentPath=/path/to/vscode-mcp-screenshot
   ```

2. **Test Commands:**
   - Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Type "MCP Screenshot"
   - Test each command:
     - Capture Full Screen
     - Capture Window
     - Capture Region
     - List Displays
     - List Windows
     - Open Settings

3. **Test Configuration:**
   - Open Settings (Ctrl+, / Cmd+,)
   - Search for "MCP Screenshot"
   - Modify settings and verify behavior

4. **Test Error Scenarios:**
   - Disable auto-start
   - Try to capture screenshot (should show error)
   - Set invalid server command
   - Verify graceful error handling

### Testing the Packaged Extension

1. **Package the Extension:**
   ```bash
   npm run package
   ```

2. **Install Locally:**
   ```bash
   code --install-extension mcp-screenshot-0.0.1.vsix
   ```

3. **Test in Clean Environment:**
   - Close all VSCode windows
   - Open new VSCode window
   - Verify extension activates
   - Test all commands

4. **Uninstall:**
   ```bash
   code --uninstall-extension DigitalDefiance.mcp-screenshot
   ```

## Platform-Specific Testing

### Linux

```bash
# Install X11 dependencies
sudo apt-get install xvfb

# Run tests with virtual display
xvfb-run npm test
```

### macOS

```bash
# Grant screen recording permissions
# System Preferences → Security & Privacy → Screen Recording
# Add VSCode to allowed apps

npm test
```

### Windows

```bash
# Run as administrator if needed
npm test
```

## CI/CD Testing

### GitHub Actions

```yaml
name: Test VSCode Extension

on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd packages/vscode-mcp-screenshot
          npm ci
      
      - name: Run tests (Linux)
        if: runner.os == 'Linux'
        run: |
          cd packages/vscode-mcp-screenshot
          xvfb-run -a npm test
      
      - name: Run tests (macOS/Windows)
        if: runner.os != 'Linux'
        run: |
          cd packages/vscode-mcp-screenshot
          npm test
```

## Debugging Tests

### Enable Verbose Logging

```bash
# Set environment variable
export DEBUG=*

# Run tests
npm test
```

### Debug in VSCode

1. Open `packages/vscode-mcp-screenshot` in VSCode
2. Set breakpoints in test files
3. Press F5 to start debugging
4. Select "Extension Tests" launch configuration
5. Tests will run with debugger attached

### View Test Output

```bash
# Run with detailed output
npm test -- --reporter spec

# Run with JSON output
npm test -- --reporter json > test-results.json
```

## Test Coverage

### Generate Coverage Report

```bash
# Install coverage tool
npm install --save-dev nyc

# Run tests with coverage
npx nyc npm test

# View coverage report
open coverage/index.html
```

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Common Issues

### Issue: Tests Timeout

**Solution:**
```typescript
// Increase timeout in test
test('Long running test', async function() {
  this.timeout(60000); // 60 seconds
  // ... test code
});
```

### Issue: Extension Not Activating

**Causes:**
- Missing dependencies
- Compilation errors
- Invalid package.json

**Solutions:**
1. Check compilation: `npm run compile`
2. Verify package.json syntax
3. Check extension logs in Output panel

### Issue: Server Not Starting

**Causes:**
- MCP server package not installed
- Invalid server command
- Port conflicts

**Solutions:**
1. Install server: `npm install @ai-capabilities-suite/mcp-screenshot`
2. Check server command in settings
3. Verify no port conflicts

### Issue: Display Server Not Available (Linux)

**Solution:**
```bash
# Use Xvfb for headless testing
xvfb-run -a npm test

# Or set DISPLAY variable
export DISPLAY=:99
Xvfb :99 -screen 0 1920x1080x24 &
npm test
```

### Issue: Permission Denied (macOS)

**Solution:**
1. Open System Preferences
2. Go to Security & Privacy → Privacy
3. Select Screen Recording
4. Add VSCode to allowed apps
5. Restart VSCode

## Best Practices

### Writing Tests

1. **Use Descriptive Names:**
   ```typescript
   test('Should capture full screen with PNG format', async () => {
     // ...
   });
   ```

2. **Test One Thing:**
   ```typescript
   // Good
   test('Should register capture command', () => {
     // Test only command registration
   });
   
   // Bad
   test('Should register and execute command', () => {
     // Tests two things
   });
   ```

3. **Clean Up Resources:**
   ```typescript
   teardown(() => {
     client.stop();
     outputChannel.dispose();
   });
   ```

4. **Handle Async Properly:**
   ```typescript
   test('Async test', async function() {
     this.timeout(10000);
     await someAsyncOperation();
   });
   ```

5. **Use Assertions:**
   ```typescript
   assert.ok(value, 'Value should be truthy');
   assert.strictEqual(actual, expected, 'Values should match');
   assert.throws(() => fn(), Error, 'Should throw error');
   ```

### Test Organization

1. **Group Related Tests:**
   ```typescript
   suite('Feature Tests', () => {
     suite('Sub-feature Tests', () => {
       test('Specific test', () => {});
     });
   });
   ```

2. **Use Setup/Teardown:**
   ```typescript
   suite('Tests', () => {
     let resource: Resource;
     
     setup(() => {
       resource = createResource();
     });
     
     teardown(() => {
       resource.dispose();
     });
   });
   ```

3. **Share Test Data:**
   ```typescript
   const testData = {
     validInput: { /* ... */ },
     invalidInput: { /* ... */ }
   };
   ```

## Performance Testing

### Measure Extension Startup Time

```typescript
test('Extension should activate quickly', async function() {
  this.timeout(5000);
  
  const start = Date.now();
  const ext = vscode.extensions.getExtension('DigitalDefiance.mcp-screenshot');
  await ext?.activate();
  const duration = Date.now() - start;
  
  assert.ok(duration < 3000, `Activation took ${duration}ms (should be < 3000ms)`);
});
```

### Measure Command Execution Time

```typescript
test('Command should execute quickly', async function() {
  this.timeout(10000);
  
  const start = Date.now();
  await vscode.commands.executeCommand('mcp-screenshot.listDisplays');
  const duration = Date.now() - start;
  
  assert.ok(duration < 5000, `Command took ${duration}ms (should be < 5000ms)`);
});
```

## Resources

- [VSCode Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [Mocha Documentation](https://mochajs.org/)
- [VSCode Test API](https://code.visualstudio.com/api/references/vscode-api)
- [Extension Development](https://code.visualstudio.com/api/get-started/your-first-extension)

## Support

For testing issues:

1. Check this guide
2. Review test output and logs
3. Open an issue on GitHub
4. Contact maintainers

---

**Last Updated**: 2024
**Maintainer**: Digital Defiance
**Extension**: mcp-screenshot

import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { runTests } from "@vscode/test-electron";

function findVSCodeExecutable(): string {
  const command = process.platform === "win32" ? "where.exe" : "which";
  const launcher = execFileSync(command, ["code"], {
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((candidate) => candidate.trim())
    .find(Boolean);

  if (!launcher) {
    throw new Error(
      "Unable to find the VS Code command in PATH. Add the VS Code bin directory to PATH."
    );
  }

  if (process.platform === "win32") {
    const executable = path.resolve(
      path.dirname(launcher),
      "..",
      "Code.exe"
    );
    if (fs.existsSync(executable)) {
      return executable;
    }
  }

  return launcher;
}

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    // The path to test runner
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      vscodeExecutablePath: findVSCodeExecutable(),
      launchArgs: ["--disable-extensions"],
      extensionTestsEnv: {
        VSCODE_TEST_MODE: "true",
        NODE_ENV: "test",
      },
    });
  } catch (err) {
    console.error("Failed to run tests:", err);
    process.exit(1);
  }
}

main();

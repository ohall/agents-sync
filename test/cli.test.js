import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { main } from "../src/cli.js";

describe("cli", () => {
  let testDir;
  let originalCwd;
  let originalArgv;
  let originalExit;

  beforeEach(() => {
    // Create a temporary directory for each test
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "agents-link-cli-test-"));
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Save original process.argv
    originalArgv = [...process.argv];
    originalExit = process.exit;
  });

  afterEach(() => {
    // Restore original working directory
    process.chdir(originalCwd);
    // Restore original process.argv
    process.argv = originalArgv;
    process.exit = originalExit;
    // Clean up temporary directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  describe("help command", () => {
    it("should show usage when --help is provided", async () => {
      process.argv = ["node", "bin/agents-link.js", "--help"];
      const exitCode = { value: null };
      process.exit = vi.fn((code) => {
        exitCode.value = code;
      });

      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      try {
        await main();
      } catch {
        // Ignore process.exit errors
      }

      expect(exitCode.value).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join("\n");
      expect(output).toContain("agents-link");
      expect(output).toContain("USAGE");

      consoleLogSpy.mockRestore();
    });

    it("should show usage when -h is provided", async () => {
      process.argv = ["node", "bin/agents-link.js", "-h"];
      const exitCode = { value: null };
      process.exit = vi.fn((code) => {
        exitCode.value = code;
      });

      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      try {
        await main();
      } catch {
        // Ignore process.exit errors
      }

      expect(exitCode.value).toBe(0);
      consoleLogSpy.mockRestore();
    });

    it("should show usage when no command is provided", async () => {
      process.argv = ["node", "bin/agents-link.js"];
      const exitCode = { value: null };
      process.exit = vi.fn((code) => {
        exitCode.value = code;
      });

      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      try {
        await main();
      } catch {
        // Ignore process.exit errors
      }

      expect(exitCode.value).toBe(0);
      consoleLogSpy.mockRestore();
    });
  });

  describe("version command", () => {
    it("should show version when --version is provided", async () => {
      process.argv = ["node", "bin/agents-link.js", "--version"];
      const exitCode = { value: null };
      process.exit = vi.fn((code) => {
        exitCode.value = code;
      });

      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      try {
        await main();
      } catch {
        // Ignore process.exit errors
      }

      expect(exitCode.value).toBe(0);
      const output = consoleLogSpy.mock.calls.flat().join("\n");
      expect(output).toContain("agents-link v1.0.0");

      consoleLogSpy.mockRestore();
    });

    it("should show version when -v is provided", async () => {
      process.argv = ["node", "bin/agents-link.js", "-v"];
      const exitCode = { value: null };
      process.exit = vi.fn((code) => {
        exitCode.value = code;
      });

      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      try {
        await main();
      } catch {
        // Ignore process.exit errors
      }

      expect(exitCode.value).toBe(0);
      consoleLogSpy.mockRestore();
    });
  });

  describe("init command", () => {
    it("should call init when init command is provided", async () => {
      const sourceContent = "# Test AGENTS.md";
      fs.writeFileSync("AGENTS.md", sourceContent, "utf8");

      process.argv = ["node", "bin/agents-link.js", "init"];
      process.exit = vi.fn(() => {
        // Don't actually exit in tests
      });

      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await main();

      expect(fs.existsSync("CLAUDE.md")).toBe(true);
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("should exit with code 3 when AGENTS.md does not exist", async () => {
      process.argv = ["node", "bin/agents-link.js", "init"];
      const exitCode = { value: null };
      process.exit = vi.fn((code) => {
        exitCode.value = code;
      });

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        await main();
      } catch {
        // Ignore process.exit errors
      }

      expect(exitCode.value).toBe(3);
      const output = consoleErrorSpy.mock.calls.flat().join("\n");
      expect(output).toContain("AGENTS.md not found");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("sync command", () => {
    it("should call sync when sync command is provided", async () => {
      const sourceContent = "# Test AGENTS.md";
      fs.writeFileSync("AGENTS.md", sourceContent, "utf8");

      // Create initial managed copy
      const { init } = await import("../src/index.js");
      await init();

      process.argv = ["node", "bin/agents-link.js", "sync"];
      process.exit = vi.fn(() => {
        // Don't actually exit in tests
      });

      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      await main();

      expect(fs.existsSync("CLAUDE.md")).toBe(true);
      consoleLogSpy.mockRestore();
    });
  });

  describe("clean command", () => {
    it("should call clean when clean command is provided", async () => {
      const sourceContent = "# Test AGENTS.md";
      fs.writeFileSync("AGENTS.md", sourceContent, "utf8");

      // Create initial managed copy
      const { init } = await import("../src/index.js");
      await init();

      expect(fs.existsSync("CLAUDE.md")).toBe(true);

      process.argv = ["node", "bin/agents-link.js", "clean"];
      process.exit = vi.fn(() => {
        // Don't actually exit in tests
      });

      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      await main();

      expect(fs.existsSync("CLAUDE.md")).toBe(false);
      consoleLogSpy.mockRestore();
    });
  });

  describe("print-targets command", () => {
    it("should call printTargets when print-targets command is provided", async () => {
      process.argv = ["node", "bin/agents-link.js", "print-targets"];
      process.exit = vi.fn(() => {
        // Don't actually exit in tests
      });

      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});

      await main();

      const output = consoleLogSpy.mock.calls.flat().join("\n");
      expect(output).toContain("Target files:");

      consoleLogSpy.mockRestore();
    });
  });

  describe("unknown command", () => {
    it("should show error and usage for unknown command", async () => {
      process.argv = ["node", "bin/agents-link.js", "unknown-command"];
      const exitCode = { value: null };
      process.exit = vi.fn((code) => {
        exitCode.value = code;
      });

      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      try {
        await main();
      } catch {
        // Ignore process.exit errors
      }

      expect(exitCode.value).toBe(2);
      const errorOutput = consoleErrorSpy.mock.calls.flat().join("\n");
      expect(errorOutput).toContain("Unknown command");

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});


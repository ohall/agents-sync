import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { init, sync, clean, printTargets } from "../src/index.js";

describe("agents-link", () => {
  let testDir;
  let originalCwd;

  beforeEach(() => {
    // Create a temporary directory for each test
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "agents-link-test-"));
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    // Restore original working directory
    process.chdir(originalCwd);
    // Clean up temporary directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("init", () => {
    it("should create managed copies when AGENTS.md exists", async () => {
      const sourceContent = "# Test AGENTS.md\n\nThis is a test file.";
      fs.writeFileSync("AGENTS.md", sourceContent, "utf8");

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await init();

      // Check that CLAUDE.md was created (symlink or managed copy)
      expect(fs.existsSync("CLAUDE.md")).toBe(true);
      const claudeContent = fs.readFileSync("CLAUDE.md", "utf8");
      // Content should match source (symlink resolves to source)
      // or contain source with managed header (managed copy)
      expect(claudeContent).toContain(sourceContent);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("should create directories for nested targets", async () => {
      const sourceContent = "# Test AGENTS.md";
      fs.writeFileSync("AGENTS.md", sourceContent, "utf8");

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await init();

      // Check that nested directories were created
      expect(fs.existsSync(".cursor/rules/AGENTS.md")).toBe(true);
      expect(fs.existsSync(".windsurf/rules/AGENTS.md")).toBe(true);

      consoleSpy.mockRestore();
    });

    it("should throw error when AGENTS.md does not exist", async () => {
      await expect(init()).rejects.toThrow("AGENTS.md not found");
    });

    it("should skip existing non-managed files", async () => {
      const sourceContent = "# Test AGENTS.md";
      fs.writeFileSync("AGENTS.md", sourceContent, "utf8");
      fs.writeFileSync("CLAUDE.md", "existing content", "utf8");

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await init();

      // File should remain unchanged
      const claudeContent = fs.readFileSync("CLAUDE.md", "utf8");
      expect(claudeContent).toBe("existing content");

      consoleSpy.mockRestore();
    });

    it("should recognize existing managed files", async () => {
      const sourceContent = "# Test AGENTS.md";
      fs.writeFileSync("AGENTS.md", sourceContent, "utf8");

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      // First init
      await init();

      // Second init should recognize existing file (symlink or managed copy)
      await init();

      const logs = consoleSpy.mock.calls.flat().join("\n");
      // Should show either "managed copy already exists" or "symlink already exists"
      expect(logs).toMatch(/(managed copy already exists|symlink already exists)/);

      consoleSpy.mockRestore();
    });
  });

  describe("sync", () => {
    it("should update managed copies with new content", async () => {
      const initialContent = "# Initial content";
      const updatedContent = "# Updated content";

      fs.writeFileSync("AGENTS.md", initialContent, "utf8");

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      // Create initial managed copy
      await init();

      // Update source
      fs.writeFileSync("AGENTS.md", updatedContent, "utf8");

      // Sync should update managed copy
      await sync();

      const claudeContent = fs.readFileSync("CLAUDE.md", "utf8");
      expect(claudeContent).toContain(updatedContent);
      expect(claudeContent).not.toContain(initialContent);

      consoleSpy.mockRestore();
    });

    it("should skip non-managed files", async () => {
      const sourceContent = "# Test AGENTS.md";
      fs.writeFileSync("AGENTS.md", sourceContent, "utf8");
      fs.writeFileSync("CLAUDE.md", "existing content", "utf8");

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await sync();

      const claudeContent = fs.readFileSync("CLAUDE.md", "utf8");
      expect(claudeContent).toBe("existing content");

      const logs = consoleSpy.mock.calls.flat().join("\n");
      expect(logs).toContain("not managed, skipping");

      consoleSpy.mockRestore();
    });

    it("should throw error when AGENTS.md does not exist", async () => {
      await expect(sync()).rejects.toThrow("AGENTS.md not found");
    });
  });

  describe("clean", () => {
    it("should remove managed copies", async () => {
      const sourceContent = "# Test AGENTS.md";
      fs.writeFileSync("AGENTS.md", sourceContent, "utf8");

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await init();
      expect(fs.existsSync("CLAUDE.md")).toBe(true);

      await clean();
      expect(fs.existsSync("CLAUDE.md")).toBe(false);

      consoleSpy.mockRestore();
    });

    it("should skip non-managed files", async () => {
      fs.writeFileSync("CLAUDE.md", "existing content", "utf8");

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await clean();

      expect(fs.existsSync("CLAUDE.md")).toBe(true);

      const logs = consoleSpy.mock.calls.flat().join("\n");
      expect(logs).toContain("not managed, skipping");

      consoleSpy.mockRestore();
    });

    it("should not throw when files do not exist", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await expect(clean()).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe("printTargets", () => {
    it("should print all target files with status", async () => {
      const sourceContent = "# Test AGENTS.md";
      fs.writeFileSync("AGENTS.md", sourceContent, "utf8");

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await init();
      await printTargets();

      const output = consoleSpy.mock.calls.flat().join("\n");
      expect(output).toContain("Target files:");
      expect(output).toContain("CLAUDE.md");
      expect(output).toContain(".cursorrules");

      consoleSpy.mockRestore();
    });

    it("should show [not created] for non-existent files", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await printTargets();

      const output = consoleSpy.mock.calls.flat().join("\n");
      expect(output).toContain("[not created]");

      consoleSpy.mockRestore();
    });

    it("should show [managed] for managed copies", async () => {
      const sourceContent = "# Test AGENTS.md";
      fs.writeFileSync("AGENTS.md", sourceContent, "utf8");

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await init();
      await printTargets();

      const output = consoleSpy.mock.calls.flat().join("\n");
      // Should show either [managed] or [symlink] depending on OS support
      expect(output).toMatch(/\[(managed|symlink)\]/);

      consoleSpy.mockRestore();
    });
  });
});


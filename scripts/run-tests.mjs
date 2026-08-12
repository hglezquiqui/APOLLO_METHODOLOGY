import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const mode = process.argv[2] ?? "all";

const roots =
  mode === "unit"
    ? ["tests/unit"]
    : mode === "integration"
    ? ["tests/integration"]
    : ["tests/unit", "tests/integration"];

function collectTests(dir) {
  const files = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...collectTests(fullPath));
      continue;
    }

    if (entry.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

const testFiles = roots.flatMap((root) => collectTests(root));

if (testFiles.length === 0) {
  console.error("No test files found.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...testFiles],
  { stdio: "inherit" }
);

process.exit(result.status ?? 1);

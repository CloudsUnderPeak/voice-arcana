// Run node --check across every .js/.mjs file in src/, test/, and tools/ instead of a single entry point.
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const roots = ["src", "test", "tools"];
const files = [];

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      walk(path);
    } else if (/\.(js|mjs)$/.test(entry)) {
      files.push(path);
    }
  }
}

roots.forEach(walk);

let failed = false;
for (const file of files) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    failed = true;
    console.error(`✗ ${file}`);
    console.error(String(error.stderr));
  }
}

if (failed) {
  process.exit(1);
}
console.log(`OK: ${files.length} files passed the syntax check`);

// Fails the build when user-facing copy breaks the house rules:
//   1. no em dash (U+2014), anywhere in source (strings, JSX text, comments);
//   2. no en dash used as an em dash (a spaced en dash); ranges such as 09:00 to 19:00 written with an en dash are fine;
//   3. no marketing filler words;
//   4. no exclamation mark ending a word inside a string or JSX text.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const DIRS = ["app", "lib", "data", "features", "components", "scripts", "tests"];
const EXT = /\.(ts|tsx|css|mjs|md)$/;
const SKIP = new Set(["node_modules", ".next", ".git", "screens"]);

const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);

const FILLER = [
  "seamless",
  "effortless",
  "unlock",
  "elevate",
  "revolutionis",
  "revolutioniz",
  "your journey",
  "like never before",
  "cutting-edge",
  "world-class",
  "game-chang",
];

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) yield* walk(path);
    else if (EXT.test(name)) yield path;
  }
}

const problems = [];
for (const dir of DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    // This file names the banned things on purpose.
    if (file.endsWith("check-copy.mjs")) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      const where = `${relative(ROOT, file)}:${i + 1}`;
      if (line.includes(EM_DASH)) problems.push(`${where}  em dash`);
      if (line.includes(` ${EN_DASH} `)) problems.push(`${where}  spaced en dash used as a dash`);
      const lower = line.toLowerCase();
      const isCode = /\.(tsx?|mjs)$/.test(file) && !/^\s*(\/\/|\*|\/\*)/.test(line);
      if (isCode) {
        for (const word of FILLER) {
          if (lower.includes(word)) problems.push(`${where}  filler word "${word}"`);
        }
      }
      if (isCode) {
        if (/["'`>][^"'`<>{}]*[A-Za-z]!(?![=\w])[^"'`<>{}]*["'`<]/.test(line)) {
          problems.push(`${where}  exclamation mark in copy`);
        }
      }
    });
  }
}

if (problems.length > 0) {
  console.error(
    `check-copy: ${problems.length} problem(s)\n` + problems.map((p) => "  " + p).join("\n")
  );
  process.exit(1);
}
console.log("check-copy: ok");

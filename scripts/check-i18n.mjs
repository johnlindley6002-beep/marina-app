// Checks the four dictionaries against each other:
//   1. every English key exists in pt, es and fr, and nothing extra is there;
//   2. no key is unused in the source;
//   3. pt, es and fr values that equal the English one are reviewed (proper
//      nouns and shared words go in scripts/i18n-same-as-english.json).
// The dictionaries are TypeScript, so they are transpiled to a temp folder with
// the TypeScript compiler that is already a dev dependency, then imported.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const out = join(tmpdir(), `aldock-i18n-${process.pid}`);
const SOURCE_DIRS = ["app", "features", "components", "lib", "data"];

function walk(dir, filter) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...walk(full, filter));
    else if (filter(full)) found.push(full);
  }
  return found;
}

function transpile(file) {
  const source = readFileSync(file, "utf8");
  let js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  js = js.replace(/from "(\.[^"]*)"/g, (_, spec) => {
    const target = resolve(dirname(file), spec);
    if (existsSync(`${target}.ts`)) return `from "${spec}.js"`;
    return `from "${spec}/index.js"`;
  });
  const dest = join(out, relative(root, file)).replace(/\.ts$/, ".js");
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, js);
}

const skip = ["lib/i18n/index.ts", "lib/i18n/marinaContent.ts"];
const i18nFiles = walk(
  join(root, "lib/i18n"),
  (f) => f.endsWith(".ts") && !skip.includes(relative(root, f).replaceAll("\\", "/"))
);
for (const f of i18nFiles) transpile(f);

const load = async (rel) => await import(pathToFileURL(join(out, rel)).href);
const en = (await load("lib/i18n/locales/en/index.js")).en;
const pt = (await load("lib/i18n/locales/pt/index.js")).pt;
const es = (await load("lib/i18n/locales/es/index.js")).es;
const fr = (await load("lib/i18n/locales/fr/index.js")).fr;
// The staff back office has its own dictionary in English and Portuguese only.
const staffEn = (await load("lib/i18n/staff/en.js")).staffEn;
const staffPt = (await load("lib/i18n/staff/pt.js")).staffPt;
rmSync(out, { recursive: true, force: true });

function flatten(value, prefix = "", into = new Map()) {
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, into);
  } else {
    into.set(prefix, value);
  }
  return into;
}

const base = flatten(en);
const staffBase = flatten(staffEn);
const locales = { pt: flatten(pt), es: flatten(es), fr: flatten(fr) };
const allow = JSON.parse(readFileSync(join(root, "scripts/i18n-same-as-english.json"), "utf8"));
const problems = [];

// Each translation against its English base: [name, base, translation].
const pairs = [
  ...Object.entries(locales).map(([name, map]) => [name, base, map]),
  ["staff pt", staffBase, flatten(staffPt)],
];

for (const [name, base, map] of pairs) {
  for (const key of base.keys()) {
    if (!map.has(key)) problems.push(`${name}: missing ${key}`);
  }
  for (const key of map.keys()) {
    if (!base.has(key)) problems.push(`${name}: extra key ${key} (not in en)`);
  }
  for (const [key, value] of map) {
    const english = base.get(key);
    if (typeof value === "string" && value === english && /[A-Za-z]{4}/.test(value)) {
      if (!allow.includes(key) && !allow.includes(value))
        problems.push(`${name}: same as English ${key} = "${value}"`);
    }
  }
}

const sources = SOURCE_DIRS.flatMap((d) =>
  walk(
    join(root, d),
    (f) => /\.(ts|tsx)$/.test(f) && !relative(root, f).replaceAll("\\", "/").startsWith("lib/i18n/")
  )
)
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");
for (const [prefix, keys] of [
  ["", base],
  ["staff ", staffBase],
]) {
  for (const key of keys.keys()) {
    const last = key.split(".").pop();
    // Keys such as "owner-away" are read by a computed index, so match them
    // as written in quotes too.
    const used = new RegExp(String.raw`\b${last}\b`).test(sources) || sources.includes(`"${last}"`);
    if (!used) problems.push(`unused ${prefix}key ${key}`);
  }
}

if (problems.length) {
  console.error(`check-i18n: ${problems.length} problem(s)`);
  const limit = Number(process.env.I18N_LIMIT ?? 60);
  for (const p of problems.slice(0, limit)) console.error("  " + p);
  if (problems.length > limit)
    console.error(`  ... and ${problems.length - limit} more (I18N_LIMIT=999 to see all)`);
  process.exit(1);
}
console.log(
  `check-i18n: ${base.size} keys in 4 locales and ${staffBase.size} staff keys in 2, all in step`
);

// Emits the default nanoKONTROL Studio script to disk and stdout so we can
// prove the generated Python is syntactically valid via `python3 -m py_compile`.
//
//   tsx scripts/emit-sample.ts [outDir]
//
// Writes every generated file under outDir (default /tmp/le-pupitre-out) and
// prints the main module to stdout.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { generateScript } from "../src/generator/python.ts";
import { NANOKONTROL_STUDIO, defaultMapping } from "../src/model/device.ts";

const outDir = process.argv[2] || "/tmp/le-pupitre-out";

const mapping = defaultMapping(NANOKONTROL_STUDIO);
const result = generateScript(mapping, NANOKONTROL_STUDIO);

for (const file of result.files) {
  const full = join(outDir, file.path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, file.content, "utf8");
}

process.stderr.write(`wrote ${result.files.length} files to ${outDir}\n`);
if (result.warnings.length) {
  process.stderr.write("warnings:\n" + result.warnings.map((w) => "  - " + w).join("\n") + "\n");
}
process.stdout.write(result.mainModule);

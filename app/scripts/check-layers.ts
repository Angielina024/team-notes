import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CORE_DIR = 'src/lib/notes';

// що ядру імпортувати не можна
const FORBIDDEN = [
  /(^|\/)server(\/|$)/, // $lib/server/…, ../server/…
  /^\$app\//,           // $app/environment, $app/forms…
  /^\$env\//,           // змінні оточення
  /^@sveltejs\/kit/,    // фреймворк
  /^postgres$/,         // база даних
];

// знаходить шлях у `import … from '…'` і `export … from '…'`
const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]/g;

// 1. усі .ts-файли теки, разом з підтеками
function sourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...sourceFiles(path));
    else if (name.endsWith('.ts')) files.push(path);
  }
  return files;
}

// 2–3. перевірити імпорти
const violations: string[] = [];
for (const file of sourceFiles(CORE_DIR)) {
  for (const match of readFileSync(file, 'utf8').matchAll(IMPORT_RE)) {
    const specifier = match[1] ?? '';
    if (FORBIDDEN.some((pattern) => pattern.test(specifier))) {
      violations.push(`${file} → ${specifier}`);
    }
  }
}

// 4. результат
if (violations.length > 0) {
  console.error(`Core must not depend on server code or the framework:\n${violations.join('\n')}`);
  process.exit(1);
}
console.log(`Layers OK: ${CORE_DIR} imports nothing from server code or the framework.`);

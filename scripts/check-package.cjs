const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const manifest = require(path.join(root, 'package.json'));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'quanta-fsrs-consumer-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

try {
  const [pack] = JSON.parse(execFileSync(npm, ['pack', '--offline', '--ignore-scripts', '--json', '--pack-destination', temporary], { cwd: root, encoding: 'utf8', env: { ...process.env, npm_config_cache: path.join(temporary, 'npm-cache') } }));
  const files = new Set(pack.files.map((file) => file.path));
  for (const required of ['package.json', 'README.md', 'LICENSE', 'dist/index.js', 'dist/index.mjs', 'dist/index.d.ts', 'dist/index.d.mts']) assert(files.has(required), `Missing packed file: ${required}`);
  for (const file of files) assert(/^(package\.json|README\.md|LICENSE|dist\/index\.(?:js|mjs|d\.ts|d\.mts))$/.test(file), `Unexpected packed file: ${file}`);
  const extracted = path.join(temporary, 'extracted');
  fs.mkdirSync(extracted);
  execFileSync('tar', ['-xzf', path.join(temporary, pack.filename), '-C', extracted]);
  const modules = path.join(temporary, 'node_modules');
  fs.mkdirSync(modules);
  fs.renameSync(path.join(extracted, 'package'), path.join(modules, manifest.name));
  const packed = require(path.join(modules, manifest.name, 'package.json'));
  for (const entry of [packed.main, packed.module, packed.types, ...Object.values(packed.exports['.'])]) assert(files.has(entry.replace(/^\.\//, '')), `Manifest points outside packed files: ${entry}`);
  assert.equal(packed.license, 'SEE LICENSE IN LICENSE');
  assert.match(fs.readFileSync(path.join(modules, manifest.name, 'LICENSE'), 'utf8'), /Quanta Non-Commercial License/);

  const common = `
const assert = require('node:assert/strict');
const api = require('quanta-fsrs');
const now = new Date('2026-11-20T12:00:00Z');
const result = api.scheduleFSRS(api.createNewCard('chapter-1'), api.Rating.Good, now);
assert.equal(result.card.reps, 1);
assert.equal(result.intervalDays, 3);
assert.equal(api.isDue(result.card, now), false);
assert.equal(api.VERSION, '${manifest.version}');
assert.equal(api.filterDue([api.createNewCard('new'), result.card], now).length, 1);
`;
  fs.writeFileSync(path.join(temporary, 'consumer.cjs'), common);
  fs.writeFileSync(path.join(temporary, 'consumer.mjs'), common.replace("const api = require('quanta-fsrs');", "import * as api from 'quanta-fsrs';").replace("const assert = require('node:assert/strict');", "import assert from 'node:assert/strict';"));
  for (const consumer of ['consumer.cjs', 'consumer.mjs']) execFileSync(process.execPath, [path.join(temporary, consumer)], { cwd: temporary, stdio: 'pipe' });

  const typed = `import { createNewCard, scheduleFSRS, Rating, type FSRSCard, type FSRSResult } from 'quanta-fsrs';\nconst card: FSRSCard = createNewCard('typed');\nconst result: FSRSResult = scheduleFSRS(card, Rating.Good);\nconst interval: number = result.intervalDays;\n`;
  for (const extension of ['cts', 'mts']) fs.writeFileSync(path.join(temporary, 'consumer.' + extension), typed);
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2020', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', path.join(temporary, 'consumer.cts'), path.join(temporary, 'consumer.mts')], { cwd: temporary, stdio: 'pipe' });
  console.log(`Packed ${manifest.name}@${manifest.version}: ${files.size} allowed files; CJS, ESM and both TypeScript consumers passed. No publication performed.`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}

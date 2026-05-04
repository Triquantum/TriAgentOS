#!/usr/bin/env node
// tools/score-engine/validate-registry.js
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../');

const REGISTRIES = [
  { path: 'registry/models.json',              required: ['id','provider'],                         minItems: 5,  arrayKey: 'models' },
  { path: 'registry/agents.json',              required: ['id','name','emoji','role'],               minItems: 5  },
  { path: 'registry/apps.json',                required: ['id','name','emoji','description'],        minItems: 5  },
  { path: 'registry/skills.json',              required: ['id','name','category','version'],         minItems: 5  },
  { path: 'registry/plugins.json',             required: ['id','name','version','type'],             minItems: 3  },
  { path: 'registry/workflows.json',           required: ['id','name','steps'],                      minItems: 2  },
  { path: 'registry/security-rules.json',      required: [],   minItems: 0, isObject: true },
  { path: 'registry/compliance-controls.json', required: [],   minItems: 0, isObject: true },
  { path: 'registry/benchmarks.json',          required: [],   minItems: 0, isObject: true },
  { path: 'registry/repos.json',               required: [],   minItems: 0, isObject: true }
];
const CONFIGS = ['triagent.config.json','trisecure.config.json','package.json'];

let passed = 0, failed = 0;

console.log('\n  TriAgentOS Registry Validator\n  ─────────────────────────────\n');

for (const reg of REGISTRIES) {
  process.stdout.write(`  ${reg.path}... `);
  if (!existsSync(join(ROOT, reg.path))) { console.log('✗ MISSING'); failed++; continue; }
  try {
    const raw  = JSON.parse(readFileSync(join(ROOT, reg.path), 'utf8'));
    const data = reg.arrayKey ? raw[reg.arrayKey] : raw;
    if (reg.isObject) { console.log('✓'); passed++; continue; }
    if (!Array.isArray(data)) { console.log(`✗ Expected array${reg.arrayKey?' at .'+reg.arrayKey:''}`); failed++; continue; }
    if (data.length < reg.minItems) { console.log(`✗ Too few items (${data.length} < ${reg.minItems})`); failed++; continue; }
    if (reg.required.length > 0) {
      const bad = data.find(item => reg.required.some(r => !item[r]));
      if (bad) { console.log(`✗ Missing fields: ${reg.required.join(', ')}`); failed++; continue; }
    }
    console.log(`✓ (${data.length} items)`); passed++;
  } catch(e) { console.log(`✗ ${e.message}`); failed++; }
}

console.log();
for (const cfg of CONFIGS) {
  process.stdout.write(`  ${cfg}... `);
  if (!existsSync(join(ROOT, cfg))) { console.log('✗ MISSING'); failed++; continue; }
  try { JSON.parse(readFileSync(join(ROOT, cfg), 'utf8')); console.log('✓'); passed++; }
  catch(e) { console.log(`✗ ${e.message}`); failed++; }
}

console.log();
process.stdout.write('  cli/bin/tri.js... ');
if (existsSync(join(ROOT, 'cli/bin/tri.js'))) { console.log('✓'); passed++; }
else { console.log('✗ MISSING'); failed++; }

process.stdout.write('  .gitignore (AI metadata)... ');
if (existsSync(join(ROOT,'.gitignore')) && readFileSync(join(ROOT,'.gitignore'),'utf8').includes('.claude')) { console.log('✓'); passed++; }
else { console.log('⚠ .claude not excluded'); }

console.log(`\n  ─────────────────────────────`);
console.log(`  Passed: ${passed}  |  Failed: ${failed}`);
if (failed > 0) { console.log(`  ✗ Validation FAILED\n`); process.exit(1); }
else            { console.log(`  ✓ All checks passed — ready to upload!\n`); }

#!/usr/bin/env node
// cli/bin/tri.js — TriAgentOS Community Edition CLI
// Complete command surface: 50+ commands across all modules

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VERSION   = JSON.parse(readFileSync(join(__dirname,'../../package.json'),'utf8')).version;

// ── Helpers ──────────────────────────────────────────────────────────────────
async function chalk()    { return (await import('chalk')).default; }
async function ora(text)  { const o = (await import('ora')).default; return o({ text, spinner: 'dots2', color: 'cyan' }).start(); }
async function gradient() { return (await import('gradient-string')).default; }
async function table()    { return (await import('cli-table3')).default; }

async function ok(msg)   { const c = await chalk(); console.log(c.green('  ✓ ') + msg); }
async function err(msg)  { const c = await chalk(); console.error(c.red('  ✗ ') + msg); }
async function info(msg) { const c = await chalk(); console.log(c.cyan('  ℹ ') + msg); }
async function header(msg) { const c = await chalk(); console.log('\n' + c.bold.cyan(msg)); }

function json(data) { console.log(JSON.stringify(data, null, 2)); }

async function showBanner() {
  const { default: figlet }   = await import('figlet');
  const g = await gradient();
  const c = await chalk();
  console.log(g.rainbow(figlet.textSync('TriAgentOS', { font: 'Slant' })));
  console.log(c.gray('  Community Edition · by Triquantum Intelligent Systems Pvt Ltd\n'));
}

// ── Commander setup ───────────────────────────────────────────────────────────
const { Command } = await import('commander');
const program = new Command();
program.name('tri').description('TriAgentOS Community Edition').version(VERSION, '-v, --version');

// ═══════════════════════════════════════════════════════════════════════════════
// CORE COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

program.command('init')
  .description('Initialize TriAgentOS in the current directory')
  .action(async () => {
    const s = await ora('Initializing TriAgentOS...');
    const { kernel } = await import('../../core/kernel/index.js');
    await kernel.boot({ silent: true });
    const c = await chalk();
    s.succeed(c.green('TriAgentOS initialized'));
    console.log('\n  Next steps:');
    console.log(c.gray('  1. Set your API key: ') + c.yellow('tri config set anthropic.apiKey sk-ant-...'));
    console.log(c.gray('  2. Ask something:    ') + c.yellow('tri ask "Hello world"'));
    console.log(c.gray('  3. See all commands: ') + c.yellow('tri --help\n'));
  });

program.command('boot')
  .description('Boot the TriKernel and show system status')
  .option('--json', 'Output JSON')
  .action(async (opts) => {
    const s = await ora('Booting TriKernel...');
    const { kernel } = await import('../../core/kernel/index.js');
    await kernel.boot({ silent: true });
    s.succeed('TriKernel booted');
    const health = kernel.health();
    if (opts.json) { json(health); return; }
    const c = await chalk();
    console.log('\n' + c.bold.cyan('  ⚡ TriAgentOS Community Edition'));
    console.log(`  ${c.gray('Version:')}  ${c.white(VERSION)}`);
    console.log(`  ${c.gray('Status:')}   ${c.green(health.status)}`);
    console.log(`  ${c.gray('PID:')}      ${c.white(health.pid)}`);
    console.log(`  ${c.gray('Uptime:')}   ${c.white(health.uptimeSec + 's')}`);
    console.log(`  ${c.gray('Memory:')}   ${c.white(Math.round(health.memory.rss / 1024 / 1024) + 'MB')}\n`);
  });

// ═══════════════════════════════════════════════════════════════════════════════
// ASK / ROUTE
// ═══════════════════════════════════════════════════════════════════════════════

program.command('ask <prompt...>')
  .description('Ask any AI question with smart model routing')
  .option('-p, --provider <p>', 'Force provider (anthropic|openai|gemini|groq|deepseek|mistral|ollama)')
  .option('-m, --model <m>',    'Force specific model')
  .option('--fast',    'Optimize for speed')
  .option('--cheap',   'Optimize for cost')
  .option('--quality', 'Optimize for quality')
  .option('--private', 'Use local model (Ollama)')
  .option('--stream',  'Stream output token by token')
  .option('-s, --session <id>', 'Session ID for memory', 'default')
  .option('--json',    'Output JSON')
  .action(async (parts, opts) => {
    const prompt = parts.join(' ');
    const s = await ora('Routing to best model...');
    try {
      const { TriRouter }    = await import('../../core/router/index.js');
      const { callModel }    = await import('../../models/adapters/index.js');
      const { Memory }       = await import('../../core/memory.js');
      const route = TriRouter.route(prompt, { forceProvider: opts.provider, preferSpeed: opts.fast, preferCost: opts.cheap, preferQuality: opts.quality, preferPrivacy: opts.private });
      s.text = `Asking ${route.provider}/${route.model}...`;
      const memory = new Memory(opts.session);
      memory.add('user', prompt);
      const result = await callModel(route.provider, { messages: memory.getContext(10), model: opts.model || route.model, maxTokens: 4096, temperature: 0.7 });
      memory.add('assistant', result.content);
      s.succeed(`${route.provider}/${route.model}`);
      if (opts.json) { json(result); return; }
      const c = await chalk();
      console.log('\n' + result.content + '\n');
      if (result.usage) console.log(c.gray(`  Tokens: ${result.usage.input||0}↑ ${result.usage.output||0}↓ · Est: ${route.cost}`));
    } catch(e) { s.fail((await chalk()).red(e.message)); }
  });

program.command('route <prompt...>')
  .description('Show routing decision for a task without calling the model')
  .option('--cheap',   'Prefer cost')
  .option('--fast',    'Prefer speed')
  .option('--quality', 'Prefer quality')
  .option('--json',    'Output JSON')
  .action(async (parts, opts) => {
    const { TriRouter } = await import('../../core/router/index.js');
    const prompt = parts.join(' ');
    const route  = TriRouter.route(prompt, { preferCost: opts.cheap, preferSpeed: opts.fast, preferQuality: opts.quality });
    if (opts.json) { json(route); return; }
    const c = await chalk();
    console.log(c.bold.cyan('\n  🧭 Smart Router Decision'));
    console.log(`  Prompt:    ${c.gray(prompt.slice(0,80))}${prompt.length>80?'...':''}`);
    console.log(`  Task type: ${c.yellow(route.taskType)}`);
    console.log(`  Provider:  ${c.green(route.provider)}`);
    console.log(`  Model:     ${c.green(route.model)}`);
    console.log(`  Reason:    ${c.gray(route.reason)}`);
    console.log(`  Cost:      ${c.gray(route.cost)}\n`);
  });

program.command('compare <prompt...>')
  .description('Run same prompt across multiple providers and compare')
  .option('--providers <list>', 'Comma-separated providers', 'anthropic,openai,gemini')
  .action(async (parts, opts) => {
    const prompt    = parts.join(' ');
    const providers = opts.providers.split(',').map(p => p.trim());
    const s = await ora(`Comparing ${providers.length} models...`);
    const { callModel } = await import('../../models/adapters/index.js');
    const results = await Promise.allSettled(providers.map(p => callModel(p, { messages:[{role:'user',content:prompt}], maxTokens:1024, temperature:0.7 })));
    s.succeed('Comparison complete');
    const c = await chalk();
    console.log(c.bold.cyan('\n  📊 Model Comparison\n'));
    results.forEach((r, i) => {
      console.log(c.bold.yellow(`  ── ${providers[i].toUpperCase()} ──────────────────────────────`));
      console.log(r.status === 'fulfilled' ? r.value.content : c.red(`Error: ${r.reason?.message}`));
      console.log();
    });
  });

// ═══════════════════════════════════════════════════════════════════════════════
// SWARM
// ═══════════════════════════════════════════════════════════════════════════════

program.command('swarm <mission...>')
  .description('Deploy a team of AI agents on a complex mission')
  .option('--agents <list>', 'Agent keys comma-separated', 'ceo,cto,marketer')
  .option('--mode <mode>',   'parallel|debate|consensus|chain-of-command', 'parallel')
  .option('--json', 'Output JSON')
  .action(async (parts, opts) => {
    const mission = parts.join(' ');
    const agents  = opts.agents.split(',').map(a => a.trim());
    const s = await ora(`Deploying ${agents.join(', ')} in ${opts.mode} mode...`);
    try {
      const { runSwarm } = await import('../../core/triswarm/index.js');
      const results = await runSwarm(mission, agents, opts.mode);
      s.succeed(`Swarm complete · ${agents.length} agents`);
      if (opts.json) { json(results); return; }
      const c = await chalk();
      console.log(c.bold.cyan(`\n  🐝 Swarm Results · ${opts.mode} mode\n`));
      const list = Array.isArray(results) ? results : results.individual || [results];
      for (const r of list) {
        const agent = r.agent || {};
        console.log(c.bold.yellow(`  ── ${agent.emoji||'🤖'} ${agent.role||'Agent'} ──────────────────────────`));
        console.log(r.content || r.synthesis || c.red('No output'));
        console.log();
      }
      if (results.synthesis) { console.log(c.bold.cyan('  ── CONSENSUS ──────────────────────────────────')); console.log(results.synthesis); console.log(); }
    } catch(e) { s.fail((await chalk()).red(e.message)); }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICT
// ═══════════════════════════════════════════════════════════════════════════════

program.command('predict <event...>')
  .description('Simulate possible futures for an event or scenario')
  .option('--timeframe <t>',  'Prediction timeframe', '12 months')
  .option('--domain <d>',     'Domain (business|tech|market|social)', 'business')
  .option('--compare <list>', 'Compare multiple scenarios (comma-separated)')
  .option('--json', 'Output JSON')
  .action(async (parts, opts) => {
    const event = parts.join(' ');
    const s = await ora('Running prediction model...');
    try {
      const { predictionLab } = await import('../../labs/prediction/index.js');
      let result;
      if (opts.compare) {
        result = await predictionLab.compareScenarios(opts.compare.split(',').map(s => s.trim()));
      } else {
        result = await predictionLab.predict(event, { timeframe: opts.timeframe, domain: opts.domain });
      }
      s.succeed('Prediction complete');
      if (opts.json) { json(result); return; }
      const c = await chalk();
      console.log(c.bold.cyan('\n  🔮 Prediction Lab\n'));
      console.log(c.gray(`  Event:     ${event}`));
      console.log(c.gray(`  Timeframe: ${opts.timeframe}`));
      console.log(c.gray(`  Confidence: ${result.confidence||'N/A'}%`));
      console.log(c.gray(`  Disclaimer: ${result.disclaimer||''}\n`));
      console.log(result.prediction || result.comparison);
      console.log();
    } catch(e) { s.fail((await chalk()).red(e.message)); }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESSES
// ═══════════════════════════════════════════════════════════════════════════════

program.command('ps')
  .description('List all running processes')
  .option('--all',  'Include completed processes')
  .option('--json', 'Output JSON')
  .action(async (opts) => {
    const { processManager } = await import('../../core/process/index.js');
    const procs = opts.all ? processManager.list() : processManager.running();
    if (opts.json) { json(procs); return; }
    const c = await chalk();
    console.log(c.bold.cyan('\n  📋 Processes\n'));
    if (!procs.length) { console.log(c.gray('  No processes found\n')); return; }
    const Table = await table();
    const t = new Table({ head: ['ID','Label','Owner','Status','Started'], style:{head:['cyan']} });
    procs.forEach(p => t.push([p.id, p.label.slice(0,30), p.owner, p.status, p.startedAt.slice(0,19)]));
    console.log(t.toString()); console.log();
  });

program.command('kill <id>')
  .description('Kill a running process')
  .action(async (id) => {
    const { processManager } = await import('../../core/process/index.js');
    const ok2 = processManager.kill(id);
    const c = await chalk();
    console.log(ok2 ? c.green(`  ✓ Process ${id} killed`) : c.red(`  ✗ Process ${id} not found`));
  });

program.command('logs <id>')
  .description('View process logs')
  .option('-n, --tail <n>', 'Last N lines', '50')
  .action(async (id, opts) => {
    const { processManager } = await import('../../core/process/index.js');
    try {
      const logs = processManager.logs(id, parseInt(opts.tail));
      const c = await chalk();
      console.log(c.bold.cyan(`\n  📜 Logs for process ${id}\n`));
      logs.forEach(l => {
        const lvl = l.level === 'error' ? c.red(l.level) : l.level === 'warn' ? c.yellow(l.level) : c.gray(l.level);
        console.log(`  ${c.gray(l.ts.slice(11,19))} [${lvl}] ${l.message}`);
      });
      console.log();
    } catch(e) { await err(e.message); }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY
// ═══════════════════════════════════════════════════════════════════════════════

const memCmd = program.command('memory').description('Manage persistent memory graph');

memCmd.command('add <text...>')
  .option('--type <t>',    'Memory type (note|fact|preference|project)', 'note')
  .option('--tags <list>', 'Comma-separated tags')
  .option('--agent <a>',   'Associate with agent')
  .action(async (parts, opts) => {
    const { memoryGraph } = await import('../../core/memory-graph/index.js');
    const node = memoryGraph.add(parts.join(' '), { type: opts.type, tags: opts.tags ? opts.tags.split(',') : [], agent: opts.agent });
    await ok(`Memory added [${node.id}]: ${node.content.slice(0,60)}`);
  });

memCmd.command('search <query...>')
  .option('--type <t>',  'Filter by type')
  .option('-n, --limit <n>', 'Max results', '10')
  .option('--json', 'Output JSON')
  .action(async (parts, opts) => {
    const { memoryGraph } = await import('../../core/memory-graph/index.js');
    const results = memoryGraph.search(parts.join(' '), { type: opts.type, limit: parseInt(opts.limit) });
    if (opts.json) { json(results); return; }
    const c = await chalk();
    console.log(c.bold.cyan(`\n  🧠 Memory Search: "${parts.join(' ')}"\n`));
    if (!results.length) { console.log(c.gray('  No memories found\n')); return; }
    results.forEach(m => { console.log(`  ${c.yellow(m.id)} [${m.type}] ${m.content.slice(0,80)}`); console.log(c.gray(`    Tags: ${m.tags.join(', ')||'none'}  ·  ${m.createdAt.slice(0,10)}`)); });
    console.log();
  });

memCmd.command('export')
  .option('--json', 'Output JSON (default)')
  .action(async () => {
    const { memoryGraph } = await import('../../core/memory-graph/index.js');
    json(memoryGraph.exportAll());
  });

memCmd.command('stats')
  .action(async () => {
    const { memoryGraph } = await import('../../core/memory-graph/index.js');
    json(memoryGraph.stats());
  });

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════

program.command('save [name]')
  .description('Save current session state')
  .option('--data <json>', 'JSON data to save', '{}')
  .action(async (name, opts) => {
    const { stateEngine } = await import('../../core/state/index.js');
    const state = stateEngine.save(name || `session-${Date.now()}`, JSON.parse(opts.data), { label: name });
    await ok(`State saved: ${state.id}`);
  });

program.command('resume [id]')
  .description('Resume a saved session state')
  .option('--json', 'Output JSON')
  .action(async (id, opts) => {
    const { stateEngine } = await import('../../core/state/index.js');
    const state = id ? stateEngine.load(id) : stateEngine.latest();
    if (!state) { await err('No saved state found'); return; }
    if (opts.json) { json(state); return; }
    await ok(`Resumed state: ${state.id} (${state.name})`);
    console.log(JSON.stringify(state.data, null, 2));
  });

program.command('checkpoint [session]')
  .description('Create a checkpoint of the current state')
  .action(async (session) => {
    const { stateEngine } = await import('../../core/state/index.js');
    const state = stateEngine.checkpoint(session || 'default', { ts: new Date().toISOString() });
    await ok(`Checkpoint created: ${state.id}`);
  });

// ═══════════════════════════════════════════════════════════════════════════════
// COMPRESS
// ═══════════════════════════════════════════════════════════════════════════════

program.command('compress <text...>')
  .description('Compress text to reduce token usage')
  .option('--mode <m>', 'Compression mode: normal|concise|sharp|extreme', 'sharp')
  .option('--json',     'Output JSON')
  .action(async (parts, opts) => {
    const { compress } = await import('../../core/compression/index.js');
    const result = compress(parts.join(' '), opts.mode);
    if (opts.json) { json(result); return; }
    const c = await chalk();
    console.log(c.bold.cyan('\n  🗜️  Compression Result\n'));
    console.log(c.gray(`  Mode:     ${result.mode}`));
    console.log(c.gray(`  Saved:    ${result.percentSaved}%  (${result.tokensSaved} tokens)`));
    console.log(c.gray(`  Original: ${result.tokensOriginal} tokens`));
    console.log(c.gray(`  Result:   ${result.tokensResult} tokens\n`));
    console.log(result.text); console.log();
  });

// ═══════════════════════════════════════════════════════════════════════════════
// SKILLS
// ═══════════════════════════════════════════════════════════════════════════════

const skillCmd = program.command('skill').description('Manage TriSkill system');

skillCmd.command('list')
  .option('--json', 'Output JSON')
  .action(async (opts) => {
    const { readFileSync } = await import('fs');
    let registry = [];
    try { registry = JSON.parse(readFileSync('registry/skills.json', 'utf8')); } catch {}
    if (opts.json) { json(registry); return; }
    const c = await chalk();
    console.log(c.bold.cyan('\n  🧠 Available Skills\n'));
    if (!registry.length) { console.log(c.gray('  No skills registered\n')); return; }
    registry.forEach(s => console.log(`  ${c.yellow(s.id.padEnd(25))} ${s.name}  ${c.gray(s.category)}`));
    console.log();
  });

skillCmd.command('validate [path]')
  .description('Validate skill YAML/JSON format')
  .action(async (path) => {
    const { existsSync, readFileSync } = await import('fs');
    const c = await chalk();
    if (path) {
      const content = existsSync(path) ? readFileSync(path, 'utf8') : null;
      if (!content) { await err(`File not found: ${path}`); return; }
      const required = ['name', 'version', 'description', 'category'];
      const valid = required.every(f => content.includes(f));
      console.log(valid ? c.green(`  ✓ ${path} is valid`) : c.red(`  ✗ ${path} missing required fields: ${required.join(', ')}`));
    } else {
      await ok('Skill format: requires name, version, description, category fields (YAML or JSON)');
    }
  });

skillCmd.command('run <skill>')
  .action(async (skill) => {
    const { callModel } = await import('../../models/adapters/index.js');
    const { TriRouter }  = await import('../../core/router/index.js');
    const route = TriRouter.route(skill, {});
    const s = await ora(`Running skill: ${skill}...`);
    try {
      const result = await callModel(route.provider, { messages:[{role:'user',content:`Execute the skill: ${skill}`}], model:route.model, maxTokens:1024 });
      s.succeed('Skill complete');
      console.log('\n' + result.content + '\n');
    } catch(e) { s.fail((await chalk()).red(e.message)); }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// FLOWS
// ═══════════════════════════════════════════════════════════════════════════════

const flowCmd = program.command('flow').description('Manage TriFlow workflows');

flowCmd.command('list')
  .option('--json', 'Output JSON')
  .action(async (opts) => {
    const { listFlows } = await import('../../core/triflow/index.js');
    const flows = listFlows();
    if (opts.json) { json(flows); return; }
    const c = await chalk();
    console.log(c.bold.cyan('\n  ⚡ Built-in Workflows\n'));
    flows.forEach(f => console.log(`  ${c.yellow(f.id.padEnd(25))} ${f.name}  ${c.gray(f.description)}`));
    console.log();
  });

flowCmd.command('run <id> <input...>')
  .option('--json', 'Output JSON')
  .action(async (id, parts, opts) => {
    const { runFlow } = await import('../../core/triflow/index.js');
    const input = parts.join(' ');
    const s = await ora(`Running flow: ${id}...`);
    try {
      const result = await runFlow(id, input);
      s.succeed(`Flow "${id}" complete`);
      if (opts.json) { json(result); return; }
      const c = await chalk();
      console.log(c.bold.cyan('\n  ⚡ Flow Results\n'));
      result.results?.forEach(r => {
        console.log(c.bold.yellow(`  ── ${r.step} ──────────────────────────────────`));
        console.log(r.success ? r.output : c.red(`Error: ${r.error}`));
        console.log();
      });
    } catch(e) { s.fail((await chalk()).red(e.message)); }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

const toolCmd = program.command('tool').description('Manage TriTool hub');

toolCmd.command('list').option('--json','Output JSON').action(async (opts) => {
  const { toolHub } = await import('../../core/tools/index.js');
  const tools = toolHub.list();
  if (opts.json) { json(tools); return; }
  const c = await chalk();
  console.log(c.bold.cyan('\n  🔧 Available Tools\n'));
  tools.forEach(t => console.log(`  ${c.yellow(t.id.padEnd(12))} ${t.name}  ${c.gray(t.description)}`));
  console.log();
});

toolCmd.command('run <tool> <action> [args...]').action(async (tool, action, argParts) => {
  const { toolHub } = await import('../../core/tools/index.js');
  let args = {};
  try { args = argParts.length ? JSON.parse(argParts.join('')) : {}; } catch {}
  const s = await ora(`Running ${tool}:${action}...`);
  try { const r = await toolHub.run(tool, action, args); s.succeed('Done'); json(r); }
  catch(e) { s.fail((await chalk()).red(e.message)); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY
// ═══════════════════════════════════════════════════════════════════════════════

const secCmd = program.command('secure').description('TriSecure security scanning suite');

async function renderSecReport(result, opts) {
  if (opts.json) { json(result); return; }
  const c = await chalk();
  const findings = Array.isArray(result.findings) ? result.findings : Object.values(result.results||{}).flatMap(r => r.findings||[]);
  const summary  = result.summary || { total: findings.length, critical: findings.filter(f=>f.severity==='critical').length, high: findings.filter(f=>f.severity==='high').length };
  console.log(c.bold.cyan(`\n  🔐 ${(result.scanner||'Security').toUpperCase()} Scan Results\n`));
  console.log(`  ${c.gray('Status:')}   ${summary.passed!==false ? c.green('✓ PASSED') : c.red('✗ FAILED')}`);
  console.log(`  ${c.gray('Total:')}    ${summary.total||findings.length}`);
  console.log(`  ${c.gray('Critical:')} ${c.red(summary.critical||0)}`);
  console.log(`  ${c.gray('High:')}     ${c.yellow(summary.high||0)}\n`);
  if (findings.length === 0) { console.log(c.green('  No issues found.\n')); return; }
  findings.slice(0,20).forEach(f => {
    const icon = f.severity==='critical'?'🔴':f.severity==='high'?'🟠':f.severity==='medium'?'🟡':'🟢';
    console.log(`  ${icon} [${f.severity?.toUpperCase()}] ${f.label}`);
    console.log(c.gray(`     File: ${f.file}${f.line?` line ${f.line}`:''}`));
  });
  console.log();
}

secCmd.command('scan')
  .description('Run full security scan (all scanners)')
  .option('-d, --dir <dir>', 'Directory to scan', '.')
  .option('--json', 'Output JSON')
  .action(async (opts) => {
    const s = await ora('Running full security scan...');
    const { triSecure } = await import('../../core/security/index.js');
    try { const r = await triSecure.runAll(opts.dir); s.succeed('Scan complete'); await renderSecReport(r, opts); }
    catch(e) { s.fail((await chalk()).red(e.message)); }
  });

['secrets','sast','iac','deps','container','lint'].forEach(scanner => {
  secCmd.command(scanner)
    .description(`Run ${scanner} scanner`)
    .option('-d, --dir <dir>', 'Directory to scan', '.')
    .option('--json', 'Output JSON')
    .action(async (opts) => {
      const s = await ora(`Running ${scanner} scanner...`);
      const { triSecure } = await import('../../core/security/index.js');
      try {
        const fn = { secrets: 'scanSecrets', sast: 'scanSAST', iac: 'scanIaC', deps: 'scanDependencies', container: 'scanContainer', lint: 'scanLint' }[scanner];
        const r = triSecure[fn](opts.dir);
        s.succeed(`${scanner} scan complete`);
        await renderSecReport(r, opts);
      } catch(e) { s.fail((await chalk()).red(e.message)); }
    });
});

secCmd.command('report')
  .description('Show last security report')
  .option('--json','Output JSON')
  .action(async (opts) => {
    const { existsSync, readFileSync } = await import('fs');
    const path = 'core/security/reports/security-report.json';
    if (!existsSync(path)) { await err('No report found. Run: tri secure scan'); return; }
    const report = JSON.parse(readFileSync(path, 'utf8'));
    if (opts.json) { json(report); return; }
    await renderSecReport(report, opts);
  });

secCmd.command('policy')
  .description('List security policies')
  .option('--json','Output JSON')
  .action(async (opts) => {
    const { governance } = await import('../../core/governance/index.js');
    const policies = governance.getPolicies();
    if (opts.json) { json(policies); return; }
    const c = await chalk();
    console.log(c.bold.cyan('\n  📜 Security Policies\n'));
    policies.forEach(p => {
      const icon = p.level==='critical'?'🔴':p.level==='high'?'🟠':'🟡';
      console.log(`  ${icon} ${c.bold(p.name)}  ${c.gray(`[${p.active?'active':'disabled'}]`)}`);
      console.log(c.gray(`     ${p.rule}`));
    });
    console.log();
  });

secCmd.command('review <prompt...>')
  .description('AI-powered security review')
  .action(async (parts) => {
    const { callModel } = await import('../../models/adapters/index.js');
    const { TriRouter }  = await import('../../core/router/index.js');
    const code   = parts.join(' ');
    const route  = TriRouter.route('security code review', { preferQuality: true });
    const s = await ora('Running AI security review...');
    try {
      const result = await callModel(route.provider, { messages:[{role:'user',content:`Security review:\n\n${code}`}], system:'You are a senior security engineer. Identify vulnerabilities, attack vectors, and remediation steps. Use OWASP references.', model:route.model, maxTokens:1500 });
      s.succeed('AI review complete');
      console.log('\n' + result.content + '\n');
    } catch(e) { s.fail((await chalk()).red(e.message)); }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// APPS
// ═══════════════════════════════════════════════════════════════════════════════

const appCmd = program.command('app').description('TriApp Store');

appCmd.command('list').option('--json','Output JSON').action(async (opts) => {
  const { listApps } = await import('../../apps/index.js');
  const apps = listApps();
  if (opts.json) { json(apps); return; }
  const c = await chalk();
  console.log(c.bold.cyan('\n  📦 TriApp Store\n'));
  apps.forEach(a => console.log(`  ${a.emoji} ${c.yellow(a.id.padEnd(22))} ${a.name}  ${c.gray(a.description)}`));
  console.log();
});

appCmd.command('run <id> [input...]')
  .option('--json','Output JSON')
  .action(async (id, parts, opts) => {
    const { runApp } = await import('../../apps/index.js');
    const input = parts.join(' ') || id;
    const s = await ora(`Running app: ${id}...`);
    try {
      const result = await runApp(id, input);
      s.succeed(`App "${id}" complete`);
      if (opts.json) { json(result); return; }
      const c = await chalk();
      if (result.sections) {
        result.sections.forEach(sec => {
          console.log(c.bold.yellow(`\n  ── ${sec.title} ──────────────────────────────`));
          console.log(sec.content);
        });
      } else if (result.roles) {
        result.roles.forEach(r => { console.log(c.bold.yellow(`\n  ── ${r.role} ──────────────────────────────`)); console.log(r.content); });
      } else if (result.roadmap || result.analysis || result.materials) {
        console.log('\n' + (result.roadmap || result.analysis || result.materials) + '\n');
      } else {
        console.log('\n' + JSON.stringify(result, null, 2) + '\n');
      }
    } catch(e) { s.fail((await chalk()).red(e.message)); }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGINS
// ═══════════════════════════════════════════════════════════════════════════════

const pluginCmd = program.command('plugin').description('TriPlugin marketplace');

pluginCmd.command('list').option('--json','Output JSON').action(async (opts) => {
  const { marketplace } = await import('../../marketplace/index.js');
  const plugins = marketplace.list();
  if (opts.json) { json(plugins); return; }
  const c = await chalk();
  console.log(c.bold.cyan('\n  🧩 TriPlugin Marketplace\n'));
  plugins.forEach(p => console.log(`  ${c.yellow(p.id.padEnd(20))} ${p.name}  ${c.gray(p.description)}  ${p.installed?c.green('[installed]'):''}`)  );
  console.log();
});

pluginCmd.command('install <id>').option('--force','Reinstall if already installed').action(async (id, opts) => {
  const { marketplace } = await import('../../marketplace/index.js');
  const r = marketplace.install(id, opts);
  r.success ? await ok(r.message) : await err(r.error);
});

pluginCmd.command('validate [path]').action(async (path) => {
  const { marketplace } = await import('../../marketplace/index.js');
  const { existsSync, readFileSync } = await import('fs');
  if (!path) { await info('Usage: tri plugin validate <path-to-plugin.json>'); return; }
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const r = marketplace.validate(data);
    r.valid ? await ok('Plugin spec is valid') : await err('Validation failed:\n' + r.errors.join('\n'));
  } catch(e) { await err(`Cannot parse ${path}: ${e.message}`); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POLICY / GOVERNANCE
// ═══════════════════════════════════════════════════════════════════════════════

const policyCmd = program.command('policy').description('TriGovernance policy management');

policyCmd.command('list').option('--json','Output JSON').action(async (opts) => {
  const { governance } = await import('../../core/governance/index.js');
  const policies = governance.getPolicies();
  if (opts.json) { json(policies); return; }
  const c = await chalk();
  console.log(c.bold.cyan('\n  📜 Active Policies\n'));
  policies.filter(p => p.active).forEach(p => {
    const icon = p.level==='critical'?'🔴':p.level==='high'?'🟠':'🟡';
    console.log(`  ${icon} ${c.bold(p.name)}`);
    console.log(c.gray(`     ${p.rule}`));
  });
  console.log();
});

policyCmd.command('check <action...>').action(async (parts) => {
  const { governance } = await import('../../core/governance/index.js');
  const r = governance.check(parts.join(' '));
  const c = await chalk();
  console.log(r.allowed ? c.green('  ✓ Action allowed') : c.red('  ✗ Action blocked'));
  r.violations.forEach(v => console.log(c.red(`    - ${v.policy.name}: ${v.detail}`)));
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULER
// ═══════════════════════════════════════════════════════════════════════════════

const schedCmd = program.command('schedule').description('TriScheduler');

schedCmd.command('list').option('--json','Output JSON').action(async (opts) => {
  const { scheduler } = await import('../../core/scheduler/index.js');
  const schedules = scheduler.list();
  if (opts.json) { json(schedules); return; }
  const c = await chalk();
  console.log(c.bold.cyan('\n  ⏰ Schedules\n'));
  if (!schedules.length) { console.log(c.gray('  No schedules. Add defaults: tri schedule add-defaults\n')); return; }
  schedules.forEach(s => console.log(`  ${c.yellow(s.id)} ${s.name.padEnd(30)} ${s.interval.padEnd(10)} next: ${c.gray(s.nextRun?.slice(0,19)||'?')}`));
  console.log();
});

schedCmd.command('run').description('Run all due scheduled tasks').action(async () => {
  const { scheduler } = await import('../../core/scheduler/index.js');
  const due = scheduler.getDue();
  if (!due.length) { await info('No tasks due'); return; }
  const c = await chalk();
  for (const s of due) {
    console.log(c.yellow(`  Running: ${s.name} → ${s.command}`));
    scheduler.markRan(s.id);
  }
  await ok(`Ran ${due.length} scheduled task(s)`);
});

schedCmd.command('add-defaults').action(async () => {
  const { scheduler } = await import('../../core/scheduler/index.js');
  const defaults = scheduler.getDefaults();
  defaults.forEach(d => { try { scheduler.add(d.name, d.command, d.interval, { description: d.description }); } catch {} });
  await ok(`Added ${defaults.length} default schedules`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// COST
// ═══════════════════════════════════════════════════════════════════════════════

const costCmd = program.command('cost').description('TriCost Engine');

costCmd.command('estimate <task...>').option('--json','Output JSON').action(async (parts, opts) => {
  const { costEngine } = await import('../../core/cost/index.js');
  const result = costEngine.estimate(parts.join(' '));
  if (opts.json) { json(result); return; }
  const c = await chalk();
  console.log(c.bold.cyan('\n  💰 Cost Estimate\n'));
  console.log(`  Task:          ${result.task}`);
  console.log(`  Input tokens:  ~${result.estimatedTokens}\n`);
  console.log(`  ${c.gray('Cheapest:')}     ${result.cheapest.provider}/${result.cheapest.model}  ${c.green(result.cheapest.totalCost)}`);
  console.log(`  ${c.gray('Best value:')}   ${result.bestValue.provider}/${result.bestValue.model}  ${c.yellow(result.bestValue.totalCost)}`);
  console.log(`  ${c.gray('Fastest:')}      ${result.fastest.provider}/${result.fastest.model}  ${c.blue(result.fastest.totalCost)}`);
  console.log(`  ${c.gray('Highest qual:')} ${result.highestQuality.provider}/${result.highestQuality.model}  ${c.red(result.highestQuality.totalCost)}\n`);
});

costCmd.command('report').option('--json','Output JSON').action(async (opts) => {
  const { obs } = await import('../../core/observability/index.js');
  const report = obs.report();
  if (opts.json) { json(report); return; }
  const c = await chalk();
  console.log(c.bold.cyan('\n  📊 Cost & Usage Report\n'));
  console.log(`  Total calls:   ${report.summary.totalCalls}`);
  console.log(`  Success rate:  ${report.summary.successRate}`);
  console.log(`  Avg latency:   ${report.summary.avgLatency}`);
  if (Object.keys(report.providers).length) {
    console.log(c.bold('\n  By Provider:'));
    Object.entries(report.providers).forEach(([p, data]) => console.log(`  ${c.yellow(p.padEnd(15))} ${data.calls} calls`));
  }
  console.log();
});

// ═══════════════════════════════════════════════════════════════════════════════
// OBSERVABILITY / STATS
// ═══════════════════════════════════════════════════════════════════════════════

program.command('stats')
  .description('Show system observability stats')
  .option('--json','Output JSON')
  .action(async (opts) => {
    const { obs } = await import('../../core/observability/index.js');
    const report = obs.report();
    if (opts.json) { json(report); return; }
    const c = await chalk();
    console.log(c.bold.cyan('\n  📡 TriObservability Stats\n'));
    console.log(`  Total API calls:  ${report.summary.totalCalls}`);
    console.log(`  Success rate:     ${report.summary.successRate}`);
    console.log(`  Avg latency:      ${report.summary.avgLatency}`);
    console.log();
  });

// ═══════════════════════════════════════════════════════════════════════════════
// BENCHMARKS
// ═══════════════════════════════════════════════════════════════════════════════

program.command('benchmark')
  .description('Run TriBenchmark Arena — compare models on real tasks')
  .option('--providers <list>','Comma-separated providers to benchmark','anthropic,openai')
  .option('--category <c>','Only run category (code|reasoning|creative)')
  .option('--quiet','Minimal output')
  .option('--json','Output JSON')
  .action(async (opts) => {
    const { runBenchmarks } = await import('../../benchmarks/runner.js');
    const providers = opts.providers.split(',').map(p => p.trim());
    const s = await ora(`Benchmarking ${providers.join(', ')}...`);
    if (!opts.quiet) s.stop();
    try {
      const results = await runBenchmarks(providers, { category: opts.category, quiet: opts.quiet });
      if (opts.json) { json(results); return; }
      const c = await chalk();
      console.log(c.bold.cyan('\n  🏆 Benchmark Results\n'));
      const Table = await table();
      const t = new Table({ head: ['Provider', 'Avg Score', 'Errors'], style:{head:['cyan']} });
      Object.values(results).forEach(r => t.push([r.provider, r.avgScore + '/100', r.errors.length]));
      console.log(t.toString()); console.log();
    } catch(e) { s.fail?.((await chalk()).red(e.message)) || await err(e.message); }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// DISCOVERY
// ═══════════════════════════════════════════════════════════════════════════════

program.command('discover')
  .description('Run daily AI ecosystem discovery scan')
  .option('--json','Output JSON')
  .action(async (opts) => {
    const s = await ora('Scanning GitHub for AI repositories...');
    try {
      const { default: discover } = await import('../../tools/github-scanner/discover.js').catch(() => ({ default: null }));
      if (discover) {
        const results = await discover();
        s.succeed('Discovery complete');
        if (opts.json) { json(results); return; }
        await ok(`Discovery scan complete. See registry/repos.json`);
      } else {
        await import('../../tools/github-scanner/discover.js');
        s.succeed('Discovery triggered');
      }
    } catch(e) { s.fail?.() || null; await err(e.message); }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS SHORTCUTS
// ═══════════════════════════════════════════════════════════════════════════════

program.command('startup <idea...>')
  .description('Generate a full startup launch kit')
  .option('--json','Output JSON')
  .action(async (parts, opts) => {
    const { runApp } = await import('../../apps/index.js');
    const idea = parts.join(' ');
    const s = await ora(`Building startup kit for: "${idea}"...`);
    try {
      const result = await runApp('startup-builder', { idea });
      s.succeed('Startup kit complete');
      if (opts.json) { json(result); return; }
      const c = await chalk();
      console.log(c.bold.cyan('\n  🚀 Startup Launch Kit\n'));
      result.sections?.forEach(sec => {
        console.log(c.bold.yellow(`\n  ━━━ ${sec.title} ━━━━━━━━━━━━━━━━━━━━━━`));
        console.log(sec.content);
      });
    } catch(e) { s.fail((await chalk()).red(e.message)); }
  });

program.command('money [profile...]')
  .description('Get personalized AI monetization roadmap')
  .option('--skills <s>',  'Your skills')
  .option('--time <t>',    'Hours per week', '10')
  .option('--budget <b>',  'Starting budget', '$0')
  .option('--goal <g>',    'Monthly income goal', '$5k/month')
  .action(async (parts, opts) => {
    const { runApp } = await import('../../apps/index.js');
    const s = await ora('Building your money roadmap...');
    try {
      const result = await runApp('money-mode-lite', { skills: opts.skills || parts.join(' '), time: opts.time, budget: opts.budget, goal: opts.goal });
      s.succeed('Roadmap ready');
      console.log('\n' + result.roadmap + '\n');
    } catch(e) { s.fail((await chalk()).red(e.message)); }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

program.command('config <action> [key] [value]')
  .description('Manage configuration')
  .action(async (action, key, value) => {
    const { config } = await import('../../core/config.js');
    const c = await chalk();
    if (action === 'show') { const all = config.getAll(); const safe = JSON.parse(JSON.stringify(all)); for (const p of Object.keys(safe.providers||{})) { if (safe.providers[p].apiKey) safe.providers[p].apiKey = '***' + (safe.providers[p].apiKey||'').slice(-4); } console.log(JSON.stringify(safe, null, 2)); return; }
    if (action === 'set' && key && value !== undefined) { config.set(key, value); console.log(c.green(`  ✓ ${key} = ${key.includes('apiKey') ? '***' + value.slice(-4) : value}`)); return; }
    if (action === 'get' && key) { console.log(config.get(key)); return; }
    console.log(c.yellow('  Usage: tri config show | set <key> <value> | get <key>'));
  });

program.command('models').description('List all supported models').option('--json','Output JSON').action(async (opts) => {
  const { TriRouter } = await import('../../core/router/index.js');
  const models = TriRouter.getAllModels();
  if (opts.json) { json(models); return; }
  const c = await chalk();
  const Table = await table();
  const t = new Table({ head: ['Model','Context (K)','$/1M In','$/1M Out'], style:{head:['cyan']} });
  models.forEach(m => t.push([m.model, m.contextK, m.inputPer1M, m.outputPer1M]));
  console.log(c.bold.cyan('\n  📋 Supported Models\n'));
  console.log(t.toString()); console.log();
});

// ── Default: show banner + help ───────────────────────────────────────────────
if (process.argv.length <= 2) { await showBanner(); program.help(); }
await program.parseAsync(process.argv);

// core/process/index.js — TriAgentOS TriProcess Manager
// Running jobs, PIDs, logs, duration, owner agent, status
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

const PROC_DIR  = join(homedir(), '.triagentos', 'processes');
const PROC_FILE = join(PROC_DIR, 'procs.json');

function ensureDir() { if (!existsSync(PROC_DIR)) mkdirSync(PROC_DIR, { recursive: true }); }

function loadProcs() {
  ensureDir();
  if (!existsSync(PROC_FILE)) return {};
  try { return JSON.parse(readFileSync(PROC_FILE, 'utf8')); } catch { return {}; }
}

function saveProcs(procs) {
  writeFileSync(PROC_FILE, JSON.stringify(procs, null, 2));
}

export class ProcessManager {
  spawn(label, opts = {}) {
    const procs = loadProcs();
    const id = randomUUID().slice(0, 8);
    procs[id] = {
      id, label,
      owner:     opts.owner || 'system',
      status:    'running',
      startedAt: new Date().toISOString(),
      endedAt:   null,
      duration:  null,
      exitCode:  null,
      logs:      [],
      meta:      opts.meta || {}
    };
    saveProcs(procs);
    return id;
  }

  log(id, message, level = 'info') {
    const procs = loadProcs();
    if (!procs[id]) return;
    const entry = { ts: new Date().toISOString(), level, message };
    procs[id].logs.push(entry);
    if (procs[id].logs.length > 500) procs[id].logs = procs[id].logs.slice(-500);
    saveProcs(procs);

    // Also append to log file
    const logFile = join(PROC_DIR, `${id}.log`);
    appendFileSync(logFile, `[${entry.ts}] [${level.toUpperCase()}] ${message}\n`);
  }

  complete(id, exitCode = 0) {
    const procs = loadProcs();
    if (!procs[id]) return;
    procs[id].status   = exitCode === 0 ? 'done' : 'failed';
    procs[id].endedAt  = new Date().toISOString();
    procs[id].exitCode = exitCode;
    procs[id].duration = new Date(procs[id].endedAt) - new Date(procs[id].startedAt);
    saveProcs(procs);
  }

  kill(id) {
    const procs = loadProcs();
    if (!procs[id]) return false;
    procs[id].status   = 'killed';
    procs[id].endedAt  = new Date().toISOString();
    procs[id].duration = new Date(procs[id].endedAt) - new Date(procs[id].startedAt);
    saveProcs(procs);
    return true;
  }

  get(id) { return loadProcs()[id] || null; }

  list(opts = {}) {
    const procs = loadProcs();
    let list = Object.values(procs);
    if (opts.status) list = list.filter(p => p.status === opts.status);
    if (opts.owner)  list = list.filter(p => p.owner  === opts.owner);
    return list.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).slice(0, opts.limit || 50);
  }

  logs(id, tail = 50) {
    const proc = loadProcs()[id];
    if (!proc) throw new Error(`Process ${id} not found`);
    return proc.logs.slice(-tail);
  }

  running() { return this.list({ status: 'running' }); }
  failed()  { return this.list({ status: 'failed' }); }

  clean() {
    const procs = loadProcs();
    let removed = 0;
    const keep = {};
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
    for (const [id, p] of Object.entries(procs)) {
      if (p.status === 'running' || new Date(p.startedAt) > cutoff) keep[id] = p;
      else removed++;
    }
    saveProcs(keep);
    return removed;
  }
}

export const processManager = new ProcessManager();
export default processManager;

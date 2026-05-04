// core/scheduler/index.js — TriAgentOS TriScheduler
// Local cron jobs, recurring workflows, scheduled reports
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

const SCHED_DIR  = join(homedir(), '.triagentos', 'scheduler');
const SCHED_FILE = join(SCHED_DIR, 'schedules.json');

function ensureDir() { if (!existsSync(SCHED_DIR)) mkdirSync(SCHED_DIR, { recursive: true }); }
function load() { ensureDir(); if (!existsSync(SCHED_FILE)) return {}; try { return JSON.parse(readFileSync(SCHED_FILE, 'utf8')); } catch { return {}; } }
function save(s) { writeFileSync(SCHED_FILE, JSON.stringify(s, null, 2)); }

// Simple cron-like intervals
const INTERVALS = { hourly: 3600, daily: 86400, weekly: 604800, monthly: 2592000 };

export class Scheduler {
  add(name, command, interval, opts = {}) {
    const schedules = load();
    const id = randomUUID().slice(0, 8);
    const intervalSecs = INTERVALS[interval] || parseInt(interval) || 86400;
    schedules[id] = {
      id, name, command, interval, intervalSecs,
      active:    true,
      createdAt: new Date().toISOString(),
      lastRun:   null,
      nextRun:   new Date(Date.now() + intervalSecs * 1000).toISOString(),
      runCount:  0,
      description: opts.description || '',
      tags: opts.tags || []
    };
    save(schedules);
    return schedules[id];
  }

  list(opts = {}) {
    const schedules = load();
    let list = Object.values(schedules);
    if (opts.active !== undefined) list = list.filter(s => s.active === opts.active);
    return list.sort((a, b) => new Date(a.nextRun) - new Date(b.nextRun));
  }

  getDue() {
    const now = new Date();
    return this.list({ active: true }).filter(s => new Date(s.nextRun) <= now);
  }

  markRan(id) {
    const schedules = load();
    if (!schedules[id]) return;
    schedules[id].lastRun  = new Date().toISOString();
    schedules[id].nextRun  = new Date(Date.now() + schedules[id].intervalSecs * 1000).toISOString();
    schedules[id].runCount++;
    save(schedules);
    return schedules[id];
  }

  disable(id) {
    const schedules = load();
    if (!schedules[id]) return false;
    schedules[id].active = false;
    save(schedules);
    return true;
  }

  delete(id) {
    const schedules = load();
    if (!schedules[id]) return false;
    delete schedules[id];
    save(schedules);
    return true;
  }

  getDefaults() {
    return [
      { name: 'Daily AI Discovery',        command: 'tri discover',           interval: 'daily',  description: 'Scan GitHub for new AI tools' },
      { name: 'Weekly Security Report',    command: 'tri secure report',      interval: 'weekly', description: 'Generate security scan report' },
      { name: 'Daily Cost Report',         command: 'tri cost report',        interval: 'daily',  description: 'Track API spending' },
      { name: 'Weekly Benchmark Run',      command: 'tri benchmark',          interval: 'weekly', description: 'Compare model performance' },
      { name: 'Daily README Update',       command: 'npm run build:readme',   interval: 'daily',  description: 'Auto-update README with discoveries' }
    ];
  }
}

export const scheduler = new Scheduler();
export default scheduler;

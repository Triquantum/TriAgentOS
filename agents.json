// core/observability/index.js — TriAgentOS TriObservability
// Logs, traces, latency, cost estimates, success/failure metrics
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const OBS_DIR    = join(homedir(), '.triagentos', 'observability');
const METRICS_FILE = join(OBS_DIR, 'metrics.json');
const TRACES_FILE  = join(OBS_DIR, 'traces.json');
const LOG_FILE     = join(OBS_DIR, 'tri.log');

function ensureDir() { if (!existsSync(OBS_DIR)) mkdirSync(OBS_DIR, { recursive: true }); }
function loadJSON(path, fallback) { try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; } }
function saveJSON(path, data) { writeFileSync(path, JSON.stringify(data, null, 2)); }

export class Observability {
  constructor() { ensureDir(); }

  // ── Logging ──────────────────────────────────────────────────────────────
  log(level, message, meta = {}) {
    const entry = { ts: new Date().toISOString(), level, message, ...meta };
    appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    return entry;
  }

  info(msg, meta)  { return this.log('info',  msg, meta); }
  warn(msg, meta)  { return this.log('warn',  msg, meta); }
  error(msg, meta) { return this.log('error', msg, meta); }
  debug(msg, meta) { return this.log('debug', msg, meta); }

  // ── Traces ──────────────────────────────────────────────────────────────
  startTrace(name, meta = {}) {
    const trace = { id: `tr-${Date.now()}`, name, meta, startMs: Date.now(), spans: [], status: 'running' };
    const traces = loadJSON(TRACES_FILE, []);
    traces.unshift(trace);
    if (traces.length > 1000) traces.length = 1000;
    saveJSON(TRACES_FILE, traces);
    return trace.id;
  }

  endTrace(traceId, meta = {}) {
    const traces = loadJSON(TRACES_FILE, []);
    const trace  = traces.find(t => t.id === traceId);
    if (!trace) return;
    trace.endMs    = Date.now();
    trace.latencyMs = trace.endMs - trace.startMs;
    trace.status   = meta.error ? 'error' : 'success';
    Object.assign(trace, meta);
    saveJSON(TRACES_FILE, traces);
    this._updateMetrics(trace);
    return trace;
  }

  // ── Metrics ─────────────────────────────────────────────────────────────
  _updateMetrics(trace) {
    const metrics = loadJSON(METRICS_FILE, {
      totalCalls: 0, successCalls: 0, errorCalls: 0,
      totalLatencyMs: 0, totalCost: 0, providers: {}, commands: {}
    });
    metrics.totalCalls++;
    if (trace.status === 'success') metrics.successCalls++;
    else metrics.errorCalls++;
    metrics.totalLatencyMs += trace.latencyMs || 0;
    metrics.avgLatencyMs = Math.round(metrics.totalLatencyMs / metrics.totalCalls);

    if (trace.provider) {
      metrics.providers[trace.provider] = metrics.providers[trace.provider] || { calls: 0, errors: 0, latencyMs: 0 };
      metrics.providers[trace.provider].calls++;
      if (trace.status === 'error') metrics.providers[trace.provider].errors++;
      metrics.providers[trace.provider].latencyMs += trace.latencyMs || 0;
    }
    if (trace.command) {
      metrics.commands[trace.command] = (metrics.commands[trace.command] || 0) + 1;
    }
    metrics.updatedAt = new Date().toISOString();
    saveJSON(METRICS_FILE, metrics);
  }

  getMetrics()  { return loadJSON(METRICS_FILE, {}); }
  getTraces(n)  { return loadJSON(TRACES_FILE, []).slice(0, n || 50); }

  getLogs(n = 100) {
    if (!existsSync(LOG_FILE)) return [];
    const lines = readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
    return lines.slice(-n).map(l => { try { return JSON.parse(l); } catch { return { raw: l }; } });
  }

  report() {
    const m = this.getMetrics();
    const traces = this.getTraces(10);
    return {
      summary: {
        totalCalls: m.totalCalls || 0,
        successRate: m.totalCalls ? `${Math.round((m.successCalls / m.totalCalls) * 100)}%` : 'N/A',
        avgLatency: m.avgLatencyMs ? `${m.avgLatencyMs}ms` : 'N/A'
      },
      providers: m.providers || {},
      topCommands: m.commands || {},
      recentTraces: traces.map(t => ({ id: t.id, name: t.name, latency: t.latencyMs, status: t.status }))
    };
  }
}

export const obs = new Observability();
export default obs;

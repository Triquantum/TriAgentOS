// core/state/index.js — TriAgentOS TriState Engine
// Save/resume sessions, checkpoints, export/import state
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

const STATE_DIR = join(homedir(), '.triagentos', 'states');

function ensureDir() { if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true }); }

export class StateEngine {
  save(name, data, opts = {}) {
    ensureDir();
    const id = name || randomUUID().slice(0, 8);
    const state = {
      id, name: opts.label || id, type: opts.type || 'session',
      data, createdAt: new Date().toISOString(),
      tags: opts.tags || [], description: opts.description || ''
    };
    writeFileSync(join(STATE_DIR, `${id}.json`), JSON.stringify(state, null, 2));
    return state;
  }

  load(id) {
    ensureDir();
    const path = join(STATE_DIR, `${id}.json`);
    if (!existsSync(path)) throw new Error(`State "${id}" not found`);
    return JSON.parse(readFileSync(path, 'utf8'));
  }

  list() {
    ensureDir();
    return readdirSync(STATE_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const s = JSON.parse(readFileSync(join(STATE_DIR, f), 'utf8'));
          return { id: s.id, name: s.name, type: s.type, createdAt: s.createdAt, description: s.description };
        } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  checkpoint(sessionId, data) {
    return this.save(`checkpoint-${sessionId}-${Date.now()}`, data, { type: 'checkpoint', label: `Checkpoint: ${sessionId}` });
  }

  delete(id) {
    const path = join(STATE_DIR, `${id}.json`);
    if (!existsSync(path)) return false;
    unlinkSync(path);
    return true;
  }

  export(id) {
    const state = this.load(id);
    return JSON.stringify(state, null, 2);
  }

  import(jsonStr) {
    const state = JSON.parse(jsonStr);
    if (!state.id || !state.data) throw new Error('Invalid state format');
    this.save(state.id, state.data, { label: state.name, type: state.type, description: state.description });
    return state;
  }

  latest() {
    const states = this.list();
    return states[0] || null;
  }
}

export const stateEngine = new StateEngine();
export default stateEngine;

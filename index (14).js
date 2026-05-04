// core/kernel/index.js — TriAgentOS TriKernel
// Central runtime: event bus, service registry, command dispatcher, lifecycle
import { EventEmitter } from 'events';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const STATE_DIR  = join(homedir(), '.triagentos');
const STATE_PATH = join(STATE_DIR, 'kernel-state.json');

class TriKernel extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(200);
    this.services = new Map();
    this.commands = new Map();
    this.bootTime = null;
    this.status   = 'stopped';
    this.version  = '1.0.0';
    this.pid      = process.pid;
    this._hooks   = { beforeCommand: [], afterCommand: [], onError: [] };
  }

  async boot(opts = {}) {
    if (this.status === 'running') return this;
    this.status   = 'booting';
    this.bootTime = Date.now();
    this.emit('kernel:booting', { pid: this.pid, version: this.version });
    this.registerService('kernel', this, { description: 'TriKernel core runtime' });
    this._ensureStateDir();
    this.status = 'running';
    this.emit('kernel:ready', { services: this.services.size });
    if (!opts.silent) {
      console.log(`\n  ⚡ TriKernel v${this.version} running  [PID ${this.pid}]`);
      console.log(`  📦 Services: ${this.services.size}  |  Commands: ${this.commands.size}\n`);
    }
    return this;
  }

  async shutdown(opts = {}) {
    this.emit('kernel:shutdown');
    this._saveState();
    this.status = 'stopped';
    if (!opts.silent) console.log('\n  TriKernel shutdown gracefully.');
  }

  registerService(name, instance, meta = {}) {
    this.services.set(name, { instance, meta, registeredAt: Date.now() });
    this.emit('service:registered', { name });
    return this;
  }

  getService(name) {
    const svc = this.services.get(name);
    if (!svc) throw new Error(`Service "${name}" not registered.`);
    return svc.instance;
  }

  listServices() {
    return [...this.services.entries()].map(([name, s]) => ({ name, ...s.meta }));
  }

  registerCommand(name, handler, meta = {}) {
    this.commands.set(name, { handler, meta });
    return this;
  }

  async dispatch(commandName, args = {}) {
    const cmd = this.commands.get(commandName);
    if (!cmd) throw new Error(`Unknown command: "${commandName}"`);
    for (const hook of this._hooks.beforeCommand) await hook({ command: commandName, args });
    let result;
    try { result = await cmd.handler(args); }
    catch (err) {
      for (const hook of this._hooks.onError) await hook({ command: commandName, error: err });
      throw err;
    }
    for (const hook of this._hooks.afterCommand) await hook({ command: commandName, result });
    this.emit('command:executed', { command: commandName });
    return result;
  }

  addHook(event, fn) {
    if (this._hooks[event]) this._hooks[event].push(fn);
    return this;
  }

  health() {
    return {
      status:    this.status,
      version:   this.version,
      pid:       this.pid,
      uptimeSec: this.bootTime ? Math.round((Date.now() - this.bootTime) / 1000) : 0,
      services:  this.services.size,
      commands:  this.commands.size,
      memory:    process.memoryUsage()
    };
  }

  _ensureStateDir() {
    if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  }

  _saveState() {
    try {
      writeFileSync(STATE_PATH, JSON.stringify({
        version: this.version, pid: this.pid,
        bootTime: this.bootTime, savedAt: Date.now(),
        services: [...this.services.keys()]
      }, null, 2));
    } catch {}
  }
}

export const kernel = new TriKernel();
export default kernel;

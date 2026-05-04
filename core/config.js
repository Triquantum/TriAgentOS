// core/config.js — TriAgentOS Configuration Manager
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = join(homedir(), '.triagentos');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const HISTORY_FILE = join(CONFIG_DIR, 'history.json');

const DEFAULTS = {
  defaultModel: 'claude',
  defaultProvider: 'anthropic',
  maxTokens: 4096,
  temperature: 0.7,
  streamOutput: true,
  theme: 'gradient',
  saveCost: true,
  memoryEnabled: true,
  telemetry: false,
  providers: {
    anthropic: { apiKey: '', model: 'claude-opus-4-5' },
    openai:    { apiKey: '', model: 'gpt-4o' },
    gemini:    { apiKey: '', model: 'gemini-1.5-pro' },
    groq:      { apiKey: '', model: 'llama-3.1-70b-versatile' },
    ollama:    { baseUrl: 'http://localhost:11434', model: 'llama3' }
  }
};

export class Config {
  constructor() {
    this._ensureDir();
    this._data = this._load();
  }

  _ensureDir() {
    if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  }

  _load() {
    if (!existsSync(CONFIG_FILE)) {
      writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULTS, null, 2));
      return { ...DEFAULTS };
    }
    try {
      return { ...DEFAULTS, ...JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  get(key) {
    const keys = key.split('.');
    let val = this._data;
    for (const k of keys) val = val?.[k];
    return val;
  }

  set(key, value) {
    const keys = key.split('.');
    let obj = this._data;
    for (let i = 0; i < keys.length - 1; i++) {
      obj[keys[i]] = obj[keys[i]] || {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    writeFileSync(CONFIG_FILE, JSON.stringify(this._data, null, 2));
  }

  getAll() { return this._data; }

  setApiKey(provider, key) {
    this.set(`providers.${provider}.apiKey`, key);
  }

  getApiKey(provider) {
    return process.env[`${provider.toUpperCase()}_API_KEY`]
      || this.get(`providers.${provider}.apiKey`)
      || null;
  }

  getBestAvailableProvider() {
    const priority = ['anthropic', 'openai', 'gemini', 'groq', 'ollama'];
    for (const p of priority) {
      if (p === 'ollama') return p; // ollama is local, always "available"
      if (this.getApiKey(p)) return p;
    }
    return null;
  }

  // History management
  saveToHistory(entry) {
    let history = [];
    if (existsSync(HISTORY_FILE)) {
      try { history = JSON.parse(readFileSync(HISTORY_FILE, 'utf8')); } catch {}
    }
    history.unshift({ ...entry, timestamp: new Date().toISOString() });
    if (history.length > 500) history = history.slice(0, 500);
    writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  }

  getHistory(limit = 20) {
    if (!existsSync(HISTORY_FILE)) return [];
    try {
      return JSON.parse(readFileSync(HISTORY_FILE, 'utf8')).slice(0, limit);
    } catch { return []; }
  }
}

export const config = new Config();

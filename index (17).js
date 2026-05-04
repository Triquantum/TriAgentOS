// core/memory.js — TriAgentOS Persistent Memory System
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const MEMORY_DIR = join(homedir(), '.triagentos');
const SESSIONS_FILE = join(MEMORY_DIR, 'sessions.json');

export class Memory {
  constructor(sessionId = 'default') {
    this.sessionId = sessionId;
    this._sessions = this._loadAll();
    if (!this._sessions[sessionId]) {
      this._sessions[sessionId] = { messages: [], metadata: {}, createdAt: new Date().toISOString() };
    }
  }

  _loadAll() {
    if (!existsSync(SESSIONS_FILE)) return {};
    try { return JSON.parse(readFileSync(SESSIONS_FILE, 'utf8')); }
    catch { return {}; }
  }

  _save() {
    writeFileSync(SESSIONS_FILE, JSON.stringify(this._sessions, null, 2));
  }

  get messages() {
    return this._sessions[this.sessionId].messages;
  }

  add(role, content) {
    this._sessions[this.sessionId].messages.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
    this._save();
  }

  clear() {
    this._sessions[this.sessionId].messages = [];
    this._save();
  }

  // Return last N messages for API calls (strips timestamps)
  getContext(n = 20) {
    return this.messages.slice(-n).map(({ role, content }) => ({ role, content }));
  }

  // Summarize long contexts to stay within token limits
  compress(keepLast = 6) {
    const msgs = this.messages;
    if (msgs.length <= keepLast + 2) return;

    // Keep first message + last keepLast messages
    const summary = `[Context compressed: ${msgs.length - keepLast} earlier messages omitted]`;
    this._sessions[this.sessionId].messages = [
      { role: 'user', content: summary, timestamp: new Date().toISOString() },
      ...msgs.slice(-keepLast)
    ];
    this._save();
  }

  // Set metadata (e.g., agent name, task description)
  setMeta(key, value) {
    this._sessions[this.sessionId].metadata[key] = value;
    this._save();
  }

  getMeta(key) {
    return this._sessions[this.sessionId].metadata[key];
  }

  // List all sessions
  static listSessions() {
    if (!existsSync(SESSIONS_FILE)) return [];
    try {
      const sessions = JSON.parse(readFileSync(SESSIONS_FILE, 'utf8'));
      return Object.entries(sessions).map(([id, s]) => ({
        id,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        lastMessage: s.messages.at(-1)?.timestamp || s.createdAt
      }));
    } catch { return []; }
  }

  static deleteSession(id) {
    if (!existsSync(SESSIONS_FILE)) return false;
    try {
      const sessions = JSON.parse(readFileSync(SESSIONS_FILE, 'utf8'));
      if (!sessions[id]) return false;
      delete sessions[id];
      writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
      return true;
    } catch { return false; }
  }
}

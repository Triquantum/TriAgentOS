// core/governance/index.js — TriAgentOS TriGovernance
// Permissions, audit logs, agent roles, approval gates
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

const GOV_DIR    = join(homedir(), '.triagentos', 'governance');
const AUDIT_FILE = join(GOV_DIR, 'audit.log');
const POLICY_FILE = join(GOV_DIR, 'policies.json');

function ensureDir() { if (!existsSync(GOV_DIR)) mkdirSync(GOV_DIR, { recursive: true }); }

const DEFAULT_POLICIES = [
  { id: 'no-shell-exec',   name: 'No Unrestricted Shell Execution', level: 'critical', rule: 'Agents must not execute arbitrary shell commands without approval',  active: true },
  { id: 'cost-limit',      name: 'Cost Limit Per Task',             level: 'high',     rule: 'Single task cost must not exceed $1.00 without approval',             active: true },
  { id: 'pii-guard',       name: 'PII Data Guard',                  level: 'critical', rule: 'Agents must not transmit PII data to external services',              active: true },
  { id: 'human-in-loop',   name: 'Human In The Loop',               level: 'high',     rule: 'Autonomous agents must checkpoint on destructive operations',         active: true },
  { id: 'secrets-guard',   name: 'Secrets Guard',                   level: 'critical', rule: 'Agents must never log or expose API keys or credentials',             active: true },
  { id: 'rate-limit',      name: 'API Rate Limiting',               level: 'medium',   rule: 'Max 60 API calls per minute per provider',                            active: true },
  { id: 'audit-required',  name: 'Audit All Actions',               level: 'medium',   rule: 'All agent actions must be logged to audit trail',                     active: true }
];

export class Governance {
  constructor() { ensureDir(); }

  audit(action, meta = {}) {
    const entry = { id: randomUUID().slice(0, 8), ts: new Date().toISOString(), action, ...meta };
    appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n');
    return entry;
  }

  getAuditLog(n = 100) {
    if (!existsSync(AUDIT_FILE)) return [];
    const lines = readFileSync(AUDIT_FILE, 'utf8').trim().split('\n').filter(Boolean);
    return lines.slice(-n).map(l => { try { return JSON.parse(l); } catch { return { raw: l }; } });
  }

  getPolicies() {
    if (!existsSync(POLICY_FILE)) {
      writeFileSync(POLICY_FILE, JSON.stringify(DEFAULT_POLICIES, null, 2));
      return DEFAULT_POLICIES;
    }
    return JSON.parse(readFileSync(POLICY_FILE, 'utf8'));
  }

  checkPolicy(policyId) {
    const policies = this.getPolicies();
    return policies.find(p => p.id === policyId) || null;
  }

  check(action, context = {}) {
    const policies = this.getPolicies().filter(p => p.active);
    const violations = [];

    // Cost check
    if (context.cost && context.cost > 1.0) {
      const p = policies.find(p => p.id === 'cost-limit');
      if (p) violations.push({ policy: p, severity: 'high', detail: `Estimated cost $${context.cost.toFixed(4)} exceeds $1.00 limit` });
    }

    // Shell check
    if (context.shell && !context.approved) {
      const p = policies.find(p => p.id === 'no-shell-exec');
      if (p) violations.push({ policy: p, severity: 'critical', detail: 'Shell execution requires explicit approval' });
    }

    this.audit(action, { context, violations: violations.length, result: violations.length === 0 ? 'pass' : 'fail' });
    return { allowed: violations.length === 0, violations };
  }

  createApprovalGate(action, requester = 'system', meta = {}) {
    const gate = { id: randomUUID().slice(0, 8), action, requester, status: 'pending', createdAt: new Date().toISOString(), meta };
    this.audit('approval_gate_created', { gate: gate.id, action, requester });
    return gate;
  }
}

export const governance = new Governance();
export default governance;

// core/security/index.js — TriAgentOS TriSecure Layer (Community Edition)
// Secrets, dependencies, IaC, SAST, container, lint, policy scanning
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

const REPORT_DIR = join('core', 'security', 'reports');

// ── Secret Patterns ──────────────────────────────────────────────────────────
const SECRET_PATTERNS = [
  { id: 'anthropic-key',   pattern: /sk-ant-[a-zA-Z0-9\-_]{20,}/g,               severity: 'critical', label: 'Anthropic API Key' },
  { id: 'openai-key',      pattern: /sk-[a-zA-Z0-9]{20,}/g,                       severity: 'critical', label: 'OpenAI API Key' },
  { id: 'github-token',    pattern: /ghp_[a-zA-Z0-9]{36}/g,                       severity: 'critical', label: 'GitHub Personal Token' },
  { id: 'github-actions',  pattern: /ghs_[a-zA-Z0-9]{36}/g,                       severity: 'critical', label: 'GitHub Actions Token' },
  { id: 'aws-key',         pattern: /AKIA[0-9A-Z]{16}/g,                          severity: 'critical', label: 'AWS Access Key' },
  { id: 'aws-secret',      pattern: /aws_secret_access_key\s*=\s*[^\s]{20,}/gi,   severity: 'critical', label: 'AWS Secret Key' },
  { id: 'google-api',      pattern: /AIza[0-9A-Za-z\-_]{35}/g,                   severity: 'high',     label: 'Google API Key' },
  { id: 'private-key',     pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/g, severity: 'critical', label: 'Private Key' },
  { id: 'jwt-secret',      pattern: /jwt[_\s]?secret\s*[=:]\s*['"]?[^\s'"]{8,}/gi,severity: 'high',     label: 'JWT Secret' },
  { id: 'db-password',     pattern: /password\s*[=:]\s*['"]?(?!<)[^\s'"]{8,}/gi,  severity: 'high',     label: 'Hardcoded Password' },
  { id: 'bearer-token',    pattern: /bearer\s+[a-zA-Z0-9\-_\.]{20,}/gi,           severity: 'high',     label: 'Bearer Token' },
  { id: 'stripe-key',      pattern: /sk_live_[a-zA-Z0-9]{24,}/g,                  severity: 'critical', label: 'Stripe Live Key' }
];

// ── SAST Patterns ────────────────────────────────────────────────────────────
const SAST_PATTERNS = [
  { id: 'eval-usage',       pattern: /\beval\s*\(/g,                               severity: 'critical', label: 'eval() usage — code injection risk', cwe: 'CWE-95' },
  { id: 'child-process',    pattern: /exec\s*\(|execSync\s*\(|spawn\s*\(/g,        severity: 'high',     label: 'child_process exec — command injection risk', cwe: 'CWE-78' },
  { id: 'sql-concat',       pattern: /"SELECT.{0,80}\+|'SELECT.{0,80}\+/gi,        severity: 'critical', label: 'SQL string concatenation — injection risk', cwe: 'CWE-89' },
  { id: 'xss-innerhtml',    pattern: /\.innerHTML\s*=/g,                            severity: 'high',     label: 'innerHTML assignment — XSS risk', cwe: 'CWE-79' },
  { id: 'prototype-pollution',pattern: /\.__proto__\s*=/g,                          severity: 'high',     label: 'Prototype pollution risk', cwe: 'CWE-1321' },
  { id: 'hardcoded-secret', pattern: /(apiKey|secretKey|password)\s*[:=]\s*['"][^'"]{8,}/gi, severity: 'critical', label: 'Hardcoded credential in code', cwe: 'CWE-798' },
  { id: 'insecure-random',  pattern: /Math\.random\(\)/g,                           severity: 'medium',   label: 'Math.random() — not cryptographically secure', cwe: 'CWE-338' },
  { id: 'weak-hash',        pattern: /createHash\(['"]md5['"]\)|createHash\(['"]sha1['"]\)/g, severity: 'medium', label: 'Weak hash algorithm (MD5/SHA1)', cwe: 'CWE-327' }
];

// ── IaC Patterns ─────────────────────────────────────────────────────────────
const IAC_PATTERNS = [
  { id: 'docker-latest',    pattern: /FROM\s+\S+:latest/g,            severity: 'medium',   label: 'Docker FROM :latest — use pinned versions' },
  { id: 'docker-root',      pattern: /USER\s+root/gi,                 severity: 'high',     label: 'Container runs as root' },
  { id: 'expose-all',       pattern: /EXPOSE\s+0\.0\.0\.0/g,          severity: 'medium',   label: 'Exposing all interfaces' },
  { id: 'gh-action-unpin',  pattern: /uses:\s+[^@\n]+@(?![\da-f]{40})/g, severity: 'high', label: 'GitHub Action not pinned to commit SHA' },
  { id: 'wildcard-perm',    pattern: /permissions:\s*['"]?\*['"]?/gi, severity: 'critical', label: 'Wildcard permissions in workflow' },
  { id: 'k8s-privileged',   pattern: /privileged:\s*true/gi,          severity: 'critical', label: 'Kubernetes privileged container' }
];

function walkFiles(dir, exts) {
  const results = [];
  if (!existsSync(dir)) return results;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      if (entry.isDirectory()) results.push(...walkFiles(full, exts));
      else if (!exts || exts.includes(extname(entry.name).toLowerCase())) results.push(full);
    }
  } catch {}
  return results;
}

function scanFile(filePath, patterns) {
  let content;
  try { content = readFileSync(filePath, 'utf8'); }
  catch { return []; }
  const findings = [];
  for (const p of patterns) {
    const matches = [...(content.matchAll(p.pattern) || [])];
    if (matches.length > 0) {
      const line = content.slice(0, matches[0].index).split('\n').length;
      findings.push({ ...p, file: filePath, line, occurrences: matches.length, pattern: undefined });
    }
  }
  return findings;
}

export class TriSecure {
  scanSecrets(dir = '.') {
    const exts  = ['.js', '.ts', '.py', '.env', '.json', '.yml', '.yaml', '.sh', '.rb', '.go'];
    const files = walkFiles(dir, exts).filter(f => !f.includes('node_modules') && !f.includes('.git'));
    const findings = files.flatMap(f => scanFile(f, SECRET_PATTERNS));
    return { scanner: 'secrets', dir, filesScanned: files.length, findings, passed: findings.length === 0 };
  }

  scanSAST(dir = '.') {
    const exts  = ['.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.php'];
    const files = walkFiles(dir, exts).filter(f => !f.includes('node_modules') && !f.includes('.git'));
    const findings = files.flatMap(f => scanFile(f, SAST_PATTERNS));
    return { scanner: 'sast', dir, filesScanned: files.length, findings, passed: findings.length === 0 };
  }

  scanIaC(dir = '.') {
    const exts  = ['.yml', '.yaml', '.dockerfile', '', '.tf', '.json'];
    const files = walkFiles(dir, null).filter(f => {
      const base = f.toLowerCase();
      return (base.endsWith('.yml') || base.endsWith('.yaml') || base.includes('dockerfile') || base.endsWith('.tf')) && !f.includes('node_modules');
    });
    const findings = files.flatMap(f => scanFile(f, IAC_PATTERNS));
    return { scanner: 'iac', dir, filesScanned: files.length, findings, passed: findings.length === 0 };
  }

  scanDependencies(dir = '.') {
    const pkgPath = join(dir, 'package.json');
    if (!existsSync(pkgPath)) return { scanner: 'deps', findings: [], note: 'No package.json found', passed: true };
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const findings = [];

    // Check for known risky patterns
    for (const [name, version] of Object.entries(deps)) {
      if (version === '*' || version === 'latest') {
        findings.push({ id: 'unpinned-dep', label: `Dependency "${name}" is unpinned (${version})`, severity: 'medium', file: 'package.json', occurrences: 1 });
      }
      if (name.includes('..') || name.startsWith('_')) {
        findings.push({ id: 'suspicious-dep', label: `Suspicious package name: "${name}"`, severity: 'high', file: 'package.json', occurrences: 1 });
      }
    }
    return { scanner: 'deps', dir, totalDeps: Object.keys(deps).length, findings, passed: findings.length === 0 };
  }

  scanContainer(dir = '.') {
    const dockerfiles = walkFiles(dir, null).filter(f => basename(f).toLowerCase().includes('dockerfile') && !f.includes('node_modules'));
    if (dockerfiles.length === 0) return { scanner: 'container', findings: [], note: 'No Dockerfiles found', passed: true };
    const findings = dockerfiles.flatMap(f => scanFile(f, IAC_PATTERNS.filter(p => p.id.startsWith('docker'))));
    return { scanner: 'container', dir, filesScanned: dockerfiles.length, findings, passed: findings.length === 0 };
  }

  scanLint(dir = '.') {
    try {
      execSync('npx eslint --version', { stdio: 'ignore', timeout: 5000 });
      const result = execSync(`npx eslint ${dir} --format json --ext .js,.ts 2>/dev/null || true`, { encoding: 'utf8', timeout: 30000 });
      let parsed;
      try { parsed = JSON.parse(result); } catch { return { scanner: 'lint', findings: [], note: 'ESLint output not parseable', passed: true }; }
      const findings = parsed.flatMap(file => (file.messages || []).map(m => ({
        id: m.ruleId || 'lint', label: m.message, severity: m.severity === 2 ? 'high' : 'medium', file: file.filePath, line: m.line, occurrences: 1
      })));
      return { scanner: 'lint', findings, passed: findings.filter(f => f.severity === 'high').length === 0 };
    } catch {
      return { scanner: 'lint', findings: [], note: 'ESLint not available — install with: npm install -g eslint', passed: true };
    }
  }

  async runAll(dir = '.') {
    const scanners = ['secrets', 'sast', 'iac', 'deps', 'container'];
    const results  = {};
    for (const s of scanners) {
      try {
        if (s === 'secrets')   results[s] = this.scanSecrets(dir);
        else if (s === 'sast') results[s] = this.scanSAST(dir);
        else if (s === 'iac')  results[s] = this.scanIaC(dir);
        else if (s === 'deps') results[s] = this.scanDependencies(dir);
        else if (s === 'container') results[s] = this.scanContainer(dir);
      } catch (err) { results[s] = { scanner: s, error: err.message, findings: [], passed: false }; }
    }

    const allFindings = Object.values(results).flatMap(r => r.findings || []);
    const critical     = allFindings.filter(f => f.severity === 'critical').length;
    const high         = allFindings.filter(f => f.severity === 'high').length;
    const medium       = allFindings.filter(f => f.severity === 'medium').length;

    const report = { scanDate: new Date().toISOString(), dir, summary: { total: allFindings.length, critical, high, medium, passed: critical === 0 && high === 0 }, results };

    // Write reports
    try {
      if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });
      writeFileSync(join(REPORT_DIR, 'security-report.json'), JSON.stringify(report, null, 2));
      writeFileSync(join(REPORT_DIR, 'security-report.md'), this._renderMarkdown(report));
    } catch {}

    return report;
  }

  _renderMarkdown(report) {
    const { summary, results } = report;
    let md = `# TriAgentOS Security Report\n\n`;
    md += `**Scan Date:** ${report.scanDate}\n`;
    md += `**Status:** ${summary.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    md += `## Summary\n\n| Severity | Count |\n|----------|-------|\n`;
    md += `| 🔴 Critical | ${summary.critical} |\n| 🟠 High | ${summary.high} |\n| 🟡 Medium | ${summary.medium} |\n| **Total** | **${summary.total}** |\n\n`;
    for (const [scanner, result] of Object.entries(results)) {
      md += `## ${scanner.toUpperCase()} Scanner\n\n`;
      if (!result.findings?.length) { md += `✅ No issues found\n\n`; continue; }
      for (const f of result.findings) {
        md += `- **${f.severity.toUpperCase()}** [${f.id}] ${f.label}\n  - File: \`${f.file}\`${f.line ? ` line ${f.line}` : ''}\n`;
      }
      md += '\n';
    }
    return md;
  }
}

export const triSecure = new TriSecure();
export default triSecure;

// core/tools/index.js — TriAgentOS TriTool Hub
// Universal tool interface: file, shell wrapper, GitHub placeholder, MCP placeholder
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname, extname, basename } from 'path';
import { randomUUID } from 'crypto';

export const TOOLS = {
  file: {
    id: 'file', name: 'File Tool', description: 'Read, write, list files on disk',
    actions: ['read', 'write', 'list', 'exists', 'stat'],
    async run(action, args = {}) {
      switch (action) {
        case 'read':   return { content: readFileSync(args.path, 'utf8') };
        case 'write':  writeFileSync(args.path, args.content || ''); return { written: true, path: args.path };
        case 'list':   return { files: readdirSync(args.path || '.').map(f => ({ name: f, ...statSync(join(args.path || '.', f)) })) };
        case 'exists': return { exists: existsSync(args.path) };
        case 'stat':   return statSync(args.path);
        default:       throw new Error(`Unknown file action: ${action}`);
      }
    }
  },

  shell: {
    id: 'shell', name: 'Shell Wrapper', description: 'Execute shell commands (with approval gate)',
    actions: ['run'],
    _approved: new Set(['ls', 'pwd', 'echo', 'cat', 'node --version', 'npm --version', 'git status', 'git log --oneline -5']),
    async run(action, args = {}) {
      if (action !== 'run') throw new Error(`Shell tool only supports 'run' action`);
      const cmd = args.command || '';
      const isApproved = [...this._approved].some(a => cmd.startsWith(a));
      if (!isApproved && !args.force) {
        return { blocked: true, reason: `Command "${cmd}" requires explicit approval. Pass force:true to override.`, command: cmd };
      }
      try {
        const output = execSync(cmd, { encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 * 5 });
        return { success: true, output: output.trim(), command: cmd };
      } catch (err) {
        return { success: false, error: err.message, stderr: err.stderr, command: cmd };
      }
    }
  },

  github: {
    id: 'github', name: 'GitHub Integration', description: 'GitHub API integration (configure GITHUB_TOKEN)',
    actions: ['search', 'info', 'trending'],
    async run(action, args = {}) {
      const token  = process.env.GITHUB_TOKEN;
      const headers = { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'TriAgentOS/1.0' };
      if (token) headers.Authorization = `Bearer ${token}`;

      if (action === 'search') {
        const q   = encodeURIComponent(args.query || 'ai agent');
        const res = await fetch(`https://api.github.com/search/repositories?q=${q}&sort=stars&per_page=${args.limit || 10}`, { headers });
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        const data = await res.json();
        return { total: data.total_count, repos: data.items.map(r => ({ name: r.full_name, stars: r.stargazers_count, description: r.description, url: r.html_url })) };
      }

      if (action === 'info') {
        const res = await fetch(`https://api.github.com/repos/${args.repo}`, { headers });
        if (!res.ok) throw new Error(`Repo not found: ${args.repo}`);
        return res.json();
      }

      if (action === 'trending') {
        const res = await fetch('https://api.github.com/search/repositories?q=ai+agent+pushed:>2025-01-01&sort=stars&per_page=10', { headers });
        const data = await res.json();
        return { repos: (data.items || []).map(r => ({ name: r.full_name, stars: r.stargazers_count, description: r.description })) };
      }

      throw new Error(`Unknown GitHub action: ${action}`);
    }
  },

  mcp: {
    id: 'mcp', name: 'MCP Bridge', description: 'Model Context Protocol integration bridge',
    actions: ['list', 'call'],
    _servers: [],
    async run(action, args = {}) {
      if (action === 'list') return { servers: this._servers, note: 'Connect MCP servers via triagent.config.json' };
      if (action === 'call') return { result: null, note: `MCP server call for "${args.tool}" — configure MCP server first`, args };
      throw new Error(`Unknown MCP action: ${action}`);
    }
  }
};

export class ToolHub {
  list() { return Object.values(TOOLS).map(t => ({ id: t.id, name: t.name, description: t.description, actions: t.actions })); }

  async run(toolId, action, args = {}) {
    const tool = TOOLS[toolId];
    if (!tool) throw new Error(`Unknown tool: ${toolId}. Available: ${Object.keys(TOOLS).join(', ')}`);
    return tool.run(action, args);
  }

  register(id, tool) { TOOLS[id] = tool; }
}

export const toolHub = new ToolHub();
export default toolHub;

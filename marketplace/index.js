// marketplace/index.js — TriAgentOS TriPlugin Marketplace
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const MARKET_DIR  = join(homedir(), '.triagentos', 'plugins');
const REGISTRY_FILE = join(MARKET_DIR, 'installed.json');

// Plugin spec: what a valid plugin.json must contain
export const PLUGIN_SPEC = {
  required: ['name', 'version', 'description', 'type', 'author'],
  optional: ['commands', 'agents', 'tools', 'hooks', 'dependencies', 'license', 'homepage'],
  types:    ['agent', 'command', 'tool', 'integration', 'theme']
};

// Community plugins directory (built-in listing)
const COMMUNITY_PLUGINS = [
  { id: 'tri-notion',      name: 'TriNotion',       version: '0.1.0', description: 'Notion integration — read/write pages and databases', type: 'integration', author: 'community', stars: 0, installCmd: 'tri plugin install tri-notion' },
  { id: 'tri-github',      name: 'TriGitHub',       version: '0.2.0', description: 'GitHub tool — PRs, issues, code search', type: 'integration', author: 'community', stars: 0, installCmd: 'tri plugin install tri-github' },
  { id: 'tri-slack',       name: 'TriSlack',        version: '0.1.0', description: 'Slack integration — send messages, search channels', type: 'integration', author: 'community', stars: 0, installCmd: 'tri plugin install tri-slack' },
  { id: 'tri-translate',   name: 'TriTranslate',    version: '0.1.0', description: 'Translate text to any language using AI', type: 'command', author: 'community', stars: 0, installCmd: 'tri plugin install tri-translate' },
  { id: 'tri-sql',         name: 'TriSQL',          version: '0.1.0', description: 'Natural language to SQL queries', type: 'tool', author: 'community', stars: 0, installCmd: 'tri plugin install tri-sql' },
  { id: 'tri-legal',       name: 'TriLegal',        version: '0.1.0', description: 'Legal document analysis and contract review', type: 'agent', author: 'community', stars: 0, installCmd: 'tri plugin install tri-legal' },
  { id: 'tri-finance',     name: 'TriFinance',      version: '0.1.0', description: 'Financial analysis, modeling, and forecasting agent', type: 'agent', author: 'community', stars: 0, installCmd: 'tri plugin install tri-finance' }
];

function ensureDir() { if (!existsSync(MARKET_DIR)) mkdirSync(MARKET_DIR, { recursive: true }); }
function loadInstalled() { ensureDir(); if (!existsSync(REGISTRY_FILE)) return {}; try { return JSON.parse(readFileSync(REGISTRY_FILE, 'utf8')); } catch { return {}; } }
function saveInstalled(r) { writeFileSync(REGISTRY_FILE, JSON.stringify(r, null, 2)); }

export class Marketplace {
  list(opts = {}) {
    const installed = loadInstalled();
    return COMMUNITY_PLUGINS.map(p => ({ ...p, installed: !!installed[p.id] })).filter(p => !opts.type || p.type === opts.type);
  }

  validate(pluginJson) {
    const errors = [];
    for (const field of PLUGIN_SPEC.required) {
      if (!pluginJson[field]) errors.push(`Missing required field: "${field}"`);
    }
    if (pluginJson.type && !PLUGIN_SPEC.types.includes(pluginJson.type)) {
      errors.push(`Invalid type: "${pluginJson.type}". Must be: ${PLUGIN_SPEC.types.join(', ')}`);
    }
    if (pluginJson.version && !/^\d+\.\d+\.\d+/.test(pluginJson.version)) {
      errors.push(`Version "${pluginJson.version}" must follow semver (e.g. 1.0.0)`);
    }
    return { valid: errors.length === 0, errors };
  }

  install(pluginId, opts = {}) {
    const plugin = COMMUNITY_PLUGINS.find(p => p.id === pluginId);
    if (!plugin) return { success: false, error: `Plugin "${pluginId}" not found. Run 'tri plugin list' to see available plugins.` };
    const installed = loadInstalled();
    if (installed[pluginId] && !opts.force) return { success: false, error: `Plugin "${pluginId}" already installed. Use --force to reinstall.` };
    installed[pluginId] = { ...plugin, installedAt: new Date().toISOString() };
    saveInstalled(installed);
    return { success: true, plugin, message: `✓ ${plugin.name} installed successfully` };
  }

  uninstall(pluginId) {
    const installed = loadInstalled();
    if (!installed[pluginId]) return { success: false, error: `Plugin "${pluginId}" not installed` };
    delete installed[pluginId];
    saveInstalled(installed);
    return { success: true, message: `✓ ${pluginId} uninstalled` };
  }

  getInstalled() { return Object.values(loadInstalled()); }

  createTemplate(opts = {}) {
    return {
      name:        opts.name || 'my-plugin',
      version:     '0.1.0',
      description: opts.description || 'A TriAgentOS plugin',
      type:        opts.type || 'command',
      author:      opts.author || 'Your Name',
      license:     'MIT',
      homepage:    'https://github.com/your-repo/my-plugin',
      commands:    [{ name: 'my-command', description: 'My custom command', action: 'async (args) => { /* implement */ }' }],
      dependencies: {}
    };
  }
}

export const marketplace = new Marketplace();
export default marketplace;

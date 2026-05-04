// core/plugins.js — TriAgentOS Plugin Architecture
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PLUGIN_DIR = join(homedir(), '.triagentos', 'plugins');
const registry = new Map();

/**
 * Plugin interface that community plugins must implement
 *
 * @example
 * // ~/.triagentos/plugins/my-plugin/index.js
 * export default {
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   description: 'Does something cool',
 *   commands: [
 *     {
 *       name: 'mycommand',
 *       description: 'Run my custom command',
 *       options: [{ flags: '--option <val>', description: 'An option' }],
 *       action: async (args, opts) => { console.log('Running!'); }
 *     }
 *   ],
 *   agents: {
 *     myAgent: {
 *       name: 'My Custom Agent',
 *       emoji: '🤖',
 *       role: 'Custom Role',
 *       systemPrompt: 'You are...',
 *       capabilities: ['skill1']
 *     }
 *   },
 *   hooks: {
 *     beforeCall: async (params) => params,  // Modify params before API call
 *     afterCall: async (result) => result,   // Modify result after API call
 *   }
 * }
 */

export class PluginManager {
  static async loadAll() {
    if (!existsSync(PLUGIN_DIR)) return;

    const dirs = readdirSync(PLUGIN_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const dir of dirs) {
      await this.load(join(PLUGIN_DIR, dir));
    }
  }

  static async load(pluginPath) {
    const indexPath = join(pluginPath, 'index.js');
    if (!existsSync(indexPath)) return false;

    try {
      const plugin = (await import(indexPath)).default;
      if (!plugin?.name) throw new Error('Plugin missing name');
      registry.set(plugin.name, plugin);
      return true;
    } catch (err) {
      console.warn(`⚠ Failed to load plugin at ${pluginPath}: ${err.message}`);
      return false;
    }
  }

  static getAll() { return [...registry.values()]; }

  static get(name) { return registry.get(name); }

  static getCommands() {
    return this.getAll().flatMap(p => (p.commands || []).map(c => ({ ...c, plugin: p.name })));
  }

  static getAgents() {
    const agents = {};
    for (const plugin of this.getAll()) {
      if (plugin.agents) Object.assign(agents, plugin.agents);
    }
    return agents;
  }

  static async runHook(hookName, data) {
    let result = data;
    for (const plugin of this.getAll()) {
      if (plugin.hooks?.[hookName]) {
        result = await plugin.hooks[hookName](result);
      }
    }
    return result;
  }

  static list() {
    return this.getAll().map(p => ({
      name: p.name,
      version: p.version || '?',
      description: p.description || '',
      commands: (p.commands || []).length,
      agents: Object.keys(p.agents || {}).length
    }));
  }
}

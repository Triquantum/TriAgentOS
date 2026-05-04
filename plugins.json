// core/router/index.js — TriAgentOS TriRouter
// Routes prompts to the best model by cost / latency / privacy / quality / context
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROVIDERS = {
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', keyEnv: 'ANTHROPIC_API_KEY', models: ['claude-opus-4-5','claude-sonnet-4-5','claude-haiku-4-5'], tier: 'frontier' },
  openai:    { baseUrl: 'https://api.openai.com/v1',    keyEnv: 'OPENAI_API_KEY',    models: ['gpt-4o','gpt-4o-mini','o1-mini'],                           tier: 'frontier' },
  gemini:    { baseUrl: 'https://generativelanguage.googleapis.com', keyEnv: 'GEMINI_API_KEY', models: ['gemini-1.5-pro','gemini-1.5-flash'], tier: 'frontier' },
  groq:      { baseUrl: 'https://api.groq.com/openai/v1', keyEnv: 'GROQ_API_KEY',    models: ['llama-3.1-70b-versatile','llama-3.1-8b-instant'],           tier: 'fast' },
  deepseek:  { baseUrl: 'https://api.deepseek.com/v1',  keyEnv: 'DEEPSEEK_API_KEY',  models: ['deepseek-chat','deepseek-coder'],                           tier: 'cost' },
  mistral:   { baseUrl: 'https://api.mistral.ai/v1',    keyEnv: 'MISTRAL_API_KEY',   models: ['mistral-large-latest','mistral-small-latest'],              tier: 'balanced' },
  ollama:    { baseUrl: 'http://localhost:11434',        keyEnv: null,                models: ['llama3','mistral','codellama','phi3'],                      tier: 'local' },
  grok:      { baseUrl: 'https://api.x.ai/v1',          keyEnv: 'XAI_API_KEY',       models: ['grok-beta'],                                               tier: 'frontier' },
  qwen:      { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', keyEnv: 'DASHSCOPE_API_KEY', models: ['qwen-turbo','qwen-max'],              tier: 'cost' },
  custom:    { baseUrl: null,                            keyEnv: 'CUSTOM_API_KEY',    models: ['custom-model'],                                            tier: 'custom' }
};

const COST_TABLE = {
  'claude-opus-4-5':          { input: 15,    output: 75,   context: 200000 },
  'claude-sonnet-4-5':        { input: 3,     output: 15,   context: 200000 },
  'claude-haiku-4-5':         { input: 0.25,  output: 1.25, context: 200000 },
  'gpt-4o':                   { input: 5,     output: 15,   context: 128000 },
  'gpt-4o-mini':              { input: 0.15,  output: 0.60, context: 128000 },
  'gemini-1.5-pro':           { input: 3.5,   output: 10.5, context: 1000000 },
  'gemini-1.5-flash':         { input: 0.075, output: 0.30, context: 1000000 },
  'llama-3.1-70b-versatile':  { input: 0.59,  output: 0.79, context: 131072 },
  'llama-3.1-8b-instant':     { input: 0.05,  output: 0.08, context: 131072 },
  'deepseek-chat':            { input: 0.14,  output: 0.28, context: 64000 },
  'deepseek-coder':           { input: 0.14,  output: 0.28, context: 64000 },
  'mistral-large-latest':     { input: 4,     output: 12,   context: 32000 },
  'mistral-small-latest':     { input: 1,     output: 3,    context: 32000 },
  'grok-beta':                { input: 5,     output: 15,   context: 131072 },
  'qwen-turbo':               { input: 0.50,  output: 1.50, context: 32000 },
  'qwen-max':                 { input: 1.60,  output: 6.40, context: 32000 },
  'llama3':                   { input: 0,     output: 0,    context: 8192 },
  'codellama':                { input: 0,     output: 0,    context: 16384 }
};

const TASK_PROFILES = {
  code:        { keywords: ['code','function','debug','refactor','sql','bug','test','implement','class','algorithm','fix','compile'], preferred: ['anthropic','openai','deepseek'] },
  analysis:    { keywords: ['analyze','compare','evaluate','assess','review','audit','research','explain','summarize','report'], preferred: ['anthropic','gemini','openai'] },
  creative:    { keywords: ['write','story','essay','blog','poem','creative','draft','content','marketing','copy','generate'], preferred: ['anthropic','openai','mistral'] },
  fast:        { keywords: ['quick','fast','simple','short','brief','translate','classify','tag','list','one-word'], preferred: ['groq','anthropic'] },
  longContext: { keywords: ['long document','entire file','full codebase','book','transcript','100k','large file'], preferred: ['gemini','anthropic'] },
  local:       { keywords: ['local','private','offline','no api','self-hosted','confidential'], preferred: ['ollama'] },
  cost:        { keywords: ['cheap','budget','low cost','free','economical'], preferred: ['deepseek','groq','ollama'] },
  code_cheap:  { keywords: ['fix this','simple function','one liner','small script'], preferred: ['deepseek','groq'] }
};

export class TriRouter {
  static route(task, opts = {}) {
    if (opts.forceProvider) {
      const p = PROVIDERS[opts.forceProvider] || PROVIDERS.openai;
      const model = opts.model || p.models[0];
      return { provider: opts.forceProvider, model, taskType: 'manual', reason: `Forced to ${opts.forceProvider}`, cost: this._cost(model, task.length) };
    }

    const taskType = this._classify(task);
    const profile  = TASK_PROFILES[taskType] || TASK_PROFILES.analysis;
    let ordered    = [...profile.preferred];

    if (opts.preferCost)    ordered = this._sortByCost(ordered);
    if (opts.preferSpeed)   ordered = ['groq', ...ordered.filter(p => p !== 'groq')];
    if (opts.preferPrivacy) ordered = ['ollama', ...ordered.filter(p => p !== 'ollama')];
    if (opts.preferQuality) ordered = ['anthropic', ...ordered.filter(p => p !== 'anthropic')];

    for (const provider of ordered) {
      const p = PROVIDERS[provider];
      if (!p) continue;
      const hasKey = p.keyEnv === null || process.env[p.keyEnv];
      if (hasKey) {
        const model = opts.model || p.models[0];
        return { provider, model, taskType, reason: this._reason(taskType, opts), cost: this._cost(model, task.length) };
      }
    }

    // Fallback: ollama (always available if installed)
    return { provider: 'ollama', model: 'llama3', taskType, reason: 'Fallback — no API keys found, using local Ollama', cost: 'Free' };
  }

  static _classify(text) {
    const lower = text.toLowerCase();
    let best = 'analysis', bestScore = 0;
    for (const [type, profile] of Object.entries(TASK_PROFILES)) {
      const score = profile.keywords.filter(k => lower.includes(k)).length;
      if (score > bestScore) { best = type; bestScore = score; }
    }
    return best;
  }

  static _sortByCost(providers) {
    return [...providers].sort((a, b) => {
      const modelA = PROVIDERS[a]?.models[0];
      const modelB = PROVIDERS[b]?.models[0];
      return (COST_TABLE[modelA]?.input || 999) - (COST_TABLE[modelB]?.input || 999);
    });
  }

  static _reason(type, opts) {
    const reasons = { code: 'Code tasks need strong reasoning', analysis: 'Analysis needs deep comprehension', creative: 'Creative output', fast: 'Speed-optimized', longContext: 'Long context window required', local: 'Privacy — local inference', cost: 'Cost-optimized' };
    const pref = opts.preferCost ? ' (cost)' : opts.preferSpeed ? ' (speed)' : opts.preferQuality ? ' (quality)' : '';
    return (reasons[type] || 'General task') + pref;
  }

  static _cost(model, promptLen) {
    const c = COST_TABLE[model];
    if (!c) return 'unknown';
    if (c.input === 0) return 'Free (local)';
    const tokens = Math.ceil(promptLen / 4);
    return `~$${((tokens / 1_000_000) * c.input).toFixed(6)}`;
  }

  static getProviders() { return Object.entries(PROVIDERS).map(([id, p]) => ({ id, ...p })); }
  static getCostTable() { return COST_TABLE; }
  static getAllModels()  {
    return Object.entries(COST_TABLE).map(([model, c]) => ({
      model, contextK: Math.round(c.context / 1000),
      inputPer1M: c.input === 0 ? 'Free' : `$${c.input}`,
      outputPer1M: c.output === 0 ? 'Free' : `$${c.output}`
    }));
  }
}

export const COSTS = COST_TABLE;
export default TriRouter;

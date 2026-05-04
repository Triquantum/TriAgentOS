// core/router.js — TriAgentOS Smart Model Router
// Analyzes tasks and routes to the optimal model based on capability, cost, and availability

import { config } from './config.js';

// Task capability profiles
const TASK_PROFILES = {
  code: {
    keywords: ['code', 'function', 'debug', 'refactor', 'api', 'sql', 'script', 'bug', 'test', 'implement', 'class', 'algorithm'],
    preferred: ['anthropic', 'openai', 'groq'],
    models: { anthropic: 'claude-opus-4-5', openai: 'gpt-4o', groq: 'llama-3.1-70b-versatile' }
  },
  analysis: {
    keywords: ['analyze', 'compare', 'evaluate', 'assess', 'review', 'audit', 'research', 'explain', 'summarize'],
    preferred: ['anthropic', 'openai', 'gemini'],
    models: { anthropic: 'claude-sonnet-4-5', openai: 'gpt-4o', gemini: 'gemini-1.5-pro' }
  },
  creative: {
    keywords: ['write', 'story', 'essay', 'blog', 'poem', 'creative', 'draft', 'content', 'marketing', 'copy'],
    preferred: ['anthropic', 'openai', 'groq'],
    models: { anthropic: 'claude-opus-4-5', openai: 'gpt-4o', groq: 'mixtral-8x7b-32768' }
  },
  fast: {
    keywords: ['quick', 'fast', 'simple', 'short', 'brief', 'translate', 'classify', 'tag'],
    preferred: ['groq', 'anthropic', 'openai'],
    models: { groq: 'llama-3.1-8b-instant', anthropic: 'claude-haiku-4-5', openai: 'gpt-4o-mini' }
  },
  vision: {
    keywords: ['image', 'photo', 'picture', 'screenshot', 'diagram', 'chart', 'visual', 'describe image'],
    preferred: ['openai', 'anthropic', 'gemini'],
    models: { openai: 'gpt-4o', anthropic: 'claude-opus-4-5', gemini: 'gemini-1.5-pro' }
  },
  local: {
    keywords: ['local', 'private', 'offline', 'no api', 'self-hosted'],
    preferred: ['ollama'],
    models: { ollama: 'llama3' }
  },
  longContext: {
    keywords: ['long document', 'entire file', 'full codebase', 'book', 'transcript', '100k', 'large'],
    preferred: ['gemini', 'anthropic'],
    models: { gemini: 'gemini-1.5-pro', anthropic: 'claude-opus-4-5' }
  }
};

// Cost per 1M tokens (input / output) in USD
const COST_TABLE = {
  'claude-opus-4-5':         { input: 15,    output: 75 },
  'claude-sonnet-4-5':       { input: 3,     output: 15 },
  'claude-haiku-4-5':        { input: 0.25,  output: 1.25 },
  'gpt-4o':                  { input: 5,     output: 15 },
  'gpt-4o-mini':             { input: 0.15,  output: 0.60 },
  'gemini-1.5-pro':          { input: 3.5,   output: 10.5 },
  'gemini-1.5-flash':        { input: 0.075, output: 0.30 },
  'llama-3.1-70b-versatile': { input: 0.59,  output: 0.79 },
  'llama-3.1-8b-instant':    { input: 0.05,  output: 0.08 },
  'llama3':                  { input: 0,     output: 0 }
};

export class Router {
  /**
   * Analyze a task and return the best provider + model
   * @param {string} task - The user's prompt
   * @param {object} opts - { preferCost, preferSpeed, preferQuality, forceProvider }
   */
  static route(task, opts = {}) {
    if (opts.forceProvider) {
      const provider = opts.forceProvider;
      const profile = Object.values(TASK_PROFILES).find(p => p.preferred.includes(provider));
      return {
        provider,
        model: profile?.models[provider] || config.get(`providers.${provider}.model`),
        reason: `Forced to ${provider}`,
        taskType: 'manual',
        estimatedCost: 'varies'
      };
    }

    const taskType = this._classifyTask(task);
    const profile = TASK_PROFILES[taskType];

    // Apply preference modifiers
    let orderedProviders = [...profile.preferred];
    if (opts.preferCost)    orderedProviders = this._sortByCost(profile);
    if (opts.preferSpeed)   orderedProviders = this._sortBySpeed(profile);
    if (opts.preferQuality) orderedProviders = this._sortByQuality(profile);

    // Pick first available
    for (const provider of orderedProviders) {
      const hasKey = provider === 'ollama' || config.getApiKey(provider);
      if (hasKey) {
        return {
          provider,
          model: profile.models[provider] || config.get(`providers.${provider}.model`),
          taskType,
          reason: this._getReason(taskType, provider, opts),
          estimatedCost: this._estimateCost(profile.models[provider], task.length)
        };
      }
    }

    // Fallback to any configured provider
    const fallback = config.getBestAvailableProvider();
    if (!fallback) throw new Error('No AI provider configured. Run: tri setup');

    return {
      provider: fallback,
      model: config.get(`providers.${fallback}.model`),
      taskType,
      reason: 'Fallback — configure more providers for better routing',
      estimatedCost: 'unknown'
    };
  }

  static _classifyTask(text) {
    const lower = text.toLowerCase();
    const scores = {};

    for (const [type, profile] of Object.entries(TASK_PROFILES)) {
      scores[type] = profile.keywords.filter(kw => lower.includes(kw)).length;
    }

    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return best[1] > 0 ? best[0] : 'analysis'; // default to analysis
  }

  static _sortByCost(profile) {
    return [...profile.preferred].sort((a, b) => {
      const costA = COST_TABLE[profile.models[a]]?.input || 999;
      const costB = COST_TABLE[profile.models[b]]?.input || 999;
      return costA - costB;
    });
  }

  static _sortBySpeed(profile) {
    const speedOrder = ['groq', 'openai', 'anthropic', 'gemini', 'ollama'];
    return [...profile.preferred].sort((a, b) => speedOrder.indexOf(a) - speedOrder.indexOf(b));
  }

  static _sortByQuality(profile) {
    const qualityOrder = ['anthropic', 'openai', 'gemini', 'groq', 'ollama'];
    return [...profile.preferred].sort((a, b) => qualityOrder.indexOf(a) - qualityOrder.indexOf(b));
  }

  static _getReason(taskType, provider, opts) {
    const reasons = {
      code:        'Code tasks benefit from strong reasoning models',
      analysis:    'Analysis tasks need deep comprehension',
      creative:    'Creative tasks need nuanced language generation',
      fast:        'Simple tasks use fast, cost-efficient models',
      vision:      'Vision tasks require multimodal models',
      local:       'Local inference for privacy',
      longContext: 'Long context window required',
      analysis:    'General task, using best available model'
    };
    const pref = opts.preferCost ? ' (cost-optimized)' : opts.preferSpeed ? ' (speed-optimized)' : opts.preferQuality ? ' (quality-optimized)' : '';
    return (reasons[taskType] || 'General task') + pref;
  }

  static _estimateCost(model, promptLen) {
    const costs = COST_TABLE[model];
    if (!costs) return 'unknown';
    if (costs.input === 0) return 'Free (local)';
    const approxTokens = Math.ceil(promptLen / 4);
    const est = ((approxTokens / 1_000_000) * costs.input).toFixed(6);
    return `~$${est}`;
  }

  static getAllModels() {
    return Object.entries(COST_TABLE).map(([model, costs]) => ({
      model,
      provider: this._getProvider(model),
      costPer1MInput: costs.input === 0 ? 'Free' : `$${costs.input}`,
      costPer1MOutput: costs.output === 0 ? 'Free' : `$${costs.output}`
    }));
  }

  static _getProvider(model) {
    if (model.startsWith('claude')) return 'anthropic';
    if (model.startsWith('gpt'))    return 'openai';
    if (model.startsWith('gemini')) return 'gemini';
    if (model.startsWith('llama') || model.startsWith('mixtral')) return 'groq/ollama';
    return 'unknown';
  }
}

export const COSTS = COST_TABLE;

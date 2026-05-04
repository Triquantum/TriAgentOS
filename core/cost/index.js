// core/cost/index.js — TriAgentOS TriCost Engine
// Estimate task cost, provider profiles, cheapest-best suggestion

const PROVIDER_PROFILES = {
  anthropic: {
    models: {
      'claude-opus-4-5':   { input: 15,    output: 75,   context: 200000, quality: 10, speed: 6 },
      'claude-sonnet-4-5': { input: 3,     output: 15,   context: 200000, quality: 9,  speed: 7 },
      'claude-haiku-4-5':  { input: 0.25,  output: 1.25, context: 200000, quality: 7,  speed: 9 }
    }
  },
  openai: {
    models: {
      'gpt-4o':      { input: 5,    output: 15,   context: 128000, quality: 9,  speed: 8 },
      'gpt-4o-mini': { input: 0.15, output: 0.60, context: 128000, quality: 7,  speed: 9 }
    }
  },
  gemini: {
    models: {
      'gemini-1.5-pro':   { input: 3.5,   output: 10.5, context: 1000000, quality: 8, speed: 7 },
      'gemini-1.5-flash': { input: 0.075, output: 0.30, context: 1000000, quality: 7, speed: 9 }
    }
  },
  groq: {
    models: {
      'llama-3.1-70b-versatile': { input: 0.59, output: 0.79, context: 131072, quality: 7, speed: 10 },
      'llama-3.1-8b-instant':    { input: 0.05, output: 0.08, context: 131072, quality: 6, speed: 10 }
    }
  },
  deepseek: {
    models: {
      'deepseek-chat':  { input: 0.14, output: 0.28, context: 64000, quality: 7, speed: 7 },
      'deepseek-coder': { input: 0.14, output: 0.28, context: 64000, quality: 8, speed: 7 }
    }
  },
  ollama: {
    models: {
      'llama3':    { input: 0, output: 0, context: 8192,  quality: 6, speed: 5 },
      'codellama': { input: 0, output: 0, context: 16384, quality: 7, speed: 5 }
    }
  }
};

export class CostEngine {
  estimate(task, opts = {}) {
    const estimatedTokens = this._estimateTokens(task);
    const outputTokens    = opts.outputTokens || Math.round(estimatedTokens * 0.6);

    const estimates = [];
    for (const [provider, data] of Object.entries(PROVIDER_PROFILES)) {
      for (const [model, profile] of Object.entries(data.models)) {
        const inputCost  = (estimatedTokens  / 1_000_000) * profile.input;
        const outputCost = (outputTokens / 1_000_000) * profile.output;
        const total      = inputCost + outputCost;
        estimates.push({
          provider, model,
          inputTokens:  estimatedTokens,
          outputTokens,
          inputCost:  `$${inputCost.toFixed(6)}`,
          outputCost: `$${outputCost.toFixed(6)}`,
          totalCost:  total === 0 ? 'Free' : `$${total.toFixed(6)}`,
          totalRaw:   total,
          quality:    profile.quality,
          speed:      profile.speed,
          context:    profile.context,
          score:      this._valueScore(total, profile.quality, profile.speed)
        });
      }
    }

    estimates.sort((a, b) => b.score - a.score);

    return {
      task:          task.slice(0, 100) + (task.length > 100 ? '...' : ''),
      estimatedTokens,
      estimates,
      cheapest:      [...estimates].sort((a, b) => a.totalRaw - b.totalRaw)[0],
      bestValue:     estimates[0],
      fastest:       [...estimates].sort((a, b) => b.speed - a.speed)[0],
      highestQuality:[...estimates].sort((a, b) => b.quality - a.quality)[0]
    };
  }

  _estimateTokens(text) { return Math.ceil(text.length / 4); }

  _valueScore(cost, quality, speed) {
    const costScore = cost === 0 ? 5 : Math.max(0, 5 - Math.log10(cost + 0.000001) * 2);
    return quality * 0.5 + speed * 0.3 + costScore * 0.2;
  }

  calculateActual(model, inputTokens, outputTokens) {
    for (const [provider, data] of Object.entries(PROVIDER_PROFILES)) {
      if (data.models[model]) {
        const profile    = data.models[model];
        const inputCost  = (inputTokens  / 1_000_000) * profile.input;
        const outputCost = (outputTokens / 1_000_000) * profile.output;
        const total      = inputCost + outputCost;
        return { provider, model, inputTokens, outputTokens, inputCost: `$${inputCost.toFixed(6)}`, outputCost: `$${outputCost.toFixed(6)}`, total: total === 0 ? 'Free' : `$${total.toFixed(6)}` };
      }
    }
    return { error: `Unknown model: ${model}` };
  }

  getSuggestion(task, budget = null) {
    const { estimates, cheapest, bestValue } = this.estimate(task);
    const free = estimates.filter(e => e.totalRaw === 0);
    if (budget !== null && budget === 0) return { recommendation: free[0] || cheapest, reason: 'Free tier (Ollama)' };
    return { recommendation: bestValue, reason: 'Best value: balanced quality, speed, and cost' };
  }

  allProviders() { return PROVIDER_PROFILES; }
}

export const costEngine = new CostEngine();
export default costEngine;

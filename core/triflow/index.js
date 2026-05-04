// core/triflow/index.js — TriAgentOS TriFlow Engine
// Planner → Executor → Validator → Repair loops, self-healing chains
import { callModel } from '../../models/adapters/index.js';
import { TriRouter } from '../router/index.js';
import { randomUUID } from 'crypto';

export class TriFlow {
  constructor(name, opts = {}) {
    this.id      = randomUUID().slice(0, 8);
    this.name    = name;
    this.steps   = [];
    this.opts    = opts;
    this.results = [];
    this.status  = 'idle';
    this.maxRetries = opts.maxRetries || 2;
  }

  step(name, fn, opts = {}) { this.steps.push({ name, fn, opts, retries: 0 }); return this; }
  agentStep(name, prompt, agentSystem, opts = {}) {
    return this.step(name, async (ctx) => {
      const route = TriRouter.route(prompt, this.opts);
      const fullPrompt = typeof prompt === 'function' ? prompt(ctx) : prompt;
      const result = await callModel(route.provider, { messages: [{ role: 'user', content: fullPrompt }], system: agentSystem, model: route.model, maxTokens: opts.maxTokens || 1024, temperature: opts.temperature || 0.7 });
      return result.content;
    }, opts);
  }

  async run(input = {}) {
    this.status  = 'running';
    const ctx    = { input, results: {}, flowId: this.id, flowName: this.name };
    this.results = [];

    for (const step of this.steps) {
      const stepStart = Date.now();
      let success = false, lastError = null, output;

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          output  = await step.fn(ctx);
          success = true;
          if (step.opts.validator) {
            const valid = await step.opts.validator(output, ctx);
            if (!valid.ok) {
              if (attempt < this.maxRetries && step.opts.repair) {
                output = await step.opts.repair(output, valid.reason, ctx);
                success = true;
              } else {
                throw new Error(`Validation failed: ${valid.reason}`);
              }
            }
          }
          break;
        } catch (err) {
          lastError = err;
          if (attempt < this.maxRetries) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); }
        }
      }

      const result = { step: step.name, success, output: success ? output : null, error: success ? null : lastError?.message, durationMs: Date.now() - stepStart, attempts: step.retries + 1 };
      this.results.push(result);
      ctx.results[step.name] = success ? output : null;

      if (!success && !step.opts.optional) {
        this.status = 'failed';
        return { flowId: this.id, name: this.name, status: 'failed', failedStep: step.name, results: this.results };
      }
    }

    this.status = 'completed';
    return { flowId: this.id, name: this.name, status: 'completed', results: this.results, finalOutput: this.results.at(-1)?.output };
  }
}

// ── Built-in flow templates ──────────────────────────────────────────────────
export const BUILT_IN_FLOWS = {
  'research-and-write': {
    name: 'Research & Write',
    description: 'Research a topic then write high-quality content',
    create: () => new TriFlow('research-and-write')
      .agentStep('research', (ctx) => `Research key facts, data points, and insights about: ${ctx.input.topic || ctx.input}`, 'You are a research analyst. Provide factual, well-sourced insights.')
      .agentStep('write', (ctx) => `Write a comprehensive article about: ${ctx.input.topic || ctx.input}\n\nResearch findings: ${ctx.results.research}`, 'You are a content writer. Write engaging, informative content.')
      .agentStep('improve', (ctx) => `Improve and polish this article. Make it more engaging and correct any issues:\n\n${ctx.results.write}`, 'You are an editor. Improve clarity, flow, and impact.')
  },
  'code-review-fix': {
    name: 'Code Review & Fix',
    description: 'Review code for issues then fix them',
    create: () => new TriFlow('code-review-fix')
      .agentStep('review', (ctx) => `Review this code for bugs, security issues, and improvements:\n\n${ctx.input.code || ctx.input}`, 'You are a senior code reviewer. Be specific and actionable.')
      .agentStep('fix', (ctx) => `Fix the issues identified in this review:\n\nOriginal code:\n${ctx.input.code || ctx.input}\n\nReview:\n${ctx.results.review}`, 'You are a senior developer. Fix all identified issues.')
      .agentStep('test', (ctx) => `Write unit tests for the fixed code:\n\n${ctx.results.fix}`, 'You are a QA engineer. Write comprehensive tests.')
  },
  'startup-analysis': {
    name: 'Startup Analysis',
    description: 'Full startup viability analysis',
    create: () => new TriFlow('startup-analysis')
      .agentStep('market', (ctx) => `Analyze market size, competitors, and opportunity for: ${ctx.input}`, 'You are a market analyst. Be specific with numbers.')
      .agentStep('model', (ctx) => `Design the optimal business model for: ${ctx.input}\nMarket context: ${ctx.results.market}`, 'You are a business strategist. Focus on monetization.')
      .agentStep('risks', (ctx) => `Identify top 5 risks and mitigations for: ${ctx.input}`, 'You are a risk analyst. Be direct and practical.')
      .agentStep('verdict', (ctx) => `Give a go/no-go verdict with reasoning for: ${ctx.input}\nMarket: ${ctx.results.market}\nModel: ${ctx.results.model}\nRisks: ${ctx.results.risks}`, 'You are a VC partner. Be decisive.')
  }
};

export function listFlows() {
  return Object.entries(BUILT_IN_FLOWS).map(([id, f]) => ({ id, name: f.name, description: f.description }));
}

export async function runFlow(id, input) {
  const template = BUILT_IN_FLOWS[id];
  if (!template) throw new Error(`Flow "${id}" not found. Available: ${Object.keys(BUILT_IN_FLOWS).join(', ')}`);
  const flow = template.create();
  return flow.run(input);
}

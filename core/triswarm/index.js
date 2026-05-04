// core/triswarm/index.js — TriAgentOS TriSwarm Engine
// Multi-agent orchestration: debate, consensus, chain-of-command
import { callModel } from '../../models/adapters/index.js';
import { TriRouter } from '../router/index.js';

const AGENT_PROFILES = {
  ceo:      { emoji: '🎯', role: 'CEO',              system: 'You are a visionary CEO. Give strategic, decisive leadership perspective. Focus on market, vision, team, and execution.' },
  cto:      { emoji: '🔧', role: 'CTO',              system: 'You are a senior CTO. Give technical architecture, scalability, and engineering excellence perspective.' },
  cfo:      { emoji: '💰', role: 'CFO',              system: 'You are a CFO. Focus on financial sustainability, unit economics, burn rate, ROI, and fiscal responsibility.' },
  designer: { emoji: '🎨', role: 'Designer',         system: 'You are a senior UX/Product Designer. Focus on user experience, design systems, accessibility, and product delight.' },
  marketer: { emoji: '📈', role: 'Growth Marketer',  system: 'You are a data-driven growth marketer. Focus on CAC, LTV, growth loops, channels, and measurable ROI.' },
  researcher:{ emoji:'🔬', role: 'Researcher',       system: 'You are a research analyst. Provide evidence-based insights, market data, and competitive intelligence.' },
  qa:       { emoji: '🧪', role: 'QA Engineer',      system: 'You are a QA engineer. Identify edge cases, failure modes, quality risks, and testing strategies.' },
  security: { emoji: '🔐', role: 'Security Auditor', system: 'You are a security architect. Identify vulnerabilities, threat models, and security best practices.' }
};

export async function runSwarm(mission, agentKeys, mode = 'parallel', opts = {}) {
  const agents = agentKeys.map(k => {
    const profile = AGENT_PROFILES[k];
    if (!profile) throw new Error(`Unknown agent: ${k}. Available: ${Object.keys(AGENT_PROFILES).join(', ')}`);
    return { key: k, ...profile };
  });

  if (mode === 'parallel')         return _runParallel(mission, agents, opts);
  if (mode === 'debate')           return _runDebate(mission, agents, opts);
  if (mode === 'consensus')        return _runConsensus(mission, agents, opts);
  if (mode === 'chain-of-command') return _runChain(mission, agents, opts);
  throw new Error(`Unknown swarm mode: ${mode}. Use: parallel | debate | consensus | chain-of-command`);
}

async function _runParallel(mission, agents, opts) {
  const route = TriRouter.route(mission, opts);
  const results = await Promise.allSettled(agents.map(agent =>
    callModel(route.provider, { messages: [{ role: 'user', content: mission }], system: agent.system, model: route.model, maxTokens: 1024, temperature: 0.7 })
      .then(r => ({ agent, content: r.content, provider: route.provider, model: route.model }))
  ));
  return results.map((r, i) => ({
    agent: agents[i], success: r.status === 'fulfilled',
    content: r.status === 'fulfilled' ? r.value.content : null,
    error: r.status === 'rejected' ? r.reason?.message : null
  }));
}

async function _runDebate(mission, agents, opts) {
  const route     = TriRouter.route(mission, opts);
  const transcript = [];
  let lastResponse = '';
  for (let round = 0; round < (opts.rounds || 1); round++) {
    for (const agent of agents) {
      const prompt = lastResponse
        ? `Mission: ${mission}\n\nPrevious perspective: "${lastResponse.slice(0, 500)}"\n\nNow give your ${agent.role} perspective, engaging critically with the above:`
        : `Mission: ${mission}\n\nGive your opening ${agent.role} perspective:`;
      const result = await callModel(route.provider, { messages: [{ role: 'user', content: prompt }], system: agent.system, model: route.model, maxTokens: 512, temperature: 0.8 }).catch(e => ({ content: `[Error: ${e.message}]` }));
      lastResponse = result.content;
      transcript.push({ round: round + 1, agent, content: result.content });
    }
  }
  return transcript;
}

async function _runConsensus(mission, agents, opts) {
  // Phase 1: Individual views
  const individualResults = await _runParallel(mission, agents, opts);

  // Phase 2: Synthesize
  const route    = TriRouter.route(mission, opts);
  const views    = individualResults.filter(r => r.success).map(r => `${r.agent.role}: ${r.content}`).join('\n\n---\n\n');
  const synthesis = await callModel(route.provider, {
    messages: [{ role: 'user', content: `Mission: ${mission}\n\nMultiple expert perspectives:\n\n${views}\n\nSynthesize these into a consensus recommendation. Identify agreements, disagreements, and the strongest unified recommendation.` }],
    system: 'You are a strategic advisor synthesizing expert perspectives into consensus recommendations.',
    model: route.model, maxTokens: 1024, temperature: 0.5
  });

  return { mode: 'consensus', individual: individualResults, synthesis: synthesis.content };
}

async function _runChain(mission, agents, opts) {
  const route  = TriRouter.route(mission, opts);
  const results = [];
  let context   = mission;
  for (const agent of agents) {
    const prompt = results.length > 0
      ? `${mission}\n\nPrevious agent (${results.at(-1).agent.role}) recommended:\n${results.at(-1).content.slice(0, 400)}\n\nNow provide your ${agent.role} perspective and next steps:`
      : mission;
    const result = await callModel(route.provider, { messages: [{ role: 'user', content: prompt }], system: agent.system, model: route.model, maxTokens: 768, temperature: 0.7 }).catch(e => ({ content: `[Error: ${e.message}]` }));
    results.push({ agent, content: result.content, success: !result.content.startsWith('[Error') });
  }
  return results;
}

export function listAgents() {
  return Object.entries(AGENT_PROFILES).map(([key, a]) => ({ key, emoji: a.emoji, role: a.role }));
}

export { AGENT_PROFILES };

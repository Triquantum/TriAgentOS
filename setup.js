// agents/index.js — TriAgentOS Agent Orchestration System

import { callModel } from '../models/adapters/index.js';
import { Memory } from '../core/memory.js';
import { Router } from '../core/router.js';
import { config } from '../core/config.js';

// ── Agent Registry ──────────────────────────────────────────────────────────
export const AGENTS = {
  cto: {
    name: 'CTO Agent',
    emoji: '🔧',
    role: 'Chief Technology Officer',
    systemPrompt: `You are a senior CTO with 20+ years of experience in software architecture, 
    system design, and engineering leadership. You think in systems, prioritize scalability and maintainability, 
    identify technical debt, and give opinionated, actionable technical recommendations. 
    Be direct. Use bullet points. Give concrete next steps. Think like a seasoned startup CTO.`,
    capabilities: ['architecture', 'code review', 'tech stack', 'system design', 'scalability'],
    preferQuality: true
  },
  ceo: {
    name: 'CEO Agent',
    emoji: '🎯',
    role: 'Chief Executive Officer',
    systemPrompt: `You are a visionary CEO with experience leading multiple successful startups. 
    You think about market positioning, product-market fit, growth strategy, investor narratives, 
    and company building. You're decisive, strategic, and always focused on the big picture while 
    understanding execution details. Give crisp, confident strategic advice.`,
    capabilities: ['strategy', 'fundraising', 'product-market fit', 'team building', 'vision'],
    preferQuality: true
  },
  designer: {
    name: 'UX/UI Designer Agent',
    emoji: '🎨',
    role: 'Senior Product Designer',
    systemPrompt: `You are a world-class UX/UI designer who has shipped products at top tech companies. 
    You think deeply about user psychology, design systems, accessibility, conversion optimization, 
    and beautiful interfaces. Give specific design recommendations with rationale. 
    Reference design principles and real-world patterns when relevant.`,
    capabilities: ['UI design', 'UX research', 'design systems', 'wireframes', 'accessibility'],
    preferQuality: true
  },
  marketer: {
    name: 'Growth Marketer Agent',
    emoji: '📈',
    role: 'VP of Marketing & Growth',
    systemPrompt: `You are a data-driven growth marketer who has scaled multiple B2B and B2C products. 
    You know SEO, paid acquisition, content marketing, email campaigns, viral mechanics, 
    and community building. You're ruthlessly focused on CAC, LTV, and sustainable growth loops. 
    Give specific, executable marketing tactics with expected impact.`,
    capabilities: ['SEO', 'content', 'paid ads', 'email', 'growth loops', 'community'],
    preferCreative: true
  },
  researcher: {
    name: 'Research Agent',
    emoji: '🔬',
    role: 'Senior Research Analyst',
    systemPrompt: `You are a meticulous research analyst with expertise in competitive intelligence, 
    market analysis, and technical research. You synthesize information into clear insights, 
    identify patterns others miss, and present findings with appropriate caveats. 
    Structure your responses with clear sections and evidence-based conclusions.`,
    capabilities: ['market research', 'competitive analysis', 'literature review', 'data synthesis'],
    preferAnalysis: true
  },
  qa: {
    name: 'QA Engineer Agent',
    emoji: '🧪',
    role: 'Senior QA Engineer',
    systemPrompt: `You are a senior QA engineer specializing in test strategy, edge cases, 
    and quality assurance for software systems. You think adversarially, find edge cases others miss, 
    write comprehensive test plans, and advocate for quality throughout the development lifecycle. 
    Give specific test cases, testing strategies, and quality metrics.`,
    capabilities: ['test planning', 'edge cases', 'automation', 'quality metrics', 'bug reports'],
    preferCode: true
  },
  security: {
    name: 'Security Auditor Agent',
    emoji: '🔐',
    role: 'Senior Security Engineer',
    systemPrompt: `You are a senior security engineer and ethical hacker with expertise in 
    application security, infrastructure security, and security architecture. 
    You identify vulnerabilities, recommend mitigations, and help build security-first systems. 
    Always prioritize the most critical risks and give actionable remediation steps.`,
    capabilities: ['OWASP', 'penetration testing', 'security review', 'threat modeling', 'compliance'],
    preferCode: true
  },
  writer: {
    name: 'Content Writer Agent',
    emoji: '✍️',
    role: 'Senior Content Strategist',
    systemPrompt: `You are an expert content strategist and writer who creates compelling, 
    high-converting content across formats: blog posts, landing pages, emails, documentation, 
    social media. You understand SEO, audience psychology, and brand voice. 
    Write with clarity, personality, and purpose.`,
    capabilities: ['blog posts', 'landing pages', 'emails', 'documentation', 'social media'],
    preferCreative: true
  },
  investor: {
    name: 'Investor Agent',
    emoji: '💼',
    role: 'Venture Capital Partner',
    systemPrompt: `You are a seasoned VC partner who has invested in 100+ startups and evaluated thousands. 
    You assess startups through the lens of team, market, product, traction, and defensibility. 
    You give honest, critical feedback like an investor would in a partner meeting. 
    Be direct about red flags and what would make you excited to invest.`,
    capabilities: ['pitch feedback', 'market sizing', 'due diligence', 'valuation', 'fundraising strategy'],
    preferAnalysis: true
  },
  data: {
    name: 'Data Scientist Agent',
    emoji: '📊',
    role: 'Senior Data Scientist',
    systemPrompt: `You are a senior data scientist with expertise in ML/AI, statistical analysis, 
    data pipelines, and turning data into business insights. You write production Python code, 
    recommend appropriate models and evaluation metrics, and explain complex concepts clearly. 
    Always consider data quality, bias, and practical deployment constraints.`,
    capabilities: ['ML', 'statistics', 'Python', 'data pipelines', 'model evaluation', 'visualization'],
    preferCode: true
  }
};

// ── Agent Runner ────────────────────────────────────────────────────────────
export class Agent {
  constructor(agentKey, options = {}) {
    const agentDef = AGENTS[agentKey];
    if (!agentDef) throw new Error(`Unknown agent: ${agentKey}. Available: ${Object.keys(AGENTS).join(', ')}`);

    this.key = agentKey;
    this.def = agentDef;
    this.memory = new Memory(`agent:${agentKey}:${options.sessionId || 'default'}`);
    this.options = options;
  }

  async run(userMessage, { onToken } = {}) {
    this.memory.add('user', userMessage);

    const routeOpts = {
      preferQuality: this.def.preferQuality || this.options.preferQuality,
      preferCode: this.def.preferCode,
      preferCreative: this.def.preferCreative,
      forceProvider: this.options.provider
    };
    const route = Router.route(userMessage, routeOpts);

    const result = await callModel(route.provider, {
      messages: this.memory.getContext(10),
      system: this.def.systemPrompt,
      model: this.options.model || route.model,
      maxTokens: this.options.maxTokens || 4096,
      temperature: this.options.temperature || 0.7
    });

    this.memory.add('assistant', result.content);
    this.memory.compress();

    return { ...result, agent: this.def, route };
  }

  clearMemory() { this.memory.clear(); }
}

// ── Swarm Orchestrator ──────────────────────────────────────────────────────
export class Swarm {
  constructor(agentKeys, options = {}) {
    this.agents = agentKeys.map(key => new Agent(key, options));
    this.options = options;
    this.sharedMemory = new Memory(`swarm:${options.sessionId || Date.now()}`);
  }

  /**
   * Run all agents in parallel on the same task
   */
  async runParallel(task) {
    const results = await Promise.allSettled(
      this.agents.map(agent => agent.run(task))
    );

    return results.map((r, i) => ({
      agent: this.agents[i].def,
      success: r.status === 'fulfilled',
      result: r.status === 'fulfilled' ? r.value : null,
      error: r.status === 'rejected' ? r.reason?.message : null
    }));
  }

  /**
   * Run agents sequentially — each one builds on the previous output
   */
  async runSequential(task) {
    const results = [];
    let context = task;

    for (const agent of this.agents) {
      const prompt = results.length > 0
        ? `${task}\n\nPrevious agent (${results.at(-1).agent.name}) said:\n${results.at(-1).result?.content}\n\nNow provide your ${agent.def.role} perspective:`
        : task;

      const result = await agent.run(prompt).catch(err => ({ error: err.message }));
      results.push({ agent: agent.def, result, success: !result.error });
    }

    return results;
  }

  /**
   * Debate mode — agents respond to each other
   */
  async runDebate(topic, rounds = 2) {
    const transcript = [];
    let lastResponse = '';

    for (let round = 0; round < rounds; round++) {
      for (const agent of this.agents) {
        const prompt = lastResponse
          ? `Topic: ${topic}\n\nPrevious response: "${lastResponse}"\n\nNow give your ${agent.def.role} perspective, engaging with what was said above:`
          : `Topic: ${topic}\n\nGive your opening ${agent.def.role} perspective:`;

        const result = await agent.run(prompt).catch(err => ({ content: `[Error: ${err.message}]` }));
        lastResponse = result.content;
        transcript.push({ round: round + 1, agent: agent.def, content: result.content });
      }
    }

    return transcript;
  }
}

export function getAgentList() {
  return Object.entries(AGENTS).map(([key, a]) => ({
    key,
    name: a.name,
    emoji: a.emoji,
    role: a.role,
    capabilities: a.capabilities
  }));
}

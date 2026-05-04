// apps/index.js — TriAgentOS TriApp Store
import { callModel } from '../models/adapters/index.js';
import { TriRouter } from '../core/router/index.js';
import { runSwarm } from '../core/triswarm/index.js';
import { runFlow } from '../core/triflow/index.js';

export const APPS = {
  'startup-builder': {
    name: 'Startup Builder', emoji: '🚀',
    description: 'Generate a complete startup launch kit: market, model, GTM, MVP, fundraising',
    category: 'business',
    async run(input) {
      const idea  = input.idea || input;
      const route = TriRouter.route(idea, { preferQuality: true });
      const sections = await Promise.all([
        callModel(route.provider, { messages:[{role:'user',content:`Startup idea: "${idea}"\n\n1. Core problem (1 sentence)\n2. Target persona (specific)\n3. Current alternatives & why they fail\n4. Your unique insight\n5. Why now?`}], system:'You are a Y Combinator partner.', model:route.model, maxTokens:600 }),
        callModel(route.provider, { messages:[{role:'user',content:`Startup idea: "${idea}"\n\nProvide:\n1. TAM/SAM/SOM with reasoning\n2. Market growth rate\n3. Key tailwinds`}], system:'You are a market analyst.', model:route.model, maxTokens:500 }),
        callModel(route.provider, { messages:[{role:'user',content:`Startup idea: "${idea}"\n\nDesign:\n1. Revenue model\n2. Pricing tiers\n3. Unit economics targets\n4. Year 1 revenue milestone`}], system:'You are a business model expert.', model:route.model, maxTokens:500 }),
        callModel(route.provider, { messages:[{role:'user',content:`Startup idea: "${idea}"\n\nCreate MVP spec:\n1. Core features ONLY\n2. Tech stack\n3. Build timeline\n4. Success metrics`}], system:'You are a technical product manager.', model:route.model, maxTokens:500 })
      ]);
      return { idea, sections: ['Problem & Solution','Market Sizing','Business Model','MVP Spec'].map((title,i) => ({ title, content: sections[i].content })) };
    }
  },

  'ai-research-lab': {
    name: 'AI Research Lab', emoji: '🔬',
    description: 'Deep research on any topic with multiple AI perspectives',
    category: 'research',
    async run(input) {
      const topic = input.topic || input;
      return runSwarm(topic, ['researcher','cto','ceo'], 'consensus');
    }
  },

  'coding-team': {
    name: 'Coding Team', emoji: '💻',
    description: 'Full dev team: architect, developer, QA, security review',
    category: 'code',
    async run(input) {
      const task  = input.task || input;
      const route = TriRouter.route(task, {});
      const results = await Promise.all([
        callModel(route.provider, { messages:[{role:'user',content:`Design the architecture for: ${task}`}], system:'You are a software architect.', model:route.model, maxTokens:800 }),
        callModel(route.provider, { messages:[{role:'user',content:`Implement: ${task}\n\nWrite production-quality code with error handling.`}], system:'You are a senior developer.', model:route.model, maxTokens:1500 }),
        callModel(route.provider, { messages:[{role:'user',content:`Write unit tests for: ${task}`}], system:'You are a QA engineer.', model:route.model, maxTokens:800 }),
        callModel(route.provider, { messages:[{role:'user',content:`Security review for: ${task}\n\nIdentify top 3 security risks.`}], system:'You are a security engineer.', model:route.model, maxTokens:600 })
      ]);
      return { task, roles: ['Architecture','Implementation','Tests','Security'].map((r,i) => ({ role: r, content: results[i].content })) };
    }
  },

  'content-studio': {
    name: 'Content Studio', emoji: '✍️',
    description: 'Full content pipeline: research → write → edit → SEO optimize',
    category: 'marketing',
    async run(input) { return runFlow('research-and-write', { topic: input.topic || input }); }
  },

  'security-auditor': {
    name: 'Security Auditor', emoji: '🔐',
    description: 'Full security audit: code review, threat model, compliance check',
    category: 'security',
    async run(input) {
      const { triSecure } = await import('../core/security/index.js');
      return triSecure.runAll(input.dir || '.');
    }
  },

  'competitor-radar': {
    name: 'Competitor Radar', emoji: '📡',
    description: 'Analyze competitors and identify strategic opportunities',
    category: 'business',
    async run(input) {
      const route = TriRouter.route(input.market || input, { preferQuality: true });
      const result = await callModel(route.provider, {
        messages:[{role:'user',content:`Analyze the competitive landscape for: ${input.market || input}\n\n1. Top 5 competitors (name, positioning, strengths, weaknesses)\n2. Market gaps no one is addressing\n3. Differentiation opportunities\n4. Emerging threats\n5. Strategic recommendation`}],
        system:'You are a competitive intelligence analyst.', model:route.model, maxTokens:2000 });
      return { market: input.market || input, analysis: result.content };
    }
  },

  'sales-agent': {
    name: 'Sales Agent', emoji: '💼',
    description: 'Generate sales materials, objection handling, outreach sequences',
    category: 'sales',
    async run(input) {
      const route = TriRouter.route(input.product || input, {});
      const result = await callModel(route.provider, {
        messages:[{role:'user',content:`Product: ${input.product || input}\nTarget: ${input.target || 'B2B decision makers'}\n\nCreate:\n1. One-liner value proposition\n2. 3-email cold outreach sequence\n3. Top 5 objections + responses\n4. Closing language\n5. Follow-up cadence`}],
        system:'You are a B2B sales expert with 15+ years experience.', model:route.model, maxTokens:2000 });
      return { product: input.product || input, materials: result.content };
    }
  },

  'money-mode-lite': {
    name: 'Money Mode Lite', emoji: '💰',
    description: 'Personalized AI monetization roadmap based on your skills',
    category: 'business',
    async run(input) {
      const route = TriRouter.route('monetization strategy', { preferQuality: true });
      const result = await callModel(route.provider, {
        messages:[{role:'user',content:`My skills: ${input.skills || 'general tech'}\nTime: ${input.time || '10 hrs/week'}\nBudget: ${input.budget || '$0'}\nGoal: ${input.goal || '$5k/month'}\n\nGive me a personalized AI monetization roadmap:\n1. Top 3 income streams (specific to my skills)\n2. Exact steps to start this week for each\n3. Timeline to first $1k, then $5k/month\n4. Tools and platforms (with costs)\n5. Quick win I can do in 48 hours`}],
        system:'You are a serial entrepreneur who helps people earn with AI. Be specific, not generic.', model:route.model, maxTokens:2000 });
      return { profile: input, roadmap: result.content };
    }
  },

  'company-builder': {
    name: 'Company Builder', emoji: '🏗️',
    description: 'Full company OS: strategy, team, ops, fundraising, growth',
    category: 'business',
    async run(input) { return runSwarm(input.mission || input, ['ceo','cto','cfo','marketer'], 'chain-of-command'); }
  }
};

export function listApps() {
  return Object.entries(APPS).map(([id, a]) => ({ id, name: a.name, emoji: a.emoji, description: a.description, category: a.category }));
}

export async function runApp(id, input) {
  const app = APPS[id];
  if (!app) throw new Error(`App "${id}" not found. Run 'tri app list' to see available apps.`);
  return app.run(input);
}

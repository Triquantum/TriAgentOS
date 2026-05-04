// business/startup/factory.js — TriAgentOS Startup Factory
// Turns a startup idea into a comprehensive launch kit

import { callModel } from '../../models/adapters/index.js';
import { Router } from '../../core/router.js';

const STARTUP_SYSTEM = `You are a world-class startup advisor with experience at Y Combinator, 
a16z, and multiple successful exits. You give concrete, actionable startup advice 
with real frameworks and examples. Be specific, not generic. Think like a founder, not a consultant.`;

export class StartupFactory {
  constructor(provider, model) {
    this.provider = provider;
    this.model = model;
  }

  async generate(idea) {
    const sections = await Promise.all([
      this._generateSection('PROBLEM & SOLUTION', idea, `
        Analyze this startup idea and provide:
        1. Core problem being solved (1 crisp sentence)
        2. Who has this problem (specific persona, not "everyone")
        3. Current alternatives and why they suck
        4. Your solution's unique insight
        5. Why now? (market timing)`),

      this._generateSection('MARKET SIZING', idea, `
        Provide realistic market sizing for this startup:
        1. TAM (Total Addressable Market) with source/logic
        2. SAM (Serviceable Addressable Market)  
        3. SOM (Serviceable Obtainable Market) — Year 1 realistic target
        4. Growth rate of this market
        5. Key market dynamics and tailwinds`),

      this._generateSection('BUSINESS MODEL', idea, `
        Design the business model:
        1. Primary revenue model (subscription/usage/marketplace/etc.)
        2. Pricing tiers with specific price points
        3. Unit economics: CAC target, LTV target, payback period
        4. Revenue milestones: Month 6, Year 1, Year 2
        5. Path to profitability`),

      this._generateSection('GO-TO-MARKET', idea, `
        Create the GTM strategy:
        1. Ideal Customer Profile (be specific — company size, role, industry)
        2. First 10 customers: exactly how to find and close them
        3. Growth channels (ranked by potential)
        4. Pricing strategy for early adopters
        5. Launch plan: Week 1, Month 1, Month 3`),

      this._generateSection('MVP SPECIFICATION', idea, `
        Define the MVP:
        1. Core features (ONLY what's needed to validate the hypothesis)
        2. Features explicitly NOT in v1 (and why)
        3. Tech stack recommendation with reasoning
        4. Build timeline (realistic, not optimistic)
        5. Success metrics for MVP validation`),

      this._generateSection('COMPETITIVE MOAT', idea, `
        Analyze competitive positioning:
        1. Top 3 competitors (name them specifically)
        2. Your differentiation on each axis
        3. Sustainable moat (network effects/data/switching costs/brand)
        4. What competitors can't copy easily and why
        5. Risk of incumbents entering your space`),

      this._generateSection('FUNDRAISING NARRATIVE', idea, `
        Craft the investor pitch narrative:
        1. One-liner pitch (under 15 words)
        2. Elevator pitch (3 sentences)
        3. The "why this team" angle
        4. Key traction metrics to hit before raising
        5. Ideal funding amount and use of funds`)
    ]);

    return sections;
  }

  async _generateSection(title, idea, prompt) {
    const route = Router.route(idea, { preferQuality: true });
    const provider = this.provider || route.provider;

    const result = await callModel(provider, {
      messages: [{ role: 'user', content: `Startup idea: "${idea}"\n\n${prompt}` }],
      system: STARTUP_SYSTEM,
      model: this.model || route.model,
      maxTokens: 1024,
      temperature: 0.7
    });

    return { title, content: result.content };
  }
}

// ── Money Mode ──────────────────────────────────────────────────────────────
export async function moneyMode({ skills, time, budget, goal }) {
  const route = Router.route('monetization strategy', { preferQuality: true });

  const result = await callModel(route.provider, {
    messages: [{
      role: 'user',
      content: `I want to earn money with AI.
Skills I have: ${skills || 'general tech skills'}
Time available per week: ${time || '10 hours'}
Starting budget: ${budget || '$0'}
Income goal: ${goal || '$5,000/month'}

Give me a personalized AI monetization roadmap with:
1. Top 3 income streams I should pursue (specific to my skills)
2. For each stream: exact steps to start this week
3. Realistic timeline to first $1k, then $5k/month
4. Tools and platforms to use (with costs)
5. What to charge and how to price
6. One "quick win" I can do in the next 48 hours`
    }],
    system: `You are a serial entrepreneur and AI monetization expert who has helped 
    hundreds of people build income streams with AI. You give specific, actionable advice 
    tailored to someone's actual situation — not generic "sell on Fiverr" platitudes.
    Be direct and concrete with specific numbers and platforms.`,
    model: route.model,
    maxTokens: 2048,
    temperature: 0.7
  });

  return result.content;
}

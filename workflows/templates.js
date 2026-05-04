// workflows/templates.js — TriAgentOS Built-in Workflow Templates
// Reusable multi-step AI workflow patterns

export const WORKFLOW_TEMPLATES = {
  'code-review-pr': {
    name: 'Full PR Review Pipeline',
    description: 'Security + QA + CTO review of a pull request',
    steps: [
      { agent: 'security', prompt: 'Security review: {input}', label: 'Security Scan' },
      { agent: 'qa',       prompt: 'QA review of the same code. Previous security findings: {prev}\n\nCode: {input}', label: 'QA Analysis' },
      { agent: 'cto',      prompt: 'Architecture review. Security: {steps[0]}\nQA: {steps[1]}\nCode: {input}', label: 'CTO Decision' }
    ]
  },

  'startup-validate': {
    name: 'Startup Idea Validator',
    description: 'CEO + Investor + Researcher evaluate your idea',
    steps: [
      { agent: 'researcher', prompt: 'Research market for: {input}. What exists, what\'s the size, who are the players?', label: 'Market Research' },
      { agent: 'investor',   prompt: 'Evaluate this startup idea: {input}\nMarket research: {prev}', label: 'Investor Evaluation' },
      { agent: 'ceo',        prompt: 'Build a go/no-go recommendation for: {input}\nResearch: {steps[0]}\nInvestor view: {steps[1]}', label: 'CEO Decision' }
    ]
  },

  'content-pipeline': {
    name: 'Content Creation Pipeline',
    description: 'Research → Write → Edit → SEO optimize',
    steps: [
      { agent: 'researcher', prompt: 'Research key facts, stats, and angles for content about: {input}', label: 'Research' },
      { agent: 'writer',     prompt: 'Write a blog post about {input}. Use this research: {prev}', label: 'Draft' },
      { agent: 'marketer',   prompt: 'SEO optimize and improve conversion of this content. Topic: {input}\n\nDraft: {prev}', label: 'SEO & Polish' }
    ]
  },

  'hire-candidate': {
    name: 'Candidate Interview Prep',
    description: 'Generate role-specific interview questions and evaluation rubric',
    steps: [
      { agent: 'cto',  prompt: 'Generate 5 technical interview questions for: {input}', label: 'Technical Questions' },
      { agent: 'ceo',  prompt: 'Generate 5 leadership/culture interview questions for: {input}', label: 'Behavioral Questions' },
      { agent: 'data', prompt: 'Create an evaluation rubric for hiring a {input}. Technical Qs: {steps[0]}\nBehavioral Qs: {steps[1]}', label: 'Rubric' }
    ]
  },

  'launch-checklist': {
    name: 'Product Launch Checklist',
    description: 'CTO + Marketer + Security review before you ship',
    steps: [
      { agent: 'security',  prompt: 'Pre-launch security checklist for: {input}', label: 'Security Review' },
      { agent: 'cto',       prompt: 'Technical launch checklist for: {input}. Focus on scalability and reliability.', label: 'Tech Checklist' },
      { agent: 'marketer',  prompt: 'Marketing launch checklist for: {input}. Channels, messaging, timing.', label: 'Marketing Checklist' }
    ]
  }
};

/**
 * Execute a workflow template
 */
export async function runWorkflow(templateKey, input, opts = {}) {
  const template = WORKFLOW_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Unknown workflow: ${templateKey}. Available: ${Object.keys(WORKFLOW_TEMPLATES).join(', ')}`);
  }

  const { Agent } = await import('../agents/index.js');
  const results = [];
  let prevOutput = '';

  for (const step of template.steps) {
    // Interpolate variables in prompt
    let prompt = step.prompt
      .replace('{input}', input)
      .replace('{prev}', prevOutput);

    // Replace step references like {steps[0]}
    prompt = prompt.replace(/\{steps\[(\d+)\]\}/g, (_, i) => results[parseInt(i)]?.content || '');

    const agent = new Agent(step.agent, { provider: opts.provider, sessionId: `workflow:${Date.now()}` });
    const result = await agent.run(prompt).catch(err => ({ content: `[Error: ${err.message}]`, error: true }));

    results.push({ ...result, step: step.label, agent: step.agent });
    prevOutput = result.content;
  }

  return { template, input, steps: results };
}

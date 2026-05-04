// skills/token-saving/optimizer.js — TriAgentOS Token Cost Optimizer
// Analyzes and reduces token usage without sacrificing quality

import { COSTS } from '../../core/router.js';

// Filler words and phrases that add tokens without adding meaning
const FILLER_PATTERNS = [
  /\bCertainly[,!]?\s*/gi,
  /\bAbsolutely[,!]?\s*/gi,
  /\bOf course[,!]?\s*/gi,
  /\bGreat question[,!]?\s*/gi,
  /\bSure[,!]?\s*/gi,
  /\bI'd be happy to\s+/gi,
  /\bI'd be glad to\s+/gi,
  /\bI understand that\s+/gi,
  /\bThank you for (your |the )?(question|asking|sharing)\s*/gi,
  /\bAs an AI (language model |assistant )?,?\s*/gi,
  /\bAs a helpful AI,?\s*/gi,
  /\bI hope this helps[.!]?\s*/gi,
  /\bLet me know if you need (anything else|more help)[.!]?\s*/gi,
  /\bFeel free to ask (if|any)\s*/gi,
  /Please note that\s+/gi,
  /It('s| is) important to note that\s+/gi,
  /It('s| is) worth noting that\s+/gi,
  /In conclusion,?\s+/gi,
  /To summarize,?\s+/gi,
];

// System prompt compressor — extracts key constraints
export function compressSystemPrompt(systemPrompt) {
  if (!systemPrompt || systemPrompt.length < 200) return systemPrompt;

  // Remove excessive whitespace
  let compressed = systemPrompt
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return compressed;
}

// Remove filler from AI output
export function stripFiller(text) {
  let cleaned = text;
  for (const pattern of FILLER_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  // Fix double spaces/newlines left behind
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').replace(/  +/g, ' ').trim();
  // Capitalize first letter if lowercased after stripping
  if (cleaned && cleaned[0] === cleaned[0].toLowerCase() && cleaned[0] !== cleaned[0].toUpperCase()) {
    cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

// Estimate token count (rough: 1 token ≈ 4 chars for English)
export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

// Calculate cost for a completed call
export function calculateCost(model, inputTokens, outputTokens) {
  const costs = COSTS[model];
  if (!costs) return { total: 0, currency: 'USD', breakdown: 'Unknown model' };

  const inputCost  = (inputTokens  / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;
  const total = inputCost + outputCost;

  return {
    inputTokens,
    outputTokens,
    inputCost:  `$${inputCost.toFixed(6)}`,
    outputCost: `$${outputCost.toFixed(6)}`,
    total:      `$${total.toFixed(6)}`,
    totalRaw:   total,
    currency:   'USD'
  };
}

// Suggest token savings strategies for a given prompt
export function analyzeSavings(prompt, model = 'claude-opus-4-5') {
  const tokens = estimateTokens(prompt);
  const costs = COSTS[model];

  const suggestions = [];

  if (prompt.length > 2000) {
    suggestions.push({
      type: 'truncate',
      impact: 'high',
      description: 'Your prompt is long. Consider summarizing context instead of including raw text.',
      estimatedSaving: '20-50%'
    });
  }

  if (prompt.split('\n').filter(l => l.trim() === '').length > 5) {
    suggestions.push({
      type: 'formatting',
      impact: 'low',
      description: 'Many blank lines detected. Remove unnecessary whitespace.',
      estimatedSaving: '2-5%'
    });
  }

  if (/please|could you|would you mind/gi.test(prompt)) {
    suggestions.push({
      type: 'directness',
      impact: 'low',
      description: 'Remove polite phrasing — models don\'t need "please". Be direct with instructions.',
      estimatedSaving: '1-3%'
    });
  }

  const cheaperModel = getCheaperAlternative(model);
  if (cheaperModel) {
    const currentCost = costs?.input || 0;
    const cheaperCost = COSTS[cheaperModel]?.input || 0;
    const savings = currentCost > 0 ? Math.round((1 - cheaperCost / currentCost) * 100) : 0;
    suggestions.push({
      type: 'model-switch',
      impact: savings > 70 ? 'very-high' : savings > 30 ? 'high' : 'medium',
      description: `Switch to ${cheaperModel} for this task — ${savings}% cheaper with similar capability for non-complex tasks.`,
      estimatedSaving: `${savings}%`
    });
  }

  return {
    currentTokens: tokens,
    currentCost: costs ? `$${((tokens / 1_000_000) * costs.input).toFixed(6)}` : 'unknown',
    model,
    suggestions
  };
}

function getCheaperAlternative(model) {
  const alternatives = {
    'claude-opus-4-5':  'claude-haiku-4-5',
    'claude-sonnet-4-5':'claude-haiku-4-5',
    'gpt-4o':           'gpt-4o-mini',
    'gemini-1.5-pro':   'gemini-1.5-flash',
    'llama-3.1-70b-versatile': 'llama-3.1-8b-instant'
  };
  return alternatives[model] || null;
}

// Batch multiple prompts to reduce overhead
export function batchPrompts(prompts) {
  return prompts.map((p, i) => `=== Task ${i + 1} ===\n${p}`).join('\n\n');
}

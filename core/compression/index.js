// core/compression/index.js — TriAgentOS TriCompression
// Token reduction: normal | concise | sharp | extreme modes

const FILLER = [
  /\b(Certainly|Absolutely|Of course|Sure)[,!]?\s*/gi,
  /\bI'd be (happy|glad|pleased) to\s+/gi,
  /\bAs an AI (language model |assistant )?,?\s*/gi,
  /\bThank you for (your |the )?(question|asking)[.!]?\s*/gi,
  /\bI hope this helps[.!]?\s*/gi,
  /\bLet me know if you (need|have)[^.]*[.!]?\s*/gi,
  /\bFeel free to ask[^.]*[.!]?\s*/gi,
  /\bIt('s| is) (important|worth) (to note|noting) that\s+/gi,
  /\bPlease note that\s+/gi,
  /\bIn (conclusion|summary),?\s*/gi,
];

export function compress(text, mode = 'normal') {
  if (!text) return { text: '', ratio: 1, saved: 0, tokensOriginal: 0, tokensSaved: 0 };

  const original = text;
  let result = text;

  switch (mode) {
    case 'normal':
      result = stripFiller(text);
      result = result.replace(/\n{3,}/g, '\n\n').trim();
      break;

    case 'concise':
      result = stripFiller(text);
      result = result.replace(/\n{2,}/g, '\n').trim();
      // Remove redundant phrasing
      result = result.replace(/\bin order to\b/gi, 'to')
                     .replace(/\bdue to the fact that\b/gi, 'because')
                     .replace(/\bat this point in time\b/gi, 'now')
                     .replace(/\bprior to\b/gi, 'before')
                     .replace(/\bsubsequent to\b/gi, 'after')
                     .replace(/\ba number of\b/gi, 'several')
                     .replace(/\bthe majority of\b/gi, 'most')
                     .replace(/\bin the event that\b/gi, 'if');
      break;

    case 'sharp':
      result = stripFiller(text);
      // Aggressive compression
      result = result.replace(/\n{2,}/g, '\n')
                     .replace(/\b(However|Nevertheless|Furthermore|Moreover|Additionally),?\s*/gi, '')
                     .replace(/\bIt is (important|crucial|essential) (to|that)\s+/gi, '')
                     .replace(/\bin order to\b/gi, 'to')
                     .replace(/\bdue to the fact that\b/gi, 'because')
                     .replace(/\bvery (important|significant|relevant)/gi, (_, w) => w)
                     .replace(/\bquite (a |an )?(few|lot|bit)/gi, 'many')
                     .replace(/\s{2,}/g, ' ').trim();
      // Collapse short sentences
      result = result.split('\n').filter(l => l.trim().length > 0).join('\n');
      break;

    case 'extreme':
      result = stripFiller(text);
      // Maximum compression: bullet-ize, abbreviate, remove all fluff
      result = result
        .replace(/\n{2,}/g, '\n')
        .replace(/\b(However|Nevertheless|Furthermore|Moreover|Additionally|Therefore|Consequently),?\s*/gi, '→ ')
        .replace(/\bin order to\b/gi, 'to')
        .replace(/\bdue to the fact that\b/gi, 'because')
        .replace(/\bIt is (important|crucial) (to|that)\s+/gi, 'Must: ')
        .replace(/\bYou should\s+/gi, '→ ')
        .replace(/\bYou can\s+/gi, 'Can: ')
        .replace(/\bFor example,?\s*/gi, 'e.g. ')
        .replace(/\bSuch as\s*/gi, 'e.g. ')
        .replace(/\s{2,}/g, ' ').trim();
      // Convert long paragraphs to bullets
      const sentences = result.split(/(?<=[.!?])\s+/);
      if (sentences.length > 4) {
        result = sentences.map(s => `• ${s.trim()}`).join('\n');
      }
      break;

    default:
      throw new Error(`Unknown compression mode: ${mode}. Use: normal | concise | sharp | extreme`);
  }

  const tokensOriginal = estimateTokens(original);
  const tokensResult   = estimateTokens(result);
  const tokensSaved    = tokensOriginal - tokensResult;
  const ratio          = tokensResult / tokensOriginal;

  return {
    text: result,
    mode,
    ratio:          parseFloat(ratio.toFixed(3)),
    percentSaved:   Math.round((1 - ratio) * 100),
    tokensOriginal,
    tokensResult,
    tokensSaved,
    charsOriginal:  original.length,
    charsResult:    result.length
  };
}

export function stripFiller(text) {
  let cleaned = text;
  for (const pattern of FILLER) cleaned = cleaned.replace(pattern, '');
  cleaned = cleaned.replace(/  +/g, ' ').trim();
  if (cleaned && cleaned[0] !== cleaned[0].toUpperCase() && /[a-z]/.test(cleaned[0])) {
    cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

export function estimateCost(tokens, model = 'claude-opus-4-5') {
  const rates = { 'claude-opus-4-5': 15, 'claude-sonnet-4-5': 3, 'claude-haiku-4-5': 0.25, 'gpt-4o': 5, 'gpt-4o-mini': 0.15, 'gemini-1.5-pro': 3.5 };
  const rate = rates[model] || 5;
  return { tokens, cost: `$${((tokens / 1_000_000) * rate).toFixed(6)}`, rate };
}

export const MODES = ['normal', 'concise', 'sharp', 'extreme'];

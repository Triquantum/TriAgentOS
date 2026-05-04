// benchmarks/runner.js — TriAgentOS Model Benchmark Suite
import { callModel } from '../models/adapters/index.js';
import { config } from '../core/config.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Benchmark Tasks ──────────────────────────────────────────────────────────
const BENCHMARKS = [
  {
    id: 'code-python',
    category: 'code',
    name: 'Python Function',
    prompt: 'Write a Python function that finds all prime numbers up to n using the Sieve of Eratosthenes. Include type hints and docstring.',
    evaluator: (output) => {
      const hasFunc = output.includes('def ');
      const hasSieve = output.toLowerCase().includes('sieve') || output.includes('primes');
      const hasTypeHints = output.includes('int') || output.includes('List');
      const hasDocstring = output.includes('"""') || output.includes("'''");
      const score = [hasFunc, hasSieve, hasTypeHints, hasDocstring].filter(Boolean).length * 25;
      return { score, details: { hasFunc, hasSieve, hasTypeHints, hasDocstring } };
    }
  },
  {
    id: 'reasoning',
    category: 'reasoning',
    name: 'Logic Puzzle',
    prompt: 'There are 3 boxes. One has only apples, one has only oranges, one has both. All are labeled wrong. You pick 1 fruit from 1 box. How can you label all boxes correctly? Explain step by step.',
    evaluator: (output) => {
      const hasMixed = output.toLowerCase().includes('mixed') || output.toLowerCase().includes('both');
      const hasLogic = output.toLowerCase().includes('label') && output.toLowerCase().includes('wrong');
      const isDetailed = output.split('\n').length > 5;
      const score = [hasMixed, hasLogic, isDetailed].filter(Boolean).length * 33;
      return { score, details: { hasMixed, hasLogic, isDetailed } };
    }
  },
  {
    id: 'creative',
    category: 'creative',
    name: 'Product Copy',
    prompt: 'Write a compelling 3-sentence product description for a $299 AI-powered noise-cancelling headphone called "Zephyr Pro".',
    evaluator: (output) => {
      const sentences = output.split(/[.!?]/).filter(s => s.trim().length > 10);
      const hasPrice = output.includes('299') || output.includes('premium') || output.includes('Pro');
      const hasBenefit = output.toLowerCase().includes('noise') || output.toLowerCase().includes('sound');
      const rightLength = sentences.length >= 2 && sentences.length <= 5;
      const score = [hasPrice, hasBenefit, rightLength, sentences.length > 0].filter(Boolean).length * 25;
      return { score, details: { sentenceCount: sentences.length, hasPrice, hasBenefit } };
    }
  },
  {
    id: 'instruction',
    category: 'instruction-following',
    name: 'Format Compliance',
    prompt: 'List exactly 5 programming languages, sorted alphabetically. Return ONLY a numbered list, nothing else.',
    evaluator: (output) => {
      const lines = output.trim().split('\n').filter(l => l.trim());
      const hasNumbers = lines.filter(l => /^\d\./.test(l.trim())).length;
      const isAlphabetical = lines.map(l => l.replace(/^\d\.\s*/, '').trim()).join(',') ===
        [...lines.map(l => l.replace(/^\d\.\s*/, '').trim())].sort().join(',');
      const exactlyFive = lines.length === 5 || hasNumbers === 5;
      const score = [exactlyFive, isAlphabetical, hasNumbers >= 4].filter(Boolean).length * 33;
      return { score, details: { lineCount: lines.length, numberedLines: hasNumbers, isAlphabetical } };
    }
  },
  {
    id: 'conciseness',
    category: 'quality',
    name: 'Concise Explanation',
    prompt: 'Explain what a REST API is in exactly 2 sentences.',
    evaluator: (output) => {
      const sentences = output.split(/[.!?]/).filter(s => s.trim().length > 10);
      const isRest = output.toUpperCase().includes('REST') || output.toLowerCase().includes('representational');
      const isConcise = output.length < 400;
      const exactlyTwo = sentences.length >= 1 && sentences.length <= 3;
      const score = [isRest, isConcise, exactlyTwo].filter(Boolean).length * 33;
      return { score, details: { sentenceCount: sentences.length, charCount: output.length } };
    }
  }
];

// ── Runner ───────────────────────────────────────────────────────────────────
export async function runBenchmarks(providers, opts = {}) {
  const results = {};

  for (const provider of providers) {
    results[provider] = { provider, scores: {}, totalScore: 0, timings: {}, errors: [] };

    for (const bench of BENCHMARKS) {
      if (opts.category && bench.category !== opts.category) continue;

      const start = Date.now();
      try {
        const result = await callModel(provider, {
          messages: [{ role: 'user', content: bench.prompt }],
          maxTokens: 1024,
          temperature: 0.3
        });

        const evaluation = bench.evaluator(result.content);
        const elapsed = Date.now() - start;

        results[provider].scores[bench.id] = {
          name: bench.name,
          score: evaluation.score,
          time: elapsed,
          details: evaluation.details
        };
        results[provider].timings[bench.id] = elapsed;
        results[provider].totalScore += evaluation.score;

        if (!opts.quiet) {
          process.stdout.write(`  ${provider.padEnd(12)} ${bench.name.padEnd(25)} ${String(evaluation.score).padStart(3)}/100  ${elapsed}ms\n`);
        }
      } catch (err) {
        results[provider].errors.push({ bench: bench.id, error: err.message });
        results[provider].scores[bench.id] = { name: bench.name, score: 0, error: err.message };
        if (!opts.quiet) process.stdout.write(`  ${provider.padEnd(12)} ${bench.name.padEnd(25)} ERROR: ${err.message.slice(0, 40)}\n`);
      }

      // Small delay between calls
      await new Promise(r => setTimeout(r, 500));
    }

    results[provider].avgScore = Math.round(results[provider].totalScore / BENCHMARKS.length);
  }

  // Save results
  const outputPath = join(__dirname, 'results.json');
  writeFileSync(outputPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));

  return results;
}

export { BENCHMARKS };

// tools/code-tools.js — TriAgentOS Developer Power Tools
import { readFileSync, existsSync } from 'fs';
import { callModel } from '../models/adapters/index.js';
import { Router } from '../core/router.js';
import { config } from '../core/config.js';
import { execSync } from 'child_process';

const CODE_SYSTEM = `You are a senior software engineer with 15+ years of experience. 
You write clean, secure, well-tested code and give precise, actionable feedback. 
Be direct. Use specific line numbers and examples when reviewing code.`;

/**
 * Review a code file or snippet for bugs, security, and quality
 */
export async function reviewCode(input, opts = {}) {
  const code = existsSync(input) ? readFileSync(input, 'utf8') : input;
  const filename = existsSync(input) ? input : 'snippet';
  const route = Router.route('code review security', { preferQuality: true, forceProvider: opts.provider });

  const prompt = `Review this code for: bugs, security vulnerabilities, performance issues, and code quality.
File: ${filename}
Focus: ${opts.focus || 'all issues'}
\`\`\`
${code.slice(0, 8000)}
\`\`\`

Structure your response as:
## 🐛 Bugs & Errors
## 🔐 Security Issues  
## ⚡ Performance
## 🧹 Code Quality
## ✅ What's Good
## 📋 Priority Fixes (numbered list)`;

  return callModel(route.provider, {
    messages: [{ role: 'user', content: prompt }],
    system: CODE_SYSTEM,
    model: opts.model || route.model,
    maxTokens: 2048,
    temperature: 0.3
  });
}

/**
 * Generate intelligent git commit messages
 */
export async function generateCommitMessage(opts = {}) {
  let diff = '';

  try {
    diff = execSync('git diff --cached --stat && git diff --cached', {
      maxBuffer: 1024 * 1024 * 5,
      encoding: 'utf8'
    });
  } catch {
    try {
      diff = execSync('git diff HEAD --stat && git diff HEAD', { maxBuffer: 1024 * 1024 * 5, encoding: 'utf8' });
    } catch (err) {
      throw new Error('Not a git repo or no changes staged. Run: git add <files> first');
    }
  }

  if (!diff.trim()) throw new Error('No staged changes found. Run: git add <files>');

  const route = Router.route('git commit message', { preferSpeed: true, forceProvider: opts.provider });

  const result = await callModel(route.provider, {
    messages: [{
      role: 'user',
      content: `Generate a conventional commit message for this diff.

Follow the Conventional Commits spec: type(scope): description
Types: feat, fix, docs, style, refactor, test, chore, perf, ci

Rules:
- Subject line: max 72 chars, imperative mood, no period
- Body: explain WHY, not what (optional)
- Breaking changes: note with BREAKING CHANGE:

Git diff:
\`\`\`
${diff.slice(0, 6000)}
\`\`\`

Return ONLY the commit message, no explanation.`
    }],
    system: 'You are a git expert. Generate precise conventional commit messages.',
    model: opts.model || route.model,
    maxTokens: 300,
    temperature: 0.3
  });

  return result.content.trim();
}

/**
 * Auto-generate documentation for a code file
 */
export async function generateDocs(filePath, opts = {}) {
  if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  const code = readFileSync(filePath, 'utf8');
  const ext = filePath.split('.').pop();
  const route = Router.route('documentation code', { preferQuality: true, forceProvider: opts.provider });

  const format = opts.format || 'markdown';

  const result = await callModel(route.provider, {
    messages: [{
      role: 'user',
      content: `Generate comprehensive documentation for this ${ext} file.

File: ${filePath}
Output format: ${format}

Include:
- Overview and purpose
- All functions/classes/exports with descriptions
- Parameters and return types
- Usage examples
- Any important notes or caveats

Code:
\`\`\`${ext}
${code.slice(0, 8000)}
\`\`\``
    }],
    system: CODE_SYSTEM,
    model: opts.model || route.model,
    maxTokens: 3000,
    temperature: 0.4
  });

  return result.content;
}

/**
 * Explain any code file in plain English
 */
export async function explainCode(input, opts = {}) {
  const code = existsSync(input) ? readFileSync(input, 'utf8') : input;
  const filename = existsSync(input) ? input : 'snippet';
  const level = opts.level || 'intermediate';
  const route = Router.route('explain code', { forceProvider: opts.provider });

  const result = await callModel(route.provider, {
    messages: [{
      role: 'user',
      content: `Explain this code to a ${level}-level developer.

File: ${filename}

Code:
\`\`\`
${code.slice(0, 6000)}
\`\`\`

Explain:
1. What this code does (one sentence)
2. How it works (step by step)
3. Key patterns and decisions
4. What to watch out for
5. How you'd use it`
    }],
    system: CODE_SYSTEM,
    model: opts.model || route.model,
    maxTokens: 1500,
    temperature: 0.5
  });

  return result.content;
}

/**
 * Summarize any text or file
 */
export async function summarize(input, opts = {}) {
  const text = existsSync(input) ? readFileSync(input, 'utf8') : input;
  const style = opts.style || 'bullet'; // bullet | paragraph | tldr
  const route = Router.route('summarize analyze', { preferSpeed: opts.fast, forceProvider: opts.provider });

  const styleInstructions = {
    bullet:    'Use clear bullet points organized by theme',
    paragraph: 'Write flowing paragraphs, 3-5 sentences each',
    tldr:      'One paragraph, max 5 sentences. Lead with the single most important insight.',
    executive: 'Executive summary format: situation → key findings → recommendations'
  };

  const result = await callModel(route.provider, {
    messages: [{
      role: 'user',
      content: `Summarize the following text.

Style: ${styleInstructions[style] || styleInstructions.bullet}

Text:
---
${text.slice(0, 12000)}
---`
    }],
    system: 'You are an expert at extracting and communicating key information concisely.',
    model: opts.model || route.model,
    maxTokens: 1024,
    temperature: 0.4
  });

  return result.content;
}

/**
 * Generate unit tests for a function or file
 */
export async function generateTests(filePath, opts = {}) {
  if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  const code = readFileSync(filePath, 'utf8');
  const ext = filePath.split('.').pop();
  const framework = opts.framework || (ext === 'py' ? 'pytest' : 'jest');
  const route = Router.route('unit tests code', { preferQuality: true, forceProvider: opts.provider });

  const result = await callModel(route.provider, {
    messages: [{
      role: 'user',
      content: `Generate comprehensive unit tests for this ${ext} code using ${framework}.

File: ${filePath}

Include tests for:
- Happy path (normal usage)
- Edge cases (empty, null, large inputs)
- Error cases (invalid inputs, exceptions)
- Boundary conditions

Code:
\`\`\`${ext}
${code.slice(0, 6000)}
\`\`\`

Return ONLY the test file code, no explanation.`
    }],
    system: CODE_SYSTEM,
    model: opts.model || route.model,
    maxTokens: 3000,
    temperature: 0.3
  });

  return result.content;
}

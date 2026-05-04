// core/stream.js — TriAgentOS Streaming & Retry Engine
import { config } from './config.js';

const RETRY_DELAYS = [1000, 2000, 5000]; // ms
const RETRYABLE_ERRORS = [429, 500, 502, 503, 529];

/**
 * Retry wrapper for model calls
 */
export async function withRetry(fn, label = 'call', retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status || err?.statusCode;
      const isRetryable = RETRYABLE_ERRORS.includes(status) ||
        err.message?.includes('rate limit') ||
        err.message?.includes('overloaded') ||
        err.message?.includes('timeout');

      if (!isRetryable || attempt === retries) throw err;

      const delay = RETRY_DELAYS[attempt] || 5000;
      const jitter = Math.random() * 500;
      console.error(`  ⚠ ${label} failed (${err.message}). Retry ${attempt + 1}/${retries} in ${((delay + jitter) / 1000).toFixed(1)}s...`);
      await sleep(delay + jitter);
    }
  }
}

/**
 * Stream Claude responses token by token
 */
export async function streamAnthropic({ messages, system, model, maxTokens, onToken, onDone }) {
  const apiKey = config.getApiKey('anthropic');
  if (!apiKey) throw new Error('Anthropic API key not set');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'claude-opus-4-5',
      max_tokens: maxTokens || 4096,
      system: system || 'You are a helpful AI assistant.',
      messages,
      stream: true
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Anthropic error ${response.status}: ${err.error?.message}`);
  }

  let fullContent = '';
  let inputTokens = 0, outputTokens = 0;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;

      try {
        const event = JSON.parse(data);
        if (event.type === 'content_block_delta' && event.delta?.text) {
          fullContent += event.delta.text;
          onToken?.(event.delta.text);
        }
        if (event.type === 'message_start') {
          inputTokens = event.message?.usage?.input_tokens || 0;
        }
        if (event.type === 'message_delta') {
          outputTokens = event.usage?.output_tokens || 0;
        }
      } catch {}
    }
  }

  onDone?.({ content: fullContent, usage: { input: inputTokens, output: outputTokens } });
  return { content: fullContent, usage: { input: inputTokens, output: outputTokens }, provider: 'anthropic', model };
}

/**
 * Stream OpenAI responses
 */
export async function streamOpenAI({ messages, system, model, maxTokens, onToken, onDone }) {
  const apiKey = config.getApiKey('openai');
  if (!apiKey) throw new Error('OpenAI API key not set');

  const allMessages = system ? [{ role: 'system', content: system }, ...messages] : messages;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: model || 'gpt-4o', max_tokens: maxTokens || 4096, messages: allMessages, stream: true })
  });

  if (!response.ok) throw new Error(`OpenAI error ${response.status}`);

  let fullContent = '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
      try {
        const event = JSON.parse(line.slice(6));
        const delta = event.choices?.[0]?.delta?.content;
        if (delta) { fullContent += delta; onToken?.(delta); }
      } catch {}
    }
  }

  onDone?.({ content: fullContent });
  return { content: fullContent, provider: 'openai', model };
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

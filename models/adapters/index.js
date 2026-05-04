// models/adapters/index.js — Universal Model Adapter Layer
import { config } from '../../core/config.js';

// ── Anthropic / Claude ──────────────────────────────────────────────────────
export async function callAnthropic({ messages, system, model, maxTokens, temperature }) {
  const apiKey = config.getApiKey('anthropic');
  if (!apiKey) throw new Error('Anthropic API key not set. Run: tri config set anthropic.apiKey <key>');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: model || config.get('providers.anthropic.model') || 'claude-opus-4-5',
      max_tokens: maxTokens || 4096,
      temperature: temperature || 0.7,
      system: system || 'You are a helpful AI assistant.',
      messages
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Anthropic error ${response.status}: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    usage: { input: data.usage.input_tokens, output: data.usage.output_tokens },
    model: data.model,
    provider: 'anthropic'
  };
}

// ── OpenAI / GPT ────────────────────────────────────────────────────────────
export async function callOpenAI({ messages, system, model, maxTokens, temperature }) {
  const apiKey = config.getApiKey('openai');
  if (!apiKey) throw new Error('OpenAI API key not set. Run: tri config set openai.apiKey <key>');

  const allMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: model || config.get('providers.openai.model') || 'gpt-4o',
      max_tokens: maxTokens || 4096,
      temperature: temperature || 0.7,
      messages: allMessages
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI error ${response.status}: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: { input: data.usage.prompt_tokens, output: data.usage.completion_tokens },
    model: data.model,
    provider: 'openai'
  };
}

// ── Google Gemini ───────────────────────────────────────────────────────────
export async function callGemini({ messages, system, model, maxTokens, temperature }) {
  const apiKey = config.getApiKey('gemini');
  if (!apiKey) throw new Error('Gemini API key not set. Run: tri config set gemini.apiKey <key>');

  const mdl = model || config.get('providers.gemini.model') || 'gemini-1.5-pro';
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${mdl}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        generationConfig: { maxOutputTokens: maxTokens || 4096, temperature: temperature || 0.7 }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Gemini error ${response.status}: ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  return {
    content: data.candidates[0].content.parts[0].text,
    usage: { input: data.usageMetadata?.promptTokenCount || 0, output: data.usageMetadata?.candidatesTokenCount || 0 },
    model: mdl,
    provider: 'gemini'
  };
}

// ── Groq (ultra-fast Llama) ─────────────────────────────────────────────────
export async function callGroq({ messages, system, model, maxTokens, temperature }) {
  const apiKey = config.getApiKey('groq');
  if (!apiKey) throw new Error('Groq API key not set. Run: tri config set groq.apiKey <key>');

  const allMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: model || config.get('providers.groq.model') || 'llama-3.1-70b-versatile',
      max_tokens: maxTokens || 4096,
      temperature: temperature || 0.7,
      messages: allMessages
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Groq error ${response.status}: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: { input: data.usage.prompt_tokens, output: data.usage.completion_tokens },
    model: data.model,
    provider: 'groq'
  };
}

// ── Ollama (local) ──────────────────────────────────────────────────────────
export async function callOllama({ messages, system, model, maxTokens, temperature }) {
  const baseUrl = config.get('providers.ollama.baseUrl') || 'http://localhost:11434';
  const mdl = model || config.get('providers.ollama.model') || 'llama3';

  const allMessages = system
    ? [{ role: 'system', content: system }, ...messages]
    : messages;

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: mdl, messages: allMessages, stream: false, options: { temperature: temperature || 0.7 } })
  }).catch(() => { throw new Error(`Ollama not reachable at ${baseUrl}. Is it running? Try: ollama serve`); });

  if (!response.ok) throw new Error(`Ollama error ${response.status}`);

  const data = await response.json();
  return {
    content: data.message.content,
    usage: { input: data.prompt_eval_count || 0, output: data.eval_count || 0 },
    model: mdl,
    provider: 'ollama'
  };
}

// ── Universal call ──────────────────────────────────────────────────────────
export async function callModel(provider, params) {
  const adapters = { anthropic: callAnthropic, openai: callOpenAI, gemini: callGemini, groq: callGroq, ollama: callOllama };
  const fn = adapters[provider];
  if (!fn) throw new Error(`Unknown provider: ${provider}. Use: anthropic | openai | gemini | groq | ollama`);
  return fn(params);
}

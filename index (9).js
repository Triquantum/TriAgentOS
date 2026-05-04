// core/chat.js — TriAgentOS Interactive Chat REPL
import readline from 'readline';
import { callModel } from '../models/adapters/index.js';
import { streamAnthropic, streamOpenAI } from './stream.js';
import { Memory } from './memory.js';
import { Router } from './router.js';
import { config } from './config.js';

const CHAT_COMMANDS = {
  '/help':    'Show available commands',
  '/clear':   'Clear conversation history',
  '/model':   'Show or change current model — /model openai/gpt-4o',
  '/save':    'Save conversation to file',
  '/history': 'Show conversation history',
  '/cost':    'Show token usage and cost so far',
  '/agent':   'Switch to agent mode — /agent cto',
  '/exit':    'Exit chat',
};

export async function startChat({ provider, model, session, system, agentKey }) {
  const chalk = (await import('chalk')).default;
  const ora = (await import('ora')).default;

  const memory = new Memory(session || `chat:${Date.now()}`);
  let currentProvider = provider || config.getBestAvailableProvider() || 'anthropic';
  let currentModel = model;
  let totalInput = 0, totalOutput = 0;

  // Get agent system prompt if specified
  let systemPrompt = system || 'You are a helpful, knowledgeable AI assistant. Be concise and practical.';
  let agentInfo = null;
  if (agentKey) {
    const { AGENTS } = await import('../agents/index.js');
    agentInfo = AGENTS[agentKey];
    if (agentInfo) systemPrompt = agentInfo.systemPrompt;
  }

  // Detect best model
  if (!currentModel) {
    const route = Router.route('general conversation', {});
    currentModel = route.model;
  }

  // Print header
  console.clear();
  const gradient = (await import('gradient-string')).default;
  console.log(gradient.rainbow('  TriAgentOS Chat ') + '\n');

  if (agentInfo) {
    console.log(`  ${agentInfo.emoji} ${chalk.bold.cyan(agentInfo.name)} — ${chalk.gray(agentInfo.role)}`);
  }

  console.log(`  ${chalk.gray('Provider:')} ${chalk.yellow(currentProvider)}/${chalk.yellow(currentModel)}`);
  console.log(`  ${chalk.gray('Session:')} ${chalk.gray(session || 'new')}`);
  console.log(`  ${chalk.gray('Type')} ${chalk.cyan('/help')} ${chalk.gray('for commands,')} ${chalk.cyan('/exit')} ${chalk.gray('to quit')}\n`);
  console.log(chalk.gray('─'.repeat(60)));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('\n  You › '),
    historySize: 100,
    terminal: true
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) { rl.prompt(); return; }

    // Handle slash commands
    if (input.startsWith('/')) {
      await handleChatCommand(input, { memory, rl, chalk, currentProvider, currentModel, totalInput, totalOutput });
      rl.prompt();
      return;
    }

    // Add to memory
    memory.add('user', input);

    // Stream response
    process.stdout.write(`\n  ${chalk.bold.cyan(agentInfo ? agentInfo.emoji + ' ' + agentInfo.name : '🤖 AI')} › `);

    try {
      let result;
      const params = {
        messages: memory.getContext(20),
        system: systemPrompt,
        model: currentModel,
        maxTokens: 2048,
        onToken: (token) => process.stdout.write(chalk.white(token))
      };

      if (currentProvider === 'anthropic') {
        result = await streamAnthropic(params);
      } else if (currentProvider === 'openai') {
        result = await streamOpenAI(params);
      } else {
        // Fallback to non-streaming for other providers
        result = await callModel(currentProvider, { ...params, onToken: undefined });
        process.stdout.write(chalk.white(result.content));
      }

      memory.add('assistant', result.content);
      memory.compress(20);

      if (result.usage) {
        totalInput += result.usage.input || 0;
        totalOutput += result.usage.output || 0;
      }

      console.log('\n' + chalk.gray('─'.repeat(60)));
    } catch (err) {
      console.log('\n' + chalk.red(`  Error: ${err.message}`));
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log(chalk.gray('\n  Session saved. Goodbye! 👋\n'));
    process.exit(0);
  });
}

async function handleChatCommand(input, ctx) {
  const { memory, rl, chalk, totalInput, totalOutput } = ctx;
  const [cmd, ...args] = input.split(' ');

  switch (cmd) {
    case '/help':
      console.log(chalk.bold.cyan('\n  Chat Commands:'));
      for (const [c, desc] of Object.entries(CHAT_COMMANDS)) {
        console.log(`    ${chalk.yellow(c.padEnd(12))} ${chalk.gray(desc)}`);
      }
      break;

    case '/clear':
      memory.clear();
      console.clear();
      console.log(chalk.green('  ✓ Conversation cleared'));
      break;

    case '/history':
      const msgs = memory.messages.slice(-10);
      console.log(chalk.bold.cyan('\n  Recent history:'));
      msgs.forEach(m => {
        const prefix = m.role === 'user' ? chalk.cyan('  You') : chalk.green('  AI ');
        const preview = m.content.slice(0, 80) + (m.content.length > 80 ? '...' : '');
        console.log(`${prefix}  ${chalk.gray(preview)}`);
      });
      break;

    case '/cost':
      console.log(chalk.bold.cyan('\n  Token Usage:'));
      console.log(`    Input tokens:  ${chalk.yellow(totalInput.toLocaleString())}`);
      console.log(`    Output tokens: ${chalk.yellow(totalOutput.toLocaleString())}`);
      break;

    case '/model':
      if (args[0]) {
        const [p, m] = args[0].includes('/') ? args[0].split('/') : [args[0], null];
        ctx.currentProvider = p;
        if (m) ctx.currentModel = m;
        console.log(chalk.green(`  ✓ Switched to ${p}${m ? '/' + m : ''}`));
      } else {
        console.log(chalk.gray(`  Current: ${ctx.currentProvider}/${ctx.currentModel}`));
      }
      break;

    case '/exit':
    case '/quit':
      rl.close();
      break;

    default:
      console.log(chalk.red(`  Unknown command: ${cmd}. Type /help`));
  }
}

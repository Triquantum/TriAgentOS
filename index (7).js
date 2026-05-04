#!/usr/bin/env node
// cli/bin/setup.js — Post-install welcome message
import { createRequire } from 'module';

async function welcome() {
  try {
    const { default: chalk } = await import('chalk');
    const { default: boxen } = await import('boxen');

    const message = [
      chalk.bold.cyan('🚀 TriAgentOS installed successfully!'),
      '',
      chalk.white('Get started:'),
      `  ${chalk.yellow('tri setup')}          Interactive setup wizard`,
      `  ${chalk.yellow('tri ask "Hello!"')}   Ask your first question`,
      `  ${chalk.yellow('tri --help')}         See all commands`,
      '',
      chalk.gray('Docs: https://github.com/Triquantum/TriAgentOS'),
    ].join('\n');

    console.log(boxen(message, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    }));
  } catch {
    console.log('\n✓ TriAgentOS installed. Run: tri --help\n');
  }
}

welcome();

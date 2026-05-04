#!/usr/bin/env node
// cli/bin/setup.js — Post-install welcome (CommonJS for compatibility)
'use strict';

// Simple plain-text welcome — no dependencies needed
// This runs AFTER npm install so deps are available, but we keep it safe
function welcome() {
  const lines = [
    '',
    '  ╔════════════════════════════════════════════════════╗',
    '  ║         TriAgentOS  — Installation Complete        ║',
    '  ║         by Triquantum Intelligent Systems          ║',
    '  ╚════════════════════════════════════════════════════╝',
    '',
    '  Quick start:',
    '    tri init                    Set up your first config',
    '    tri config set anthropic.apiKey sk-ant-...',
    '    tri ask "Hello world"       Your first AI query',
    '    tri app list                Browse the app store',
    '    tri --help                  See all 50+ commands',
    '',
    '  Docs: https://github.com/Triquantum/TriAgentOS',
    '',
  ];
  console.log(lines.join('\n'));
}

welcome();

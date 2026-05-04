# Contributing to TriAgentOS

First off — thank you for even considering contributing. Every PR, issue, and star genuinely matters.

---

## Ways to Contribute

### 🐛 Bug Reports
Open an issue with:
- What you ran
- What you expected
- What actually happened
- Your OS, Node version, provider

### ✨ Feature Requests
Open a Discussion (not an issue) describing:
- The use case you're trying to solve
- Why existing commands don't cover it
- Any implementation ideas you have

### 🔧 Code Contributions

**Good first issues** — look for `good first issue` and `help wanted` labels.

**High-value contributions:**
- New model adapters (Together AI, Cohere, Mistral API, Replicate)
- New agents (domain experts, specialized roles)
- Workflow templates
- Bug fixes with tests
- Documentation improvements

---

## Development Setup

```bash
git clone https://github.com/Triquantum/TriAgentOS.git
cd TriAgentOS
npm install
cp .env.example .env
# Add at least one API key to .env

# Test the CLI
node cli/bin/tri.js --help
node cli/bin/tri.js route "Test task routing"

# Validate registry
npm test
```

---

## Adding a New Agent

1. Open `agents/index.js`
2. Add your agent to the `AGENTS` object:

```javascript
yourAgent: {
  name: 'Your Agent Name',
  emoji: '🎭',
  role: 'Your Role Title',
  systemPrompt: `You are an expert in...`,
  capabilities: ['skill1', 'skill2', 'skill3'],
  preferQuality: true  // or preferCode, preferCreative
}
```

3. Test: `tri agent run yourAgent "Test prompt"`
4. Add it to the table in README.md
5. Submit a PR

---

## Adding a New Model Adapter

1. Open `models/adapters/index.js`
2. Add your provider function following the existing pattern
3. Export it and add it to the `adapters` map in `callModel()`
4. Add cost data to `COSTS` in `core/router.js`
5. Add to `registry/models.json`

---

## Code Style

- ES Modules (import/export), no CommonJS
- Node.js 18+ compatible
- No TypeScript (keep it approachable)
- Async/await, not callbacks
- Meaningful error messages with recovery hints
- Comments for non-obvious logic

---

## PR Checklist

- [ ] Tested manually with at least one provider
- [ ] `npm test` passes
- [ ] Updated README if adding a new command or agent
- [ ] No new dependencies without discussion (keep it lean)

---

## License

By contributing, you agree your code will be MIT licensed.

Questions? Open an issue or Discussion — we respond fast.

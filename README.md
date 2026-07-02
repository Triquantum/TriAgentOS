<div align="center">

```
 ████████╗██████╗ ██╗ █████╗  ██████╗ ███████╗███╗   ██╗████████╗ ██████╗ ███████╗
    ██╔══╝██╔══██╗██║██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██╔═══██╗██╔════╝
    ██║   ██████╔╝██║███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ██║   ██║███████╗
    ██║   ██╔══██╗██║██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██║   ██║╚════██║
    ██║   ██║  ██║██║██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ╚██████╔╝███████║
    ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚══════╝
```

### **The Open Source AI Operating System**

*by [Triquantum Intelligent Systems Pvt Ltd](https://github.com/Triquantum)*

[![npm version](https://img.shields.io/npm/v/triagentos?color=7c3aed&style=flat-square&label=npm)](https://www.npmjs.com/package/triagentos)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Node.js ≥18](https://img.shields.io/badge/node-%E2%89%A518-green?style=flat-square)](https://nodejs.org)
[![GitHub Stars](https://img.shields.io/github/stars/Triquantum/TriAgentOS?style=flat-square&color=yellow)](https://github.com/Triquantum/TriAgentOS/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange?style=flat-square)](CONTRIBUTING.md)
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/Triquantum/TriAgentOS/validate.yml?style=flat-square&label=CI)](https://github.com/Triquantum/TriAgentOS/actions)

**One CLI. Every AI model. Real workflows.**

Claude · GPT-4o · Gemini · Groq · DeepSeek · Mistral · Llama · Ollama · Grok · Qwen

[**Quick Start**](#-quick-start) · [**Commands**](#-cli-commands) · [**Apps**](#-app-store) · [**Agents**](#-agent-swarm) · [**Security**](#-trisecure) · [**Roadmap**](ROADMAP.md)

---

</div>

## What is TriAgentOS?

TriAgentOS is a **unified AI operating system** that runs on your machine. It routes your prompts to the best model, orchestrates teams of AI agents, runs security scans, manages memory, and ships a full startup kit — all from a single CLI.

Think of it as the **OS layer** between you and every AI model that exists.

```bash
# Install
npm install -g triagentos

# Ask anything — auto-routes to the best model
tri ask "Build a REST API with JWT auth in Node.js"

# Deploy a team of AI agents on a complex task  
tri swarm "Write a go-to-market strategy for my SaaS" --agents ceo,marketer,researcher

# Generate a full startup launch kit in seconds
tri startup "AI-powered invoicing for freelancers"

# Run a full security scan on your codebase
tri secure scan

# Predict the future
tri predict "What happens to AI startups in 2025 if GPT-5 launches?"
```

---

## Why TriAgentOS?

| | TriAgentOS | LangChain | AutoGPT | CrewAI | Raw API |
|---|:---:|:---:|:---:|:---:|:---:|
| **Works in 60 seconds** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Smart model routing** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **10 providers unified** | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ |
| **Agent swarm (4 modes)** | ✅ | ⚠️ | ✅ | ✅ | ❌ |
| **Built-in security scanner** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Token cost optimizer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Startup launch kit** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Persistent memory graph** | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ |
| **Local model (Ollama)** | ✅ | ✅ | ❌ | ⚠️ | ⚠️ |
| **Self-healing workflows** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Free & open source** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ → [nodejs.org](https://nodejs.org)
- At least one API key **OR** [Ollama](https://ollama.ai) for free local models

### Install

```bash
npm install -g triagentos
tri init
```

### Set your API key (pick one or more)

```bash
# Anthropic Claude (recommended)
tri config set anthropic.apiKey sk-ant-...

# OpenAI GPT-4o
tri config set openai.apiKey sk-...

# Google Gemini
tri config set gemini.apiKey AIza...

# Groq (fast + cheap)
tri config set groq.apiKey gsk_...

# Free local models (no API key needed)
# Install Ollama: https://ollama.ai → then: ollama pull llama3
```

### First commands

```bash
tri boot                          # Check system status
tri ask "What is TriAgentOS?"     # Your first AI query
tri app list                      # Browse the app store
tri swarm "Build a SaaS product" --mode consensus  # Multi-agent swarm
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TriAgentOS Community Edition                  │
├─────────────────────────────────────────────────────────────────┤
│  CLI (tri)  ·  Apps  ·  Swarm  ·  Flows  ·  Skills  ·  Plugins │
├───────────┬─────────┬──────────┬──────────┬──────────┬──────────┤
│TriKernel  │TriRouter│TriSwarm  │TriFlow   │TriMemory │TriSecure │
│event bus  │10 provid│8 agents  │self-heal │graph DB  │5 scanners│
├───────────┴─────────┴──────────┴──────────┴──────────┴──────────┤
│  Anthropic · OpenAI · Gemini · Groq · DeepSeek · Mistral ·      │
│  Ollama · Grok · Qwen · Custom OpenAI-compatible APIs           │
└─────────────────────────────────────────────────────────────────┘
```

### Core Modules

| Module | Path | Purpose |
|--------|------|---------|
| ⚡ TriKernel | `core/kernel/` | Central runtime, event bus, service registry, lifecycle |
| 🧭 TriRouter | `core/router/` | Smart prompt routing — cost / speed / quality / privacy |
| 🐝 TriSwarm | `core/triswarm/` | Multi-agent orchestration (parallel / debate / consensus / chain) |
| ⚡ TriFlow | `core/triflow/` | Self-healing workflow engine with planner→executor→validator loops |
| 🧠 TriMemory | `core/memory-graph/` | Local JSON memory graph — persistent, searchable |
| 🔐 TriSecure | `core/security/` | 5-scanner security suite (secrets / SAST / IaC / deps / container) |
| 🗜️ TriCompression | `core/compression/` | Token reduction (normal / concise / sharp / extreme) |
| 💰 TriCost | `core/cost/` | Cost estimation across all providers |
| 📋 TriProcess | `core/process/` | Process manager — jobs, logs, PIDs |
| 📡 TriObservability | `core/observability/` | Traces, latency, metrics, audit logs |
| ⏰ TriScheduler | `core/scheduler/` | Local cron — recurring workflows and reports |
| 📜 TriGovernance | `core/governance/` | Permissions, policies, approval gates |
| 🔮 TriPrediction | `labs/prediction/` | Scenario simulation and future forecasting |
| 🏪 TriApp Store | `apps/` | 9 built-in apps for business, code, content, security |
| 🧩 TriPlugin Market | `marketplace/` | Plugin spec, registry, validation, install |

---

## 🖥️ CLI Commands

```bash
# ── Core ──────────────────────────────────────────────────────────
tri init                                    # Initialize TriAgentOS
tri boot                                    # Boot kernel + show status
tri ask "your question"                     # Ask with smart routing
tri ask "question" --fast                   # Speed-optimized
tri ask "question" --cheap                  # Cost-optimized
tri ask "question" --quality                # Quality-optimized
tri ask "question" --private                # Local Ollama (no API)
tri route "your task"                       # Preview routing decision
tri compare "prompt" --providers a,b,c      # Compare models side-by-side

# ── Agent Swarm ───────────────────────────────────────────────────
tri swarm "mission"                         # Parallel agents (default)
tri swarm "mission" --mode debate           # Agents debate each other
tri swarm "mission" --mode consensus        # Build group consensus
tri swarm "mission" --mode chain-of-command # Sequential handoff
tri swarm "mission" --agents ceo,cto,cfo    # Pick your team

# ── Prediction Lab ────────────────────────────────────────────────
tri predict "event"                         # Forecast possible futures
tri predict "event" --timeframe "6 months"  # Custom timeframe
tri predict "event" --domain tech           # Domain-specific

# ── Processes ─────────────────────────────────────────────────────
tri ps                                      # List running processes
tri kill <id>                               # Kill a process
tri logs <id>                               # View process logs

# ── Memory ────────────────────────────────────────────────────────
tri memory add "important fact"             # Add to memory
tri memory search "query"                   # Search memory
tri memory export                           # Export all memory
tri memory stats                            # Memory statistics

# ── State ─────────────────────────────────────────────────────────
tri save [name]                             # Save session state
tri resume [id]                             # Resume saved state
tri checkpoint [session]                    # Create checkpoint

# ── Compression ───────────────────────────────────────────────────
tri compress "text" --mode normal           # Light cleanup
tri compress "text" --mode concise          # Moderate compression
tri compress "text" --mode sharp            # Aggressive compression
tri compress "text" --mode extreme          # Maximum compression

# ── Skills ────────────────────────────────────────────────────────
tri skill list                              # List all skills
tri skill validate <path>                   # Validate a skill file
tri skill run <skill-id>                    # Run a skill

# ── Workflows ─────────────────────────────────────────────────────
tri flow list                               # List built-in workflows
tri flow run research-and-write "topic"     # Research + write content
tri flow run code-review-fix "code"         # Review + fix + test
tri flow run startup-analysis "idea"        # Full startup analysis

# ── Tools ─────────────────────────────────────────────────────────
tri tool list                               # List available tools
tri tool run file read --path ./file.js     # File tool
tri tool run github search --query "ai"     # GitHub tool

# ── Security ──────────────────────────────────────────────────────
tri secure scan                             # Full scan (all scanners)
tri secure secrets                          # Scan for API keys / secrets
tri secure sast                             # Static code analysis
tri secure iac                              # Infrastructure as Code scan
tri secure deps                             # Dependency audit
tri secure container                        # Dockerfile scan
tri secure report                           # Show last report
tri secure policy                           # List security policies
tri secure review "code snippet"            # AI-powered review

# ── Apps ──────────────────────────────────────────────────────────
tri app list                                # Browse the app store
tri app run startup-builder "idea"          # Full startup kit
tri app run coding-team "build X"           # Dev team simulation
tri app run competitor-radar "market"       # Competitor analysis
tri app run money-mode-lite                 # AI income roadmap
tri app run content-studio "topic"          # Content pipeline
tri app run security-auditor                # Security audit
tri app run sales-agent "product"           # Sales materials
tri app run ai-research-lab "topic"         # Deep research
tri app run company-builder "mission"       # Full company OS

# ── Plugins ───────────────────────────────────────────────────────
tri plugin list                             # Browse marketplace
tri plugin install <id>                     # Install a plugin
tri plugin validate <path>                  # Validate plugin spec

# ── Governance ────────────────────────────────────────────────────
tri policy list                             # List active policies
tri policy check "action"                   # Check action against policies

# ── Scheduler ─────────────────────────────────────────────────────
tri schedule list                           # List schedules
tri schedule run                            # Run due tasks
tri schedule add-defaults                   # Add recommended schedules

# ── Cost ──────────────────────────────────────────────────────────
tri cost estimate "task description"        # Estimate task cost
tri cost report                             # Usage and cost report

# ── Benchmarks ────────────────────────────────────────────────────
tri benchmark                               # Run full benchmark suite
tri benchmark --providers anthropic,openai  # Compare specific providers
tri benchmark --category code               # Code benchmarks only

# ── Discovery ─────────────────────────────────────────────────────
tri discover                                # Scan GitHub for AI repos

# ── Business Shortcuts ────────────────────────────────────────────
tri startup "your idea"                     # Full startup launch kit
tri money --skills "coding" --goal "$5k/mo" # AI monetization roadmap

# ── System ────────────────────────────────────────────────────────
tri stats                                   # Observability stats
tri models                                  # List all supported models
tri config show                             # Show configuration
tri config set <key> <value>               # Update configuration
```

---

## 🐝 Agent Swarm

Deploy a team of expert AI agents on any mission:

```bash
# Run 3 agents in parallel
tri swarm "Should we build a mobile app or web app first?" \
  --agents ceo,cto,marketer \
  --mode parallel

# Make agents debate each other
tri swarm "Is TypeScript worth the overhead for a 2-person startup?" \
  --agents cto,ceo \
  --mode debate

# Build group consensus
tri swarm "Design our pricing strategy: freemium vs paid trial" \
  --agents ceo,cfo,marketer \
  --mode consensus

# CEO briefs CTO who briefs QA who briefs Security
tri swarm "Launch checklist for our payment feature" \
  --agents ceo,cto,qa,security \
  --mode chain-of-command
```

### Available Agents

| Agent | Emoji | Specialization |
|-------|-------|---------------|
| `ceo` | 🎯 | Vision, strategy, market, fundraising |
| `cto` | 🔧 | Architecture, tech stack, scalability |
| `cfo` | 💰 | Unit economics, burn rate, ROI |
| `designer` | 🎨 | UX, design systems, user research |
| `marketer` | 📈 | Growth, CAC/LTV, channels, copy |
| `researcher` | 🔬 | Market research, competitive intelligence |
| `qa` | 🧪 | Edge cases, test strategy, quality |
| `security` | 🔐 | OWASP, threat modeling, compliance |

---

## 📦 App Store

9 production-ready AI apps included:

```bash
tri app list
```

| App | Command | What it does |
|-----|---------|-------------|
| 🚀 Startup Builder | `tri startup "idea"` | Market analysis + business model + MVP spec + GTM |
| 🔬 AI Research Lab | `tri app run ai-research-lab "topic"` | Multi-agent deep research |
| 💻 Coding Team | `tri app run coding-team "build X"` | Architect + Dev + QA + Security review |
| ✍️ Content Studio | `tri app run content-studio "topic"` | Research → Write → Edit → SEO optimize |
| 🔐 Security Auditor | `tri app run security-auditor` | Full TriSecure audit |
| 📡 Competitor Radar | `tri app run competitor-radar "market"` | Competitive intelligence map |
| 💼 Sales Agent | `tri app run sales-agent "product"` | Cold email + objections + closing scripts |
| 💰 Money Mode Lite | `tri money` | Personalized AI income roadmap |
| 🏗️ Company Builder | `tri app run company-builder "mission"` | CEO + CTO + CFO + Marketing chain |

---

## 🔐 TriSecure

Built-in security scanner — no external tools required:

```bash
tri secure scan          # Run all 5 scanners
tri secure secrets       # API key and credential detection
tri secure sast          # Static code analysis (eval, exec, SQL injection, XSS)
tri secure iac           # Dockerfile and GitHub Actions audit
tri secure deps          # Dependency vulnerability check
tri secure report        # Full markdown + JSON report
```

**Detects:**
- 🔑 API keys: Anthropic, OpenAI, GitHub tokens, AWS keys, Stripe, Google, JWT secrets
- 💉 Code injection: `eval()`, `child_process.exec`, SQL string concatenation, `innerHTML`
- 🐋 Docker: `:latest` tags, root containers, exposed interfaces
- ⚙️ GitHub Actions: unpinned actions, wildcard permissions
- 📦 Dependencies: unpinned versions, suspicious package names

**Reports saved to:** `core/security/reports/security-report.json` + `.md`

> Want Gitleaks, Trivy, Semgrep or Checkov? See stubs in `.github/workflows/security.yml`

---

## 🧭 Smart Model Router

TriAgentOS automatically picks the best model for your task:

```bash
tri route "Write unit tests for my auth module"
# → code task → claude-opus-4-5 (best reasoning)

tri route "Translate 500 product descriptions" --cheap
# → batch task + cost flag → deepseek-chat (95% cheaper)

tri route "Analyze this 500-page PDF" 
# → long context → gemini-1.5-pro (1M token window)

tri route "Quick grammar check" --fast
# → simple task + speed flag → groq/llama-3.1-8b (fastest)

tri route "Process customer data" --private
# → privacy flag → ollama/llama3 (100% local)
```

**10 providers supported:**

| Provider | Models | Best for |
|----------|--------|---------|
| Anthropic | claude-opus-4-5, sonnet, haiku | Reasoning, code, analysis |
| OpenAI | gpt-4o, gpt-4o-mini, o1-mini | General purpose |
| Google | gemini-1.5-pro, flash | Long context (1M tokens) |
| Groq | llama-3.1-70b, 8b | Speed (fastest inference) |
| DeepSeek | deepseek-chat, coder | Cost-effective coding |
| Mistral | mistral-large, small | European privacy |
| Ollama | llama3, codellama, phi3 | Local / offline / free |
| xAI | grok-beta | Real-time web knowledge |
| Qwen | qwen-max, turbo | Multilingual |
| Custom | Any OpenAI-compatible | Self-hosted models |

---

## 🧠 Memory & State

```bash
# Remember things across sessions
tri memory add "Our target customer is B2B SaaS companies with 10-50 employees"
tri memory add "Tech stack: Next.js, Supabase, Tailwind" --tags "project,tech"
tri memory search "target customer"

# Save and resume sessions
tri save my-project
tri resume my-project

# Checkpoints before risky operations
tri checkpoint before-refactor
```

---

## 🗜️ Token Compression

Reduce AI costs by up to 70%:

```bash
tri compress "Certainly! I would be absolutely happy to help you with that request. As an AI assistant, I am designed to provide you with the most helpful response possible." --mode extreme

# Output: "I can help with that."
# Saved: 68% tokens
```

| Mode | Compression | Use case |
|------|-------------|---------|
| `normal` | ~15% | Remove filler words |
| `concise` | ~30% | Tighten phrasing |
| `sharp` | ~45% | Aggressive cleanup |
| `extreme` | ~60-70% | Maximum reduction |

---

## 🔌 Skills System

Skills are reusable AI prompts with metadata:

```bash
tri skill list          # Browse 15 built-in skills
tri skill run coding/code-review
tri skill run security/threat-model
tri skill run business/pitch-deck
```

**Built-in skill categories:** `coding` · `research` · `business` · `marketing` · `security` · `finance` · `automation` · `compliance`

**Create your own skill** (`my-skill/SKILL.md`):
```yaml
---
name: My Custom Skill
version: 1.0.0
description: Does something useful
category: coding
---

Your skill prompt goes here...
```

---

## 🧩 Plugin Architecture

Extend TriAgentOS with community plugins:

```bash
tri plugin list                    # Browse marketplace
tri plugin install tri-notion      # Notion integration
tri plugin install tri-github      # GitHub tool
tri plugin install tri-slack       # Slack integration
```

**Create a plugin** (`plugin.json`):
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Does something cool",
  "type": "command",
  "author": "Your Name"
}
```

---

## ⚡ Workflow Engine

Self-healing multi-step pipelines:

```bash
# Research a topic and write an article (3 steps, auto-retry on failure)
tri flow run research-and-write "The future of AI agents in 2025"

# Review code, fix bugs, write tests
tri flow run code-review-fix "your code here"

# Full startup viability analysis
tri flow run startup-analysis "AI-powered HR software for SMBs"
```

Each step: **Plan → Execute → Validate → Repair** (automatic retry with backoff)

---

## 🔮 Prediction Lab

Simulate possible futures:

```bash
tri predict "OpenAI releases GPT-5 in Q2 2025" --timeframe "12 months"
# Returns: Most likely / Optimistic / Pessimistic / Wild card scenarios
# + Probability estimates + Leading indicators + Recommended actions

tri predict "My startup runs out of runway in 4 months" --domain business
```

---

## 📊 Benchmarks

Compare models on real tasks:

```bash
tri benchmark --providers anthropic,openai,groq

# Output:
# Provider       Avg Score   Errors
# anthropic      87/100      0
# openai         83/100      0  
# groq           71/100      0
```

**Benchmark categories:** `code` · `reasoning` · `creative` · `instruction-following` · `conciseness`

---

## 🎓 TriAgentOS University

Learning paths for every level:

```
university/
├── lessons/
│   ├── 01-what-is-llm.md          ← Start here
│   ├── 02-model-differences.md
│   ├── 03-prompt-engineering.md
│   ├── 04-first-agent-workflow.md
│   └── ...
```

**Paths:** Beginner · Developer · Founder · Security · AI Builder

---

## 🤝 Contributing

We welcome contributions of all sizes!

```bash
git clone https://github.com/Triquantum/TriAgentOS.git
cd TriAgentOS
npm install
npm run validate     # Must pass before submitting PR
```

**High-value contributions:**
- 🔌 New provider adapters (`models/adapters/`)
- 🧩 Community plugins (`marketplace/`)
- 🧠 New skills (`skills/`)
- 🐛 Bug fixes with tests
- 📖 Documentation improvements

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## 🗺️ Roadmap

| Version | Focus | Status |
|---------|-------|--------|
| **v1.0** | Core OS — router, swarm, security, apps | ✅ Released |
| **v1.1** | Developer tools — VSCode extension, git hooks | 🔄 Planned |
| **v1.2** | Community — plugin registry, skill marketplace | 🔄 Planned |
| **v1.5** | Multi-modal — vision, voice, image generation | 🔄 Planned |
| **v2.0** | TriAgentOS Pro — teams, advanced analytics | 🔮 Future |

See [ROADMAP.md](ROADMAP.md) for full details.

---

## 🏢 Editions

| Edition | Target | Status |
|---------|--------|--------|
| **Community** | Developers, builders, solo founders | ✅ Free & Open Source |
| **Pro** | Power users, freelancers | 🔮 Coming Soon |
| **Teams** | Startups, small teams | 🔮 Coming Soon |
| **Enterprise** | Companies, compliance needs | 🔮 Coming Soon |

---

<!-- TRIAGENTOS_DAILY_DISCOVERY_START -->
## 🔭 AI Ecosystem Discovery

*Auto-updated daily · Last scan: **2026-07-02** · Found **50+ repos***

### 🏆 Top 10 AI Repos Right Now

| Rank | Repository | Stars | Category | Score |
|------|-----------|-------|----------|-------|
| 1 | [langchain-ai/langchain](https://github.com/langchain-ai/langchain) | ⭐ 140.7k | `rag` | 100/100 |
| 2 | [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | ⭐ 54.8k | `orchestration` | 100/100 |
| 3 | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | ⭐ 36.3k | `rag` | 100/100 |
| 4 | [AstrBotDevs/AstrBot](https://github.com/AstrBotDevs/AstrBot) | ⭐ 35.7k | `general` | 100/100 |
| 5 | [deepset-ai/haystack](https://github.com/deepset-ai/haystack) | ⭐ 25.8k | `rag` | 100/100 |
| 6 | [langgenius/dify](https://github.com/langgenius/dify) | ⭐ 147.4k | `rag` | 100/100 |
| 7 | [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | ⭐ 47.8k | `orchestration` | 100/100 |
| 8 | [labring/FastGPT](https://github.com/labring/FastGPT) | ⭐ 28.8k | `rag` | 100/100 |
| 9 | [jnMetaCode/agency-agents-zh](https://github.com/jnMetaCode/agency-agents-zh) | ⭐ 16.4k | `orchestration` | 100/100 |
| 10 | [cft0808/edict](https://github.com/cft0808/edict) | ⭐ 16.1k | `security` | 100/100 |

### 📂 By Category

**🔍 Rag**
- [**langchain-ai/langchain**](https://github.com/langchain-ai/langchain) ⭐140.7k — The agent engineering platform.
- [**langchain-ai/langgraph**](https://github.com/langchain-ai/langgraph) ⭐36.3k — Build resilient agents.
- [**deepset-ai/haystack**](https://github.com/deepset-ai/haystack) ⭐25.8k — Open-source AI orchestration framework for building context-engineered, producti

**⚡ Orchestration**
- [**crewAIInc/crewAI**](https://github.com/crewAIInc/crewAI) ⭐54.8k — Framework for orchestrating role-playing, autonomous AI agents. By fostering col
- [**hesreallyhim/awesome-claude-code**](https://github.com/hesreallyhim/awesome-claude-code) ⭐47.8k — A curated list of awesome skills, hooks, slash-commands, agent orchestrators, ap
- [**jnMetaCode/agency-agents-zh**](https://github.com/jnMetaCode/agency-agents-zh) ⭐16.4k — 🎭 266 个即插即用的 AI 专家角色 — 支持 Hermes Agent/Claude Code/Cursor/Copilot 等 18 种工具，覆盖工程

**🤖 General**
- [**AstrBotDevs/AstrBot**](https://github.com/AstrBotDevs/AstrBot) ⭐35.7k — AI Agent Assistant & development framework that integrates lots of IM platforms,
- [**HBAI-Ltd/Toonflow-app**](https://github.com/HBAI-Ltd/Toonflow-app) ⭐11.0k — Toonflow 是开源一站式 AI 短剧创作工具，将小说、剧本快速转化为动画短剧。集成 AI 编剧、智能分镜、角色与视频生成，跨平台桌面端轻量部署，助力创作者
- [**BlockRunAI/ClawRouter**](https://github.com/BlockRunAI/ClawRouter) ⭐6.6k — The agent-native LLM router for OpenClaw. 41+ models, <1ms routing, USDC payment

**🔐 Security**
- [**cft0808/edict**](https://github.com/cft0808/edict) ⭐16.1k — 🏛️ 三省六部制 · OpenClaw Multi-Agent Orchestration System — 9 specialized AI agents 

**🧠 Memory**
- [**zhayujie/CowAgent**](https://github.com/zhayujie/CowAgent) ⭐45.7k — Open-source super AI assistant & Agent Harness. Plans tasks, runs tools and skil

**💻 Coding**
- [**OthmanAdi/planning-with-files**](https://github.com/OthmanAdi/planning-with-files) ⭐24.3k — Persistent file-based planning for AI coding agents and long-running agentic tas
- [**google/adk-python**](https://github.com/google/adk-python) ⭐20.4k — An open-source, code-first Python toolkit for building, evaluating, and deployin
- [**e2b-dev/E2B**](https://github.com/e2b-dev/E2B) ⭐12.8k — Open-source, secure environment with real-world tools for enterprise-grade agent

**🐝 Multi-agent**
- [**camel-ai/camel**](https://github.com/camel-ai/camel) ⭐17.3k — 🐫 CAMEL: The first and the best multi-agent framework. Finding the Scaling Law 

**🖥️ Local-models**
- [**Fosowl/agenticSeek**](https://github.com/Fosowl/agenticSeek) ⭐26.6k — Fully Local Manus AI. No APIs, No $200 monthly bills. Enjoy an autonomous agent 

> Run `tri discover` to refresh · Full data: [`registry/repos.json`](registry/repos.json)

<!-- TRIAGENTOS_DAILY_DISCOVERY_END -->

---

## 📜 License

MIT License — see [LICENSE](LICENSE)

Free to use, modify, and distribute. Attribution appreciated.

---

<div align="center">

**Built with ❤️ by [Triquantum Intelligent Systems Pvt Ltd](https://github.com/Triquantum)**

*If TriAgentOS saves you time, please ⭐ star the repo — it helps others find it!*

[![GitHub Stars](https://img.shields.io/github/stars/Triquantum/TriAgentOS?style=social)](https://github.com/Triquantum/TriAgentOS/stargazers)
[![Twitter Follow](https://img.shields.io/twitter/follow/Triquantum?style=social)](https://twitter.com/Triquantum)

</div>

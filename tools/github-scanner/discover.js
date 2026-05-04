#!/usr/bin/env node
// tools/github-scanner/discover.js — TriAgentOS Daily AI Ecosystem Scanner
// Scans GitHub for top AI agent repos, scores them, updates registry + README

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const REGISTRY_PATH = join(ROOT, 'registry/repos.json');
const README_PATH   = join(ROOT, 'README.md');

const SEARCH_QUERIES = [
  'AI agent framework stars:>500',
  'LLM orchestration stars:>500',
  'multi-agent AI stars:>500',
  'autonomous AI agent stars:>1000',
  'AI workflow automation stars:>500',
  'open-source LLM tools stars:>500',
  'AI operating system stars:>100',
  'model router LLM stars:>100'
];

async function searchGitHub(query, token) {
  const headers = { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'TriAgentOS-Discovery/1.0' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`;
  try {
    const res  = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map(r => ({
      name:        r.full_name,
      url:         r.html_url,
      description: r.description || '',
      stars:       r.stargazers_count,
      language:    r.language || 'Unknown',
      topics:      r.topics || [],
      updatedAt:   r.pushed_at,
      license:     r.license?.spdx_id || 'Unknown',
      forks:       r.forks_count,
      openIssues:  r.open_issues_count
    }));
  } catch { return []; }
}

function scoreRepo(repo) {
  let score = 0;
  // Stars (max 50 points)
  score += Math.min(50, Math.floor(Math.log10(repo.stars + 1) * 15));
  // Recent activity (max 20 points)
  const daysSince = (Date.now() - new Date(repo.updatedAt)) / 86400000;
  score += Math.max(0, 20 - Math.floor(daysSince / 30));
  // Has description (5 points)
  if (repo.description?.length > 20) score += 5;
  // Has license (5 points)
  if (repo.license && repo.license !== 'Unknown') score += 5;
  // AI-relevant topics (up to 15 points)
  const aiKeywords = ['ai','llm','agent','gpt','claude','openai','langchain','rag','ml','nlp'];
  score += Math.min(15, repo.topics.filter(t => aiKeywords.some(k => t.includes(k))).length * 3);
  // Has forks (up to 5 points)
  score += Math.min(5, Math.floor(repo.forks / 100));
  return Math.min(100, score);
}

function categorize(repo) {
  const text = `${repo.name} ${repo.description} ${repo.topics.join(' ')}`.toLowerCase();
  if (text.includes('security') || text.includes('scan') || text.includes('audit')) return 'security';
  if (text.includes('rag') || text.includes('retrieval') || text.includes('vector')) return 'rag';
  if (text.includes('local') || text.includes('ollama') || text.includes('offline')) return 'local-models';
  if (text.includes('workflow') || text.includes('orchestrat') || text.includes('pipeline')) return 'orchestration';
  if (text.includes('memory') || text.includes('knowledge') || text.includes('graph')) return 'memory';
  if (text.includes('code') || text.includes('developer') || text.includes('engineer')) return 'coding';
  if (text.includes('multi-agent') || text.includes('swarm') || text.includes('crew')) return 'multi-agent';
  return 'general';
}

async function run() {
  console.log('🔭 TriAgentOS Daily Discovery Scanner\n');
  const token = process.env.GITHUB_TOKEN;
  if (!token) console.warn('  ⚠ No GITHUB_TOKEN set — rate limits may apply\n');

  const seen = new Set();
  const repos = [];

  for (const query of SEARCH_QUERIES) {
    process.stdout.write(`  Scanning: "${query}"... `);
    const results = await searchGitHub(query, token);
    let added = 0;
    for (const repo of results) {
      if (seen.has(repo.name)) continue;
      seen.add(repo.name);
      repo.score    = scoreRepo(repo);
      repo.category = categorize(repo);
      repos.push(repo);
      added++;
    }
    console.log(`${added} new repos`);
    await new Promise(r => setTimeout(r, 1200)); // respect rate limits
  }

  // Sort by score desc
  repos.sort((a, b) => b.score - a.score);
  const top = repos.slice(0, 50);

  // Save registry
  const registry = { lastUpdated: new Date().toISOString(), totalFound: repos.length, top50: top };
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
  console.log(`\n  ✓ Saved ${top.length} repos to registry/repos.json`);

  // Update README discovery section
  updateReadme(top);
  console.log('  ✓ README discovery section updated\n');

  return registry;
}

function updateReadme(repos) {
  if (!existsSync(README_PATH)) return;
  const readme = readFileSync(README_PATH, 'utf8');
  const start  = '<!-- TRIAGENTOS_DAILY_DISCOVERY_START -->';
  const end    = '<!-- TRIAGENTOS_DAILY_DISCOVERY_END -->';
  if (!readme.includes(start)) return;

  const date = new Date().toISOString().split('T')[0];
  const top10 = repos.slice(0, 10);

  const categories = {};
  repos.slice(0, 30).forEach(r => {
    if (!categories[r.category]) categories[r.category] = [];
    if (categories[r.category].length < 3) categories[r.category].push(r);
  });

  let section = `<!-- TRIAGENTOS_DAILY_DISCOVERY_START -->
## 🔭 AI Ecosystem Discovery

*Auto-updated daily · Last scan: **${date}** · Found **${repos.length}+ repos***

### 🏆 Top 10 AI Repos Right Now

| Rank | Repository | Stars | Category | Score |
|------|-----------|-------|----------|-------|
`;
  top10.forEach((r, i) => {
    const stars = r.stars >= 1000 ? `${(r.stars/1000).toFixed(1)}k` : r.stars;
    section += `| ${i+1} | [${r.name}](${r.url}) | ⭐ ${stars} | \`${r.category}\` | ${r.score}/100 |\n`;
  });

  section += `\n### 📂 By Category\n\n`;
  const catEmoji = { 'multi-agent':'🐝','orchestration':'⚡','rag':'🔍','local-models':'🖥️','coding':'💻','memory':'🧠','security':'🔐','general':'🤖' };
  for (const [cat, catRepos] of Object.entries(categories)) {
    if (!catRepos.length) continue;
    section += `**${catEmoji[cat]||'🤖'} ${cat.charAt(0).toUpperCase()+cat.slice(1)}**\n`;
    catRepos.forEach(r => {
      const desc = r.description?.slice(0, 80) || 'No description';
      const stars = r.stars >= 1000 ? `${(r.stars/1000).toFixed(1)}k` : r.stars;
      section += `- [**${r.name}**](${r.url}) ⭐${stars} — ${desc}\n`;
    });
    section += '\n';
  }

  section += `> Run \`tri discover\` to refresh · Full data: [\`registry/repos.json\`](registry/repos.json)\n\n`;
  section += `<!-- TRIAGENTOS_DAILY_DISCOVERY_END -->`;

  const updated = readme.slice(0, readme.indexOf(start)) + section + readme.slice(readme.indexOf(end) + end.length);
  writeFileSync(README_PATH, updated);
}

// Run if called directly
run().catch(console.error);
export default run;

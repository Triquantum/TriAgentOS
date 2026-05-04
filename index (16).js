// core/memory-graph/index.js — TriAgentOS TriMemory Graph
// Local JSON memory: preferences, projects, workflows, searchable memory
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

const MEM_DIR  = join(homedir(), '.triagentos', 'memory');
const MEM_FILE = join(MEM_DIR, 'graph.json');

function loadGraph() {
  if (!existsSync(MEM_DIR)) mkdirSync(MEM_DIR, { recursive: true });
  if (!existsSync(MEM_FILE)) return { nodes: [], edges: [], metadata: {}, updatedAt: null };
  try { return JSON.parse(readFileSync(MEM_FILE, 'utf8')); }
  catch { return { nodes: [], edges: [], metadata: {}, updatedAt: null }; }
}

function saveGraph(graph) {
  graph.updatedAt = new Date().toISOString();
  writeFileSync(MEM_FILE, JSON.stringify(graph, null, 2));
}

export class MemoryGraph {
  constructor() { this.graph = loadGraph(); }

  add(content, opts = {}) {
    const node = {
      id:        randomUUID(),
      content,
      type:      opts.type    || 'note',        // note | fact | preference | project | workflow | agent
      tags:      opts.tags    || [],
      agent:     opts.agent   || null,
      project:   opts.project || null,
      importance:opts.importance || 'normal',  // low | normal | high | critical
      createdAt: new Date().toISOString(),
      accessCount: 0
    };
    this.graph.nodes.push(node);
    saveGraph(this.graph);
    return node;
  }

  search(query, opts = {}) {
    const lower   = query.toLowerCase();
    const results = this.graph.nodes.filter(n => {
      const matchContent = n.content.toLowerCase().includes(lower);
      const matchTag     = n.tags.some(t => t.toLowerCase().includes(lower));
      const matchType    = !opts.type || n.type === opts.type;
      const matchAgent   = !opts.agent || n.agent === opts.agent;
      const matchProject = !opts.project || n.project === opts.project;
      return (matchContent || matchTag) && matchType && matchAgent && matchProject;
    });

    // Update access counts
    results.forEach(n => { n.accessCount++; });
    if (results.length > 0) saveGraph(this.graph);

    return results.sort((a, b) => {
      const scoreA = (a.content.toLowerCase().includes(lower) ? 2 : 0) + a.accessCount * 0.1 + (a.importance === 'critical' ? 3 : a.importance === 'high' ? 2 : 1);
      const scoreB = (b.content.toLowerCase().includes(lower) ? 2 : 0) + b.accessCount * 0.1 + (b.importance === 'critical' ? 3 : b.importance === 'high' ? 2 : 1);
      return scoreB - scoreA;
    }).slice(0, opts.limit || 20);
  }

  delete(id) {
    const before = this.graph.nodes.length;
    this.graph.nodes = this.graph.nodes.filter(n => n.id !== id);
    if (this.graph.nodes.length < before) { saveGraph(this.graph); return true; }
    return false;
  }

  getAll(opts = {}) {
    let nodes = [...this.graph.nodes];
    if (opts.type)    nodes = nodes.filter(n => n.type === opts.type);
    if (opts.agent)   nodes = nodes.filter(n => n.agent === opts.agent);
    if (opts.project) nodes = nodes.filter(n => n.project === opts.project);
    return nodes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, opts.limit || 100);
  }

  setPreference(key, value) {
    this.graph.metadata[key] = { value, updatedAt: new Date().toISOString() };
    saveGraph(this.graph);
  }

  getPreference(key) { return this.graph.metadata[key]?.value; }

  addEdge(fromId, toId, relation = 'related') {
    this.graph.edges.push({ from: fromId, to: toId, relation, createdAt: new Date().toISOString() });
    saveGraph(this.graph);
  }

  exportAll() { return { ...this.graph, exportedAt: new Date().toISOString() }; }

  stats() {
    const types = {};
    this.graph.nodes.forEach(n => { types[n.type] = (types[n.type] || 0) + 1; });
    return { totalNodes: this.graph.nodes.length, totalEdges: this.graph.edges.length, byType: types, updatedAt: this.graph.updatedAt };
  }

  clear() { this.graph = { nodes: [], edges: [], metadata: {}, updatedAt: null }; saveGraph(this.graph); }
}

export const memoryGraph = new MemoryGraph();
export default memoryGraph;

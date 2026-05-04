// labs/prediction/index.js — TriAgentOS TriPrediction Lab
// Simulate possible futures: assumptions, risks, confidence, opportunity mapping
import { callModel } from '../../models/adapters/index.js';
import { TriRouter } from '../../core/router/index.js';

const PREDICTION_SYSTEM = `You are a strategic forecasting analyst with expertise in scenario planning, 
risk assessment, and opportunity mapping. Think like a combination of McKinsey consultant, 
hedge fund analyst, and systems thinker. Be specific, not generic.`;

export class PredictionLab {
  async predict(event, opts = {}) {
    const route = TriRouter.route(event, { preferQuality: true });
    const timeframe = opts.timeframe || '12 months';
    const domain    = opts.domain    || 'business';

    const result = await callModel(route.provider, {
      messages: [{
        role: 'user',
        content: `Predict possible futures for: "${event}"

Timeframe: ${timeframe}
Domain: ${domain}

Provide a structured prediction with:
1. MOST LIKELY scenario (60-70% probability): detailed description, key indicators
2. OPTIMISTIC scenario (15-25% probability): best-case, what needs to go right
3. PESSIMISTIC scenario (10-20% probability): worst-case, key failure modes
4. WILD CARD scenario (5%): unexpected black swan

For each scenario include:
- Probability estimate (%)
- Key assumptions
- Leading indicators to watch
- Recommended actions

5. OPPORTUNITY MAP: Top 3 opportunities regardless of scenario
6. RISK REGISTER: Top 3 risks to hedge against
7. CONFIDENCE SCORE: 0-100 for the overall prediction quality and data availability

Format each section clearly.`
      }],
      system: PREDICTION_SYSTEM,
      model: route.model,
      maxTokens: 2048,
      temperature: 0.7
    });

    const confidence = this._extractConfidence(result.content);

    return {
      event,
      timeframe,
      domain,
      provider:   route.provider,
      model:      route.model,
      prediction: result.content,
      confidence,
      generatedAt: new Date().toISOString(),
      disclaimer: 'AI predictions are probabilistic estimates, not guarantees. Use for planning, not decisions.'
    };
  }

  async compareScenarios(scenarios, opts = {}) {
    const route  = TriRouter.route(scenarios.join(' '), { preferQuality: true });
    const result = await callModel(route.provider, {
      messages: [{
        role: 'user',
        content: `Compare these ${scenarios.length} scenarios and determine the optimal path:

${scenarios.map((s, i) => `Scenario ${i + 1}: ${s}`).join('\n')}

Analysis required:
1. Probability ranking
2. Risk-adjusted expected value
3. Key differentiating factors
4. Decision criteria for each path
5. Recommended strategy considering uncertainty
6. Hedging strategy`
      }],
      system: PREDICTION_SYSTEM,
      model: route.model,
      maxTokens: 1500,
      temperature: 0.6
    });
    return { scenarios, comparison: result.content, provider: route.provider };
  }

  _extractConfidence(text) {
    const match = text.match(/confidence[:\s]+(\d+)/i) || text.match(/(\d+)%?\s+confidence/i);
    if (match) return parseInt(match[1]);
    return 65; // default
  }
}

export const predictionLab = new PredictionLab();
export default predictionLab;

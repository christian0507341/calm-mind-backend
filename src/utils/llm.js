import { getCoachResponse } from '../llm/llmService.js';

function determineStressBand(context) {
  const avg = context.stress.today_avg;
  if (avg <= 1.5) return 1;
  if (avg <= 2.5) return 2;
  if (avg <= 3.5) return 3;
  if (avg <= 4.5) return 4;
  return 5;
}

async function getLLMResponse(context, message) {
  try {
    const band = determineStressBand(context);
    const response = await getCoachResponse(context, message);
    return {
      response,
      stress_band: band,
      tone: band <= 2 ? (band === 1 ? 'upbeat' : 'practical') :
            band === 3 ? 'supportive' :
            band === 4 ? 'empathetic' : 'calming'
    };
  } catch (error) {
    throw new Error('LLM error: ' + error.message);
  }
}

export { getLLMResponse };
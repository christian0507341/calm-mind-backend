// llm/llmService.js
import axios from 'axios';

const MODEL = 'coach-alex-final';                     // <-- your fine‑tuned model
const URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';

// Tone map (used for the required `tone` field)
const TONE_MAP = {
  1: { tone: 'upbeat' },
  2: { tone: 'practical' },
  3: { tone: 'supportive' },
  4: { tone: 'empathetic' },
  5: { tone: 'calming' }
};

export async function getCoachResponse(stressContext, userInput = '') {
  const today = stressContext?.stress?.today_avg || 3.0;
  const band = Math.min(5, Math.ceil(today));
  const name = stressContext?.student?.name || 'you';
  const hasDistress = /hopeless|die|kill|suicide|give up|can't go on/i.test(userInput.toLowerCase());

  const prompt = `You are **Coach Alex** — a warm, human academic coach.

**CONTEXT**:
- Stress: ${today.toFixed(1)}/5
- Name: ${name}

**USER SAID**: "${userInput}"

Output ONLY valid JSON:`;

  try {
    const { data } = await axios.post(URL, {
      model: MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.3, num_ctx: 2048 }
    });

    const raw = typeof data.response === 'string' ? JSON.parse(data.response) : data;

    // ---- ENSURE ALL REQUIRED FIELDS ----
    const response = String(raw.response || "I'm here with you.").trim();
    const steps = Array.isArray(raw.steps)
      ? raw.steps.filter(s => typeof s === 'string' && s.trim()).slice(0, 3)
      : [];
    const buttons = Array.isArray(raw.buttons)
      ? raw.buttons.filter(b => typeof b === 'string' && b.trim())
      : [];

    const escalation = Boolean(raw.escalation_required) || hasDistress || band >= 5;

    return {
      response,
      stress_band: band,
      tone: TONE_MAP[band].tone,
      steps,
      buttons,
      // optional fields (not required by ChatLog)
      focus_area: raw.focus_area || 'general_support',
      escalation_required: escalation,
      resources: escalation ? (Array.isArray(raw.resources) ? raw.resources : []) : []
    };
  } catch (err) {
    console.error('LLM error:', err.message);

    // ---- SAFE FALLBACK (still satisfies schema) ----
    const fallbackTone = band >= 4 ? 'calming' : 'supportive';
    return {
      response: "I'm here with you. Let's take one breath.",
      stress_band: band,
      tone: fallbackTone,
      steps: ["Breathe in for 4, out for 4"],
      buttons: ["Breathe", "Get Help"]
    };
  }
}
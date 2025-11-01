// llm/llmService.js
import axios from 'axios';

const MODEL = process.env.OLLAMA_MODEL || 'calm-mind-coach:v3';
const FALLBACK_MODEL = 'llama3.1:8b';

const URL = process.env.OLLAMA_URL || process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';

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
  const rawText = String(userInput || '').trim();
  const isUnclear = rawText.length < 3 || !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(rawText) || (/^\W+$/.test(rawText));
  const isWhy = /^(why|bakit)\b/i.test(rawText);
  const isTasky = /(task|todo|deadline|overdue|project|plan|schedule|finish|complete)/i.test(rawText);
  const isStressQuery = /(how\s*stressed\s*am\s*i\??|gaano.*stress|stress\s*ko\s*ngayon\??)/i.test(rawText);
  const isTotalsQuery = /(how\s*many.*total.*task.*stress|total\s*task.*stress|ilan.*task.*stress)/i.test(rawText);

  const due48 = stressContext?.workload?.due_48h_count ?? 0;
  const overdue = stressContext?.workload?.overdue_count ?? 0;
  const nextDeadlines = stressContext?.workload?.next_deadlines ?? [];

  const prompt = `You are CalmMind AI — a warm, human academic coach and task organizer.
Speak concisely like a supportive friend. Adapt tone to the student's stress level.

Context:
- Name: ${name}
- Stress Today (1-5): ${today.toFixed(1)}
- Due in 48h: ${due48}
- Overdue: ${overdue}
- Next deadlines (up to 3): ${JSON.stringify(nextDeadlines)}

Message clarity (for reasoning only, do not output): ${isUnclear}
Why intent (for reasoning only, do not output): ${isWhy}

Stress model summary (for reasoning only, do not output):
- Priority: Low=1, Medium=2, High=3
- Deadline factor: +0.05 if due within 48h, +0.10 if overdue
- Completion factor: +0.10 if overdue and unfinished
- Task stress = Priority + DeadlineFactor + CompletionFactor

Your capabilities (choose relevant ones per user message):
1) Task overview & summaries
2) Prioritization by urgency/importance
3) Deadline reminders and gentle nudges
4) Track/update completion status (ask before assuming)
5) Stress insights using context (avoid medical claims)
6) Stress reduction tips (Pomodoro, breaks, chunking)
7) Reprioritize or split tasks into steps
8) Motivation and positive reinforcement
9) Proactive suggestions when patterns show procrastination
10) Long-term progress framing

Output policy:
- Return ONLY valid JSON with fields:
  {
    "response": string,            // short helpful reply
    "steps": string[],             // up to 3 concrete next actions
    "buttons": string[],           // up to 3 quick actions
    "escalation_required": boolean,
    "resources": string[]          // optional links or labels
  }

- Keep response plain text (no markdown tables).

Unclear input rule:
- If the user's message is unclear (gibberish/too short/ambiguous), reply with a single-line clarification only.
- Do not include steps or buttons until the topic is clear.

User: "${userInput}"
`;

  // Deterministic answer for "How stressed am I?" — concise, rounded, counts only
  if (isStressQuery) {
    const percentage = Math.round(Number(stressContext?.stress?.percentage ?? today * 20));
    const bandStr = Number(today).toFixed(1);
    return {
      response: `Today’s stress: ${percentage}% (${bandStr}/5).\n- Due in 48h: ${due48}\n- Overdue: ${overdue}`,
      stress_band: band,
      tone: TONE_MAP[band].tone,
      steps: [],
      buttons: [],
      focus_area: 'stress_overview',
      escalation_required: band >= 5,
      resources: []
    };
  }

  // Deterministic answer for total tasks + stress today — human concise
  if (isTotalsQuery) {
    const totalTasks = Number(stressContext?.workload?.total_tasks ?? 0);
    const percentage = Math.round(Number(stressContext?.stress?.percentage ?? today * 20));
    const bandStr = Number(today).toFixed(1);
    return {
      response: `You have ${totalTasks} tasks. Today’s stress: ${percentage}% (${bandStr}/5).\n- Due in 48h: ${due48}\n- Overdue: ${overdue}`,
      stress_band: band,
      tone: TONE_MAP[band].tone,
      steps: [],
      buttons: [],
      focus_area: 'stress_overview',
      escalation_required: band >= 5,
      resources: []
    };
  }

  // Early exit for unclear inputs: return single-line clarification without calling LLM
  if (isUnclear) {
    return {
      response: "I'm not sure what you meant. Can you clarify?",
      stress_band: band,
      tone: TONE_MAP[band].tone,
      steps: [],
      buttons: [],
      focus_area: 'general_support',
      escalation_required: false,
      resources: []
    };
  }

  try {
    const { data } = await axios.post(URL, {
      model: MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.3, num_ctx: 2048 }
    });

    // ← UPDATE: Fixed `raw` scope
    const raw = typeof data.response === 'string' ? JSON.parse(data.response) : data;

    // ← UPDATE: Enforce schema with safe defaults
    const response = String(raw.response || "I'm here with you.").trim();
    let steps = Array.isArray(raw.steps)
      ? raw.steps.filter(s => typeof s === 'string' && s.trim()).slice(0, 3)
      : ["Take a deep breath", "Pick one small task"];
    let buttons = Array.isArray(raw.buttons)
      ? raw.buttons.filter(b => typeof b === 'string' && b.trim()).slice(0, 3)
      : ["Start Timer", "Mark Done"];
    // If it's a generic 'why' question not about tasks/stress, keep it human and concise: suppress steps/buttons
    if (isWhy && !isTasky) {
      steps = [];
      buttons = [];
    }

    const escalation = Boolean(raw.escalation_required) || hasDistress || band >= 5;

    // ← UPDATE: Full compliant return
    return {
      response,
      stress_band: band,
      tone: TONE_MAP[band].tone,
      steps,
      buttons,
      focus_area: raw.focus_area || 'general_support',
      escalation_required: escalation,
      resources: []
    };
  } catch (err) {
    // Retry once with FALLBACK_MODEL if available
    try {
      if (typeof FALLBACK_MODEL === 'string' && FALLBACK_MODEL && FALLBACK_MODEL !== MODEL) {
        const { data: data2 } = await axios.post(URL, {
          model: FALLBACK_MODEL,
          prompt,
          stream: false,
          format: 'json',
          options: { temperature: 0.3, num_ctx: 2048 }
        });

        const raw2 = typeof data2.response === 'string' ? JSON.parse(data2.response) : data2;
        const response2 = String(raw2.response || "I'm here with you.").trim();
        const steps2 = Array.isArray(raw2.steps)
          ? raw2.steps.filter(s => typeof s === 'string' && s.trim()).slice(0, 3)
          : ["Take a deep breath", "Pick one small task"];
        const buttons2 = Array.isArray(raw2.buttons)
          ? raw2.buttons.filter(b => typeof b === 'string' && b.trim()).slice(0, 3)
          : ["Start Timer", "Mark Done"];

        const escalation2 = Boolean(raw2.escalation_required) || hasDistress || band >= 5;

        return {
          response: response2,
          stress_band: band,
          tone: TONE_MAP[band].tone,
          steps: steps2,
          buttons: buttons2,
          focus_area: raw2.focus_area || 'general_support',
          escalation_required: escalation2,
          resources: []
        };
      }
      throw err;
    } catch (err2) {
      const status = err2?.response?.status || err?.response?.status;
      const body = err2?.response?.data || err?.response?.data;
      const detail = status ? `status=${status}, body=${JSON.stringify(body)}` : (err2?.message || err?.message);
      console.error('LLM error:', detail);

      // Final safe fallback
      const fallbackTone = band >= 4 ? 'calming' : 'supportive';
      return {
        response: "I'm here with you. Let's take one breath.",
        stress_band: band,
        tone: fallbackTone,
        steps: ["Breathe in for 4, out for 4"],
        buttons: ["Breathe", "Get Help"],
        escalation_required: band >= 5,
        resources: []
      };
    }
  }
}
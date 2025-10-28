import axios from 'axios';
import fs from 'fs';
import path from 'path';

const TONE_MAPPINGS = {
  1: { tone: 'upbeat', style: 'energetic and motivational', maxTokens: 150, maxSteps: 3 },
  2: { tone: 'practical', style: 'clear and structured', maxTokens: 120, maxSteps: 3 },
  3: { tone: 'supportive', style: 'encouraging and reassuring', maxTokens: 100, maxSteps: 2 },
  4: { tone: 'empathetic', style: 'gentle and understanding', maxTokens: 80, maxSteps: 1 },
  5: { tone: 'calming', style: 'soothing and stabilizing', maxTokens: 60, maxSteps: 1 }
};

const DEFAULT_BUTTONS = ['Apply Plan', 'Split Task', 'Reschedule'];
const CRISIS_RESOURCES = "You're not alone—reach out: [Crisis Text Line](https://www.crisistextline.org) or a trusted advisor.";
const DISTRESS_KEYWORDS = /\b(hopeless|suicide|kill|die|end it|give up|pointless)\b/i;

export async function getCoachResponse(stressContext, userInput) {
  const today_avg = stressContext?.stress?.today_avg || 3.0;
  const stress_band = Math.ceil(today_avg);
  const { tone, style, maxTokens, maxSteps } = TONE_MAPPINGS[stress_band];

  // Extract context for personalization
  const context = {
    student: {
      year: stressContext?.student?.year_level || 'unknown',
      timezone: stressContext?.student?.timezone || 'Asia/Manila'
    },
    stress: {
      last: stressContext?.stress?.last_level || 3,
      today: today_avg,
      week: stressContext?.stress?.week_avg || 2.7,
      trend: stressContext?.stress?.trend || 'flat',
      tags: stressContext?.stress?.top_tags || []
    },
    workload: {
      due48h: stressContext?.workload?.due_48h_count || 0,
      overdue: stressContext?.workload?.overdue_count || 0,
      nextDeadlines: stressContext?.workload?.next_deadlines || []
    }
  };

  const stressTrend = context.stress.trend === 'up' ? '📈 increasing'
    : context.stress.trend === 'down' ? '📉 improving'
    : '📊 stable';

  let deadlineContext = 'no immediate deadlines';
  if (context.workload.due48h > 0) {
    deadlineContext = `${context.workload.due48h} tasks due in 48h`;
  } else if (context.workload.overdue > 0) {
    deadlineContext = `${context.workload.overdue} overdue tasks`;
  }

  const stressFactors = stressContext?.stress?.factors || {};
  const taskMetrics = stressFactors?.metrics || {};
  const taskStresses = (stressFactors?.task_stress || []);

  const getPrimaryStressor = () => {
    if (taskMetrics.overdueTasks > 1) return 'multiple overdue tasks';
    if (taskMetrics.due48h > 2) return 'approaching deadlines';
    if (taskStresses[0]?.factors?.priority === 3) return 'high-priority tasks';
    return 'general academic pressure';
  };

  const getStrategySuggestions = () => {
    if (taskMetrics.overdueTasks > 0) {
      return "Focus on overdue task resolution. Consider requesting extensions if needed.";
    }
    if (taskMetrics.due48h > 2) {
      return "Prioritize urgent deadlines. Break work into smaller chunks.";
    }
    if (taskStresses.some(t => t.factors?.priority === 3)) {
      return "Balance high-priority tasks with breaks to maintain focus.";
    }
    return "Maintain steady progress with regular study intervals.";
  };

  const primaryStressor = getPrimaryStressor();
  const strategyFocus = getStrategySuggestions();
  const safeTags = Array.isArray(context.stress.tags) ? context.stress.tags.join(', ') : '';

  const prompt = `

System: You are an AI academic coach specializing in student wellbeing and stress management. Analyze the detailed context and provide targeted, empathetic support.

COACHING APPROACH:
Tone: ${style}
Length: ${maxTokens > 100 ? 'detailed' : 'concise'} (~${maxTokens} tokens)
Focus: ${stress_band >= 4 ? 'emotional support' : 'practical strategies'}
Strategy: ${strategyFocus}


RESPONSE STRUCTURE:
1. Acknowledge their situation with specific reference to the main stressor
2. Provide up to ${maxSteps} targeted actions aligned with the recommended strategy
3. Add motivation based on their stress trend

FEW-SHOT EXAMPLES (Respond using the JSON schema below):
Example 1:
User Input: "I'm two weeks behind on my essay and I don't know where to start."
Expected JSON:
{
  "response": "I can see this is overwhelming — let's start small. First, outline the main headings for your essay today.",
  "steps": ["Create a simple outline (15-30 mins)", "Draft the introduction (30-45 mins)", "Set a follow-up session for editing"],
  "buttons": ["Create Outline", "Schedule Session"],
  "focus_area": "task_breakdown",
  "escalation_required": false
}

Example 2 (distress):
User Input: "I can't cope and I'm really upset about all this work."
Expected JSON:
{
  "response": "I'm sorry you're feeling this way. Please pause and try to breathe with me for a minute. If you feel at risk, contact local emergency services or a trusted person now.",
  "steps": ["Find a safe space and try a 4-4-4 breathing exercise", "Contact a support person or helpline if you feel in danger"],
  "buttons": ["Breathing Exercise", "Get Help"],
  "focus_area": "emotional_support",
  "escalation_required": true,
  "resources": ["Local emergency number", "University counseling service"]
}

Example 3 (overdue tasks):
User Input: "I have three assignments overdue and I'm panicking."
Expected JSON:
{
  "response": "I hear you — having multiple overdue tasks is stressful. Let's pick one task you can finish a small part of right now.",
  "steps": ["Choose the smallest overdue task (10-20 mins)", "Complete a 20-minute focused block", "Send a quick message to your instructor if you need an extension"],
  "buttons": ["Start 20-min", "Request Extension"],
  "focus_area": "overdue_management",
  "escalation_required": false
}

Example 4 (urgent deadlines):
User Input: "Two deadlines tomorrow and I don't know which to do first."
Expected JSON:
{
  "response": "Let's prioritize — identify which deadline has the highest consequence if missed, then allocate the first focused block to that task.",
  "steps": ["List both tasks and impact if missed", "Work on highest-impact task for 45 mins", "Reassess and switch if needed"],
  "buttons": ["Start 45-min", "Reassess"],
  "focus_area": "deadline_management",
  "escalation_required": false
}

Example 5 (high workload):
User Input: "My week is overloaded with labs, readings and exams."
Expected JSON:
{
  "response": "Your workload is heavy — try batching similar tasks and creating a simple schedule with short breaks to protect focus.",
  "steps": ["Group similar tasks into two blocks", "Schedule short 10-min breaks every hour", "Move any low-value tasks to later"],
  "buttons": ["Batch Tasks", "Take Break"],
  "focus_area": "workload_planning",
  "escalation_required": false
}


JSON SCHEMA & RULES:
- Return a single valid JSON object only, with keys: response (string), steps (array of short strings), buttons (optional array), focus_area (string), escalation_required (boolean), resources (optional array if escalation_required=true).
- If distress/crisis language is detected, set "escalation_required": true and include at least one short resource string.
- Keep responses empathetic, concise, and actionable. Avoid giving clinical diagnoses. When in doubt about safety, escalate.

USER QUERY: ${userInput || ''}
Consider their emotional state and the main stressor when crafting your response.
`;
  // Detect distress/crisis language in user input (used for escalation logic)
  const hasDistressSignals = DISTRESS_KEYWORDS.test(String(userInput || ''));

  const payload = {
    model: 'llama3.1:8b',
    prompt,
    stream: false,
    format: 'json',
    options: {
      // Lower temperature for higher stress bands to keep responses consistent and calming
      temperature: stress_band >= 4 ? 0.5 : stress_band === 3 ? 0.6 : 0.75,
      max_tokens: maxTokens,
      top_p: 0.9,
      frequency_penalty: 0.3, // Reduce repetition
      presence_penalty: 0.3   // Encourage diverse responses
    }
  };

  try {
    const url = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
    });

    const raw = response?.data?.response ?? response?.data;
    let data;
    try {
      data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (parseErr) {
      const snippet = String(raw).slice(0, 2000);
      throw new Error('LLM parse error: ' + parseErr.message + ' — raw snippet: ' + snippet);
    }

    // Validate and sanitize the LLM response
    const escalationRequired = Boolean(data?.escalation_required) || hasDistressSignals || stress_band >= 5;

    const sanitizedResponse = {
      response: data?.response?.trim() || "I understand you're dealing with academic stress. Let's break this down into manageable steps.",
      stress_band,
      tone,
      focus_area: data?.focus_area || 'general_support',
      escalation_required: escalationRequired,
      resources: Array.isArray(data?.resources) && data.resources.length > 0
        ? data.resources.filter(r => typeof r === 'string' && r.length > 0)
        : (escalationRequired ? [CRISIS_RESOURCES] : []),
      steps: (data?.steps || [])
        .filter(step => typeof step === 'string' && step.length > 0)
        .slice(0, maxSteps)
        .map(step => step.trim()),
      buttons: Array.isArray(data?.buttons) ? data.buttons : (stress_band <= 3 ? DEFAULT_BUTTONS : [])
    };

    // For high stress (band 5) with distress signals, append crisis resources
    if (stress_band === 5 && hasDistressSignals && !sanitizedResponse.response.includes('Crisis Text Line')) {
      sanitizedResponse.response += '\n\n' + CRISIS_RESOURCES;
    }

    // Ensure we have at least one step unless in severe distress
    if (sanitizedResponse.steps.length === 0 && stress_band < 5) {
      sanitizedResponse.steps = ['Take 5 minutes to write down your main concern'];
    }

    return sanitizedResponse;
  } catch (error) {
    try {
      if (process.env.NODE_ENV === 'development') {
        const logPath = path.resolve(process.cwd(), 'error.log');
        const logEntry = {
          timestamp: new Date().toISOString(),
          type: 'llm_call_failure',
          url,
          payload_snippet: JSON.stringify(payload).slice(0, 2000),
          error_message: error?.message,
          response_status: error?.response?.status ?? null,
          response_body_snippet: error?.response ? JSON.stringify(error.response.data).slice(0, 2000) : null,
        };
        fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
      }
    } catch (logErr) {
      console.error('Failed to write llm debug log:', logErr.message);
    }

    if (error.response) {
      const status = error.response.status;
      const bodySnippet = JSON.stringify(error.response.data).slice(0, 1000);
      throw new Error(`LLM API error: status=${status}, body=${bodySnippet}`);
    }
    throw new Error('LLM API error: ' + error.message);
  }
}



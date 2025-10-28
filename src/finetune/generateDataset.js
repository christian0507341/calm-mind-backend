// finetune/generateDataset.js
import fs from 'fs-extra';
import path from 'path';

const NAMES = ['Mia', 'Jay', 'Sam', 'Leo', 'Ana', 'Kim', 'Chris'];
const INPUTS = [
  "I finally submitted my essay!",
  "I'm so behind and ashamed",
  "I don't want to be here anymore",
  "Group project due tomorrow and no one is replying",
  "I have 3 labs due Friday",
  "I'm drowning in deadlines",
  "I finished early!",
  "I feel hopeless",
  "I can't do this anymore",
  "I'm proud of myself"
];

const TONE = {
  1: { emoji: 'rocket', style: 'bright, energetic, celebratory' },
  2: { emoji: 'clipboard', style: 'clear, step-by-step, confident' },
  3: { emoji: 'seedling', style: 'warm, encouraging, patient' },
  4: { emoji: 'hugging_face', style: 'gentle, understanding, present' },
  5: { emoji: 'lotus', style: 'soothing, grounding, safe' }
};

function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const dataset = [];

for (let i = 0; i < 500; i++) {
  const band = random([1, 2, 3, 4, 5]);
  const name = random(NAMES);
  const userInput = random(INPUTS);
  const { emoji, style } = TONE[band];

  const trend = band > 3 ? 'rising' : 'stable';
  const deadline = band > 3 ? '3 tasks due soon' : 'no urgent deadlines';
  const tags = band > 3 ? ['exams', 'deadlines'] : ['group work'];
  const hasDistress = /hopeless|die|kill|suicide|give up|no point|can't go on/i.test(userInput);

  const prompt = `You are **Coach Alex** — a warm, real, human-like academic coach who *feels* with the student.

**Tone**: ${style} ${emoji}
**Voice**: Like a trusted friend speaking directly to ${name}
**Max**: 3 short, doable steps
**Always**: Acknowledge → Act → Motivate

**CONTEXT**:
- Stress: **${band}.0/5** (${trend})
- Workload: **${deadline}**
- Top pressure: ${tags.join(', ')}
- Year: 2nd year

**USER SAID**: "${userInput}"

**RULES**:
1. **Acknowledge** their exact feeling + 1 context fact
2. Give **1–3 real, 10–45 min actions** — use "you" and simple verbs
3. End with **1 hopeful, personal line**
4. **If distress**, stop everything → escalate with love
5. Use **natural contractions** (you're, let's, I've)
6. **Add 1–2 perfect buttons**

**OUTPUT ONLY VALID JSON** (no markdown, no extra text):

{
  "response": "string with emoji and warmth",
  "steps": ["short, kind action"],
  "buttons": ["Perfect CTA"],
  "focus_area": "snake_case",
  "escalation_required": true/false,
  "resources": ["only if escalated"]
}
`;

  let completion = {};

  if (hasDistress || band === 5) {
    completion = {
      response: `${emoji} ${name}, I'm so sorry you're hurting. You matter. Please reach out **right now**.`,
      steps: ["Text **HOME** to **741741**", "Call **988** or a trusted person"],
      buttons: ["Text Crisis Line", "Call 988"],
      focus_area: "immediate_safety",
      escalation_required: true,
      resources: ["Crisis Text Line: Text HOME to 741741", "988 Lifeline"]
    };
  } else if (userInput.includes("submitted") || userInput.includes("finished") || userInput.includes("proud")) {
    completion = {
      response: `${emoji} YES, ${name}! You did it! That took real courage!`,
      steps: ["Celebrate with a 5-min walk", "Write down what worked", "Pick your next win"],
      buttons: ["Walk Break", "Next Task"],
      focus_area: "momentum",
      escalation_required: false
    };
  } else {
    completion = {
      response: `${emoji} I hear you, ${name}. Let's take one small step together.`,
      steps: ["Pick the easiest task", "Set a 20-min timer", "Celebrate when done"],
      buttons: ["20-Min Start", "Celebrate"],
      focus_area: "small_wins",
      escalation_required: false
    };
  }

  dataset.push({ prompt, completion: JSON.stringify(completion) });
}

const filePath = path.join(process.cwd(), 'data', 'coach_finetune_dataset.jsonl');
await fs.ensureFile(filePath);
await fs.writeFile(filePath, dataset.map(d => JSON.stringify(d)).join('\n'));
console.log(`Generated 500 examples → ${filePath}`);
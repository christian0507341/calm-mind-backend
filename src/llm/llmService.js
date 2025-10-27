import axios from 'axios';

export async function getCoachResponse(stressContext, userInput) {
  const today_avg = stressContext?.stress?.today_avg || 3.0;
  const stress_band = Math.ceil(today_avg);
  const tone = { 1: 'upbeat', 2: 'practical', 3: 'supportive', 4: 'empathetic', 5: 'calming' }[stress_band];
  const max_steps = stress_band >= 4 ? 1 : 3;

  const payload = {
    model: 'llama3.1:8b',
    prompt: `System: You are an academic coach. Adapt tone to stress band (${stress_band}): 1=upbeat, 2=practical, 3=supportive, 4=empathetic, 5=calming. Suggest 1-${max_steps} concrete steps (1 if band>=4). Keep response short for band>=4 (<80 tokens). If band=5 and distressing language (e.g., hopeless, suicide), append: "You're not alone—reach out: [Crisis Text Line](https://www.crisistextline.org)". Output JSON: { response: string, steps: string[], buttons: string[] }.
Context: Student(year_level=${stressContext?.student?.year_level || 'unknown'}, timezone=Asia/Manila), Stress(last=${stressContext?.stress?.last_level || 3}, today_avg=${today_avg}, 7d_avg=${stressContext?.stress?.week_avg || 2.7}, trend=${stressContext?.stress?.trend || 'flat'}, tags=${stressContext?.stress?.top_tags?.join(',') || 'unknown'}), Workload(due_48h=${stressContext?.workload?.due_48h_count || 0}, overdue=${stressContext?.workload?.overdue_count || 0}).
User: ${userInput || ''}`,
    stream: false,
    format: 'json',
  };

  try {
    const response = await axios.post(
      process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = JSON.parse(response.data.response);
    return {
      response: data.response,
      stress_band,
      tone,
      steps: data.steps || [],
      buttons: stress_band <= 3 ? data.buttons || ['Apply Plan', 'Split Task'] : [],
    };
  } catch (error) {
    throw new Error('LLM API error: ' + error.message);
  }
}
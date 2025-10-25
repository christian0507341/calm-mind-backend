import axios from 'axios';

export async function getCoachResponse(stressContext, userInput) {
  // Defensive checks for context values
  const year_level = stressContext?.year_level || 'unknown';
  const today_avg = stressContext?.today_avg || 3.0;
  const last_level = stressContext?.last_level || 3;
  const week_avg = stressContext?.week_avg || 2.7;
  const trend = stressContext?.trend || 'flat';
  const top_tags = Array.isArray(stressContext?.top_tags) ? stressContext.top_tags.join(',') : 'unknown';
  const due_48h = stressContext?.due_48h || 0;
  const overdue = stressContext?.overdue || 0;
  const safeUserInput = userInput || '';

  const payload = {
    model: 'llama3.1:8b',
    prompt: `System: You are an academic coach. Adapt tone by stress band (${today_avg}). Suggest 1–3 steps. Avoid overloading if band>=4. If band=5 and distressing language, suggest support. Context: Student(year_level=${year_level}, timezone=Asia/Manila), Stress(last=${last_level}, today_avg=${today_avg}, 7d_avg=${week_avg}, trend=${trend}, tags=${top_tags}), Workload(due_48h=${due_48h}, overdue=${overdue}). User: ${safeUserInput}`,
    stream: false
  };

  try {
    const response = await axios.post(process.env.OLLAMA_API_URL, payload);
    return response.data.choices[0].message.content;
  } catch (error) {
    throw new Error('LLM API error: ' + error.message);
  }
}
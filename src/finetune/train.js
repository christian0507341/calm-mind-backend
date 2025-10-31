// finetune/train.js
import { Ollama } from 'ollama';
import fs from 'fs-extra';
import path from 'path';

const ollama = new Ollama({ host: 'http://localhost:11434' });
const DATASET = path.join(process.cwd(), 'data', 'calm_coach_finetune.jsonl');
const BASE = 'llama3.1:8b';
const NAME = 'calm-mind-coach';

console.log('Starting fine-tune...');

await ollama.create({
  model: NAME,
  from: BASE,
  finetune: {
    train: DATASET,
    lora: {
      r: 16,
      alpha: 32,
      target_modules: ['q_proj', 'v_proj']
    },
    epochs: 3,
    batch_size: 2,
    learning_rate: 2e-5
  }
});

console.log(`Fine-tune started!`);
console.log(`Run: ollama ps`);
console.log(`When done: ollama create coach-alex-final -f finetune/Modelfile`);
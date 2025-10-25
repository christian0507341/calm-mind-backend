import mongoose from 'mongoose';
import { StressLog, StressDaily } from '../modules/stress/model/stress.model.js';
import Task from '../modules/tasks/model/tasks.model.js';
import { DateTime } from '../utils/luxon.js';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in .env');
  }
  await mongoose.connect(process.env.MONGO_URI);
  await StressLog.deleteMany({});
  await StressDaily.deleteMany({});
  await Task.deleteMany({});

  const logs = [
    { user_id: '123', level: 4, tags: ['Deadline'], timestamp: DateTime.now().setZone('Asia/Manila').minus({ hours: 5 }).toJSDate() },
    { user_id: '123', level: 3, tags: ['Workload'], timestamp: DateTime.now().setZone('Asia/Manila').minus({ hours: 2 }).toJSDate() },
    { user_id: '123', level: 2, tags: ['Personal'], timestamp: DateTime.now().setZone('Asia/Manila').toJSDate() }
  ];
  await StressLog.insertMany(logs);

  const tasks = [
    { user_id: '123', title: 'Math Assignment', due_date: DateTime.now().setZone('Asia/Manila').plus({ days: 1 }).toJSDate(), status: 'Pending' },
    { user_id: '123', title: 'Essay Draft', due_date: DateTime.now().setZone('Asia/Manila').plus({ days: 2 }).toJSDate(), status: 'Pending' }
  ];
  await Task.insertMany(tasks);

  console.log('Seeded');
  mongoose.disconnect();
}

seed();
// src/modules/controller/stress.controller.js
import { StressLog, StressDaily } from '../stress/model/stress.model.js';

export const getStressLogs = async (req, res) => {
  try {
    const { user_id } = req.query;
    const logs = await StressLog.find({ user_id }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stress logs" });
  }
};

export const getStressDaily = async (req, res) => {
  try {
    const { user_id } = req.query;
    const daily = await StressDaily.find({ user_id }).sort({ date_local: -1 });
    res.json(daily);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch daily stress" });
  }
};
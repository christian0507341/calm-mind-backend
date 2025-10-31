// backend/src/llm/routes/llm.routes.js
import express from "express";
import { getCoachResponse } from "../llmService.js";

const router = express.Router();

router.post("/generate", async (req, res) => {
  const { context = {}, message = "" } = req.body || {};
  try {
    console.log("🧠 Incoming LLM Request:", { message });
    // Always return a stable schema; llmService has safe fallbacks on error
    const result = await getCoachResponse(context, message);
    res.json(result);
  } catch (err) {
    // As last resort, still return a safe payload instead of 500
    console.error("❌ LLM route error:", err?.message || err);
    res.json({
      response: "I'm here with you. Let's take one breath.",
      stress_band: 3,
      tone: "supportive",
      steps: ["Breathe in for 4, out for 4"],
      buttons: ["Breathe", "Get Help"],
      escalation_required: false,
      resources: []
    });
  }
});

export default router;

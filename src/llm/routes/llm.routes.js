// backend/src/llm/routes/llm.routes.js
import express from "express";
import { getLLMResponse } from "../../utils/llm.js";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const { context, message } = req.body;
    console.log("🧠 Incoming LLM Request:", { message, context });
    const result = await getLLMResponse(context, message);
    res.json(result);
  } catch (err) {
    console.error("❌ LLM route error:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

export default router;

/* ═══════════════════════════════════════════════════════════
   VelaLight — AI Chat Cloud Function (Proxy لـ Gemini)
   ═══════════════════════════════════════════════════════════ */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

exports.aiChat = onRequest(
  {
    secrets: [GEMINI_API_KEY],
    cors: [
      "https://velalight.github.io",
      "https://velalight.firebaseapp.com",
      /localhost/
    ],
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { contents, generationConfig } = req.body || {};
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const key = GEMINI_API_KEY.value();
    const models = ["gemini-2.0-flash", "gemini-2.5-flash"];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: generationConfig || { temperature: 0.7, maxOutputTokens: 500 }
          })
        });

        if (r.ok) {
          const data = await r.json();
          return res.status(200).json(data);
        }

        logger.warn(`Model ${model} failed: ${r.status}`);
      } catch (e) {
        logger.error(`Error with ${model}:`, e);
      }
    }

    return res.status(502).json({ error: "All models failed" });
  }
);

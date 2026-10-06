import { defineAgent } from "eve";
import { chatgpt } from "eve/models/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Groq expone una API compatible con OpenAI: en producción el agente usa
// la GROQ_API_KEY del servidor. En desarrollo local sigue usando la
// suscripción de ChatGPT (sin gastar API).
const groq = createOpenAICompatible({
  name: "groq",
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Modelo Groq configurable vía GROQ_MODEL (ver console.groq.com para los
// ids vigentes; p. ej. llama-3.3-70b-versatile).
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

export default defineAgent(
  process.env.NODE_ENV === "production"
    ? { model: groq(GROQ_MODEL) }
    : { model: chatgpt("gpt-6-luna"), reasoning: "high" },
);

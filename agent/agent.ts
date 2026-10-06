import { defineAgent } from "eve";
import { chatgpt } from "eve/models/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Groq expone una API compatible con OpenAI: en producción el agente usa
// la GROQ_API_KEY del servidor. En desarrollo local sigue usando la
// suscripción de ChatGPT (sin gastar API).
//
// Los modelos gpt-oss devuelven `reasoning_content` en sus respuestas, pero
// la API de Groq rechaza ese campo cuando se reenvía dentro del historial
// (por ejemplo tras una tool call). Este fetch lo elimina de los mensajes
// salientes; el texto y las tool calls se conservan intactos.
const groqFetch: typeof fetch = async (url, options) => {
  const body = options?.body;

  if (typeof body === "string" && body.includes("reasoning_content")) {
    try {
      const parsed = JSON.parse(body) as {
        messages?: Array<Record<string, unknown>>;
      };

      for (const message of parsed.messages ?? []) {
        if (message && typeof message === "object") {
          delete message.reasoning_content;
        }
      }

      return fetch(url, { ...options, body: JSON.stringify(parsed) });
    } catch {
      // Si algo falla al reescribir el body, se envía la petición original.
    }
  }

  return fetch(url, options);
};

const groq = createOpenAICompatible({
  name: "groq",
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  fetch: groqFetch,
});

// Modelo Groq configurable vía GROQ_MODEL (ver console.groq.com para los
// ids vigentes; p. ej. openai/gpt-oss-120b).
const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

export default defineAgent(
  process.env.NODE_ENV === "production"
    ? { model: groq(GROQ_MODEL) }
    : { model: chatgpt("gpt-6-luna"), reasoning: "high" },
);

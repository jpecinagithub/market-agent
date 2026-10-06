import { defineAgent } from "eve";
import { chatgpt } from "eve/models/openai";

export default defineAgent({
  model: chatgpt("gpt-6-luna"),
  reasoning: "high",
});

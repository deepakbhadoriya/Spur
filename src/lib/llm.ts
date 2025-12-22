import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { Message, DocumentRecord } from "@/types";

export interface GenerateReplyParams {
  history: Message[];
  userMessage: string;
  documents: DocumentRecord[];
}

export async function generateReply({
  history,
  userMessage,
  documents,
}: GenerateReplyParams): Promise<string> {
  // Common Pre-filtering logic
  const lowerMsg = userMessage.toLowerCase();
  const storeKeywords = ["shipping", "return", "refund", "contact", "hour", "email", "support", "payment"];
  const isStoreQuery = storeKeywords.some(k => lowerMsg.includes(k));

  let filteredDocs = documents;
  if (isStoreQuery) {
    filteredDocs = documents.sort((a, b) => {
      const aIsPolicy = a.type === "policy" || a.type === "faq";
      const bIsPolicy = b.type === "policy" || b.type === "faq";
      if (aIsPolicy && !bIsPolicy) return -1;
      if (!aIsPolicy && bIsPolicy) return 1;
      return 0;
    });
  }

  // System instructions shared between providers
  const systemInstruction = `
You are a helpful customer support agent for the Spur e-commerce store.
Use the provided context to answer the user's question.

STRICT RULES:
1. ONLY use information from the provided context.
2. If the answer is not in the context, say: "I'm sorry, I don't have information on that right now."
3. Be professional, concise, and friendly.
4. Do not mention document names or that you are an AI.
5. Ignore unrelated personal documents (like a CV) when asked about store policies correctly.
`.trim();

  // --- PROVIDER ROUTING ---

  // 1. Check for Google Gemini (PRIORITY)
  if (process.env.GOOGLE_GENAI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { temperature: 0 }
      });

      const contextData = filteredDocs.slice(0, 10).map((doc) => `--- DOCUMENT: ${doc.name} ---\n${doc.content}`).join("\n\n");

      const chat = model.startChat({
        history: history.slice(-8).map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        })),
      });

      const prompt = `INSTRUCTIONS: ${systemInstruction}\n\nCONTEXT:\n${contextData}\n\nUSER QUESTION: ${userMessage}`;
      const result = await chat.sendMessage(prompt);
      return (await result.response).text().trim();
    } catch (err) {
      console.error("Gemini Error:", err);
      // If Gemini fails but Groq is available, it will fall through to Groq
    }
  }

  // 2. Fallback to Groq (openai/gpt-oss-120b)
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      });

      const contextData = filteredDocs.slice(0, 8).map((doc) => `--- DOCUMENT: ${doc.name} ---\n${doc.content}`).join("\n\n");

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: systemInstruction },
        ...history.slice(-8).map<OpenAI.Chat.ChatCompletionMessageParam>((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: `CONTEXT:\n${contextData}\n\nUSER QUESTION: ${userMessage}` },
      ];

      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages,
        temperature: 0,
      });

      return completion.choices[0]?.message?.content?.trim() || "No response.";
    } catch (err) {
      console.error("Groq Error:", err);
    }
  }

  return "I'm sorry, I couldn't connect to my brain. Please ensure your API keys (Google or Groq) are set up correctly.";
}

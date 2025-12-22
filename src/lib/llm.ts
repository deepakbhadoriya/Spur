import OpenAI from "openai";
import type { Message, DocumentRecord } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  // Fail fast on misconfiguration in development
  console.warn("OPENAI_API_KEY is not set. LLM calls will fail.");
}

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
  const systemPrompt = [
    "You are a helpful support agent for a small e-commerce store.",
    "Answer clearly and concisely.",
    "Use the store policies and FAQs provided below when relevant.",
  ].join(" ");

  const docsText =
    documents.length > 0
      ? documents
        .map(
          (doc) =>
            `Document: ${doc.name} (type: ${doc.type})\n${doc.content.slice(
              0,
              4000
            )}`
        )
        .join("\n\n")
      : "No additional store documents are available.";

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${systemPrompt}\n\nStore documents:\n${docsText}`,
    },
    ...history
      .slice(-15)
      .map<OpenAI.Chat.ChatCompletionMessageParam>((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    {
      role: "user",
      content: userMessage,
    },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 400,
      temperature: 0.4,
    });

    const choice = completion.choices[0]?.message?.content;
    if (!choice) {
      throw new Error("No content returned from LLM");
    }

    return typeof choice === "string" ? choice : String(choice);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "Sorry, I'm having trouble talking to the AI service right now. Please try again in a few seconds.";
  }
}



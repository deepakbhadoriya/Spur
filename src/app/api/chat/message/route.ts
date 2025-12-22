import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getChatsCollection,
  getMessagesCollection,
  getDocumentsCollection,
} from "@/lib/db";
import { generateReply } from "@/lib/llm";
import { ensureDefaultDocumentsSeeded } from "@/lib/seedDefaultDocuments";
import type { Message } from "@/types";

interface RequestBody {
  message: string;
  chatId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const rawMessage = body.message ?? "";
    const userMessage = rawMessage.trim();

    if (!userMessage) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400 }
      );
    }

    if (userMessage.length > 2000) {
      return NextResponse.json(
        { error: "Message is too long. Please shorten it and try again." },
        { status: 400 }
      );
    }

    const chatsCollection = await getChatsCollection();
    const messagesCollection = await getMessagesCollection();
    const documentsCollection = await getDocumentsCollection();

    // Make sure default store documents exist at least once
    await ensureDefaultDocumentsSeeded();

    let chatId = body.chatId;

    // Create new chat if needed
    if (!chatId) {
      chatId = randomUUID();
      const nowIso = new Date().toISOString();
      await chatsCollection.insertOne({
        chatId,
        createdAt: nowIso,
        updatedAt: nowIso,
        title: userMessage.slice(0, 60),
      });
    }

    const now = new Date().toISOString();

    const userMessageRecord: Message = {
      chatId,
      sender: "user",
      text: userMessage,
      createdAt: now,
    };

    await messagesCollection.insertOne(userMessageRecord);

    // Fetch history for this chat
    const history = (await messagesCollection
      .find({ chatId })
      .sort({ createdAt: 1 })
      .toArray()) as Message[];

    // Fetch all documents (FAQ, policies, etc.)
    const documents = await documentsCollection.find({}).toArray();

    const replyText = await generateReply({
      history,
      userMessage,
      documents,
    });

    const aiMessageRecord: Message = {
      chatId,
      sender: "ai",
      text: replyText,
      createdAt: new Date().toISOString(),
    };

    await messagesCollection.insertOne(aiMessageRecord);

    await chatsCollection.updateOne(
      { chatId },
      { $set: { updatedAt: new Date().toISOString() } }
    );

    return NextResponse.json({ reply: replyText, chatId });
  } catch (error) {
    console.error("Error in POST /api/chat/message:", error);
    return NextResponse.json(
      {
        error:
          "Something went wrong while processing your message. Please try again.",
      },
      { status: 500 }
    );
  }
}



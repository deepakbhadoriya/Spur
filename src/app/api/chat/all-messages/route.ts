import { NextResponse } from "next/server";
import { getChatsCollection, getMessagesCollection } from "@/lib/db";
import type { Chat, Message } from "@/types";

export async function GET() {
  try {
    const chatsCollection = await getChatsCollection();
    const messagesCollection = await getMessagesCollection();

    const chats = (await chatsCollection
      .find({})
      .sort({ updatedAt: -1 })
      .toArray()) as Chat[];

    // Attach last message preview for convenience
    const chatIds = chats.map((c) => c.chatId);

    const lastMessages = (await messagesCollection
      .aggregate<Message>([
        { $match: { chatId: { $in: chatIds } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$chatId",
            lastMessage: { $first: "$$ROOT" },
          },
        },
      ])
      .toArray()) as unknown as { _id: string; lastMessage: Message }[];

    const lastMessageByChatId = new Map<string, Message>();
    for (const item of lastMessages) {
      lastMessageByChatId.set(item._id, item.lastMessage);
    }

    const result = chats.map((chat) => ({
      ...chat,
      lastMessage: lastMessageByChatId.get(chat.chatId) ?? null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/chat/all-messages:", error);
    return NextResponse.json(
      { error: "Failed to load chats" },
      { status: 500 }
    );
  }
}



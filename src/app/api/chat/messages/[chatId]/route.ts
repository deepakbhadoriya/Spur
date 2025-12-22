import { NextRequest, NextResponse } from "next/server";
import { getMessagesCollection } from "@/lib/db";
import type { Message } from "@/types";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await context.params;

    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 }
      );
    }

    const messagesCollection = await getMessagesCollection();
    const messages = (await messagesCollection
      .find({ chatId })
      .sort({ createdAt: 1 })
      .toArray()) as Message[];

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error in GET /api/chat/messages/[chatId]:", error);
    return NextResponse.json(
      { error: "Failed to load messages for this chat" },
      { status: 500 }
    );
  }
}



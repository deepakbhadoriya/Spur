import { Collection } from "mongodb";
import { getDb } from "./mongodb";
import type { Chat, Message, DocumentRecord } from "@/types";

export async function getChatsCollection(): Promise<Collection<Chat>> {
  const db = await getDb();
  return db.collection<Chat>("chats");
}

export async function getMessagesCollection(): Promise<Collection<Message>> {
  const db = await getDb();
  return db.collection<Message>("messages");
}

export async function getDocumentsCollection(): Promise<
  Collection<DocumentRecord>
> {
  const db = await getDb();
  return db.collection<DocumentRecord>("documents");
}



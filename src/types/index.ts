export type Sender = "user" | "ai";

export interface Chat {
  _id?: string;
  chatId: string;
  createdAt: string;
  updatedAt: string;
  title?: string;
}

export interface Message {
  _id?: string;
  chatId: string;
  sender: Sender;
  text: string;
  createdAt: string;
  tokens?: number;
}

export type DocumentType = "faq" | "policy" | "custom";

export interface DocumentRecord {
  _id?: string;
  name: string;
  content: string;
  type: DocumentType;
  uploadedAt: string;
}



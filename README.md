## Spur – AI Live Chat Support Agent

This is a mini AI support agent built with **Next.js + TypeScript**, implementing the Spur take-home assignment. It provides a live chat experience backed by an LLM (OpenAI) with persistent conversations and document-based context.

### Tech Stack

- **Frontend & Backend**: Next.js (App Router, TypeScript)
- **UI**: React + MUI (Material UI)
- **Data fetching**: React Query
- **Database**: MongoDB
- **LLM**: OpenAI (Chat Completions API)

---

## Running the Project Locally

### 1. Install dependencies

```bash
cd web
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the `web` directory:

```bash
cd web
cp .env.local.example .env.local # if available, or create manually
```

Required variables:

- `MONGODB_URI` – connection string to your MongoDB instance (e.g. `mongodb://localhost:27017/spur_chat`)
- `OPENAI_API_KEY` – your OpenAI API key
- `NEXT_PUBLIC_APP_URL` – e.g. `http://localhost:3000`

> **Note**: Do not commit `.env.local` to git.

### 3. Start MongoDB

Make sure a MongoDB instance is running and accessible using `MONGODB_URI`.

### 4. Run the dev server

```bash
cd web
npm run dev
```

Then open `http://localhost:3000` in your browser.

---

## User Flow

1. Land on the home page and click **“Chat with Customer Support”**.
2. On the `/chat` page:
   - Left panel: **Conversations list** with “New chat” button.
   - Middle panel: **Chat window** (user/AI messages, input box, send/pause button, “Agent is typing…”).
   - Right panel: **Document manager** (view, upload, delete PDFs used as knowledge).
3. Messages are sent to `/api/chat/message`, persisted in MongoDB, and answered by the OpenAI-backed agent.
4. Conversation history can be reloaded any time via the chat list.

---

## Data Model

- **chats**
  - `chatId: string`
  - `createdAt: string`
  - `updatedAt: string`
  - `title?: string`
- **messages**
  - `chatId: string`
  - `sender: "user" | "ai"`
  - `text: string`
  - `createdAt: string`
- **documents**
  - `name: string`
  - `content: string`
  - `type: "faq" | "policy" | "custom"`
  - `uploadedAt: string`

---

## API Endpoints

- `POST /api/chat/message`
  - Body: `{ message: string, chatId?: string }`
  - Returns: `{ reply: string, chatId: string }`
  - Behavior:
    - Validates input (non-empty, max length).
    - Creates a new chat when `chatId` is missing.
    - Persists user + AI messages.
    - Calls OpenAI with:
      - System prompt: **“You are a helpful support agent for a small e‑commerce store. Answer clearly and concisely.”**
      - Plus default and uploaded store documents.
      - Recent conversation history.

- `GET /api/chat/all-messages`
  - Returns all chats with last message preview.

- `GET /api/chat/messages/[chatId]`
  - Returns all messages for a given `chatId`.

- `GET /api/chat/documents`
  - Returns all stored documents.

- `POST /api/chat/documents`
  - Multipart body: `file` (PDF), optional `type`.
  - Extracts text from PDF and stores it as a document.

- `DELETE /api/chat/documents/[id]`
  - Deletes the specified document.

---

## LLM Integration

- Provider: **OpenAI** (`gpt-4o-mini` by default).
- Wrapper: `generateReply(history, userMessage, documents)` in `src/lib/llm.ts`.
- Prompt includes:
  - System text: **“You are a helpful support agent for a small e-commerce store. You are a helpful support agent. Answer clearly and concisely.”**
  - Store documents (shipping, returns, support hours + any uploaded PDFs).
  - Last N messages from the conversation.
- Basic guardrails:
  - Errors from OpenAI are caught and surfaced as a friendly error message.
  - Message length is validated on the backend.

---

## Default Store Knowledge

On first use, the backend seeds three default documents (if none exist):

- **Shipping Policy**
- **Return & Refund Policy**
- **Support Hours & Contact**

These are stored in the `documents` collection and always included in the LLM context alongside any uploaded PDFs.

---

## Architecture Overview

- **App Router** with:
  - `app/page.tsx` – landing page.
  - `app/chat/page.tsx` – main 3-panel chat interface.
- **Server-side**:
  - MongoDB connection in `src/lib/mongodb.ts` and collection helpers in `src/lib/db.ts`.
  - LLM integration in `src/lib/llm.ts`.
  - Default document seeding in `src/lib/seedDefaultDocuments.ts`.
- **Client-side**:
  - `Sidebar` – conversations list & “New chat”.
  - `ChatPanel` – messages, input, send/pause, “Agent is typing…”.
  - `DocumentManager` – upload / list / delete PDFs.
  - React Query is configured in `app/layout.tsx`.

---

## Trade-offs & If I Had More Time

- Add **streaming responses** from the LLM for a more real-time feel.
- Implement **authentication** and multi-user separation.
- Add **Redis caching** for recent histories and documents.
- Write **unit/integration tests** for API routes and LLM service.
- Add **rate limiting** on chat endpoints.
- Improve **responsive design** on very small screens with more refined breakpoints.


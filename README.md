## Spur – AI Live Chat Support Agent

This is a mini AI support agent built with **Next.js + TypeScript**, implementing the Spur take-home assignment. It provides a live chat experience backed by powerful LLMs (Gemini or Groq) with persistent conversations and document-based context.

### Tech Stack

- **Frontend & Backend**: Next.js (App Router, TypeScript)
- **UI**: React + MUI (Material UI)
- **Data fetching**: React Query
- **Database**: MongoDB
- **LLM Providers**: 
  - **Google Gemini** (gemini-2.5-flash) - Native large context window support.
  - **Groq** (openai/gpt-oss-120b) - High-performance low-latency responses (500+ tok/s).

---

## Running the Project Locally

### 1. Install dependencies

```bash
cd web
npm install
```

### 2. Configure environment variables

Create a `.env` file in the `web` directory:

```bash
cd web
cp .env.example .env
```

Required variables:

- `MONGODB_URI` – connection string to your MongoDB instance.
- `GOOGLE_GENAI_API_KEY` – your Google Gemini API key (Free tier available at https://aistudio.google.com).
- **OR**
- `GROQ_API_KEY` – your Groq API key (Available at https://console.groq.com).
- `NEXT_PUBLIC_APP_URL` – e.g. `http://localhost:3000`

> **Note**: The application automatically routes requests based on which key is provided. If `GOOGLE_GENAI_API_KEY` is present, it prioritizes Gemini for its large context window.

### 3. Start MongoDB

Make sure a MongoDB instance is running and accessible using `MONGODB_URI`.

### 4. Run the dev server

```bash
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
3. Messages are sent to `/api/chat/message`, persisted in MongoDB, and answered by the selected LLM provider.
4. Conversation history can be reloaded any time via the chat list.

---

## Data Model

- **chats**: `chatId`, `createdAt`, `updatedAt`, `title`.
- **messages**: `chatId`, `sender` ("user" | "ai"), `text`, `createdAt`.
- **documents**: `name`, `content`, `type` ("faq" | "policy" | "custom"), `uploadedAt`.

---

## API Endpoints

- `POST /api/chat/message`: Handles message processing and LLM generation.
- `GET /api/chat/all-messages`: Returns all chats with last message preview.
- `GET /api/chat/messages/[chatId]`: Returns conversation history.
- `GET /api/chat/documents`: Lists all knowledge base documents.
- `POST /api/chat/documents`: Uploads and parses PDF documents.
- `DELETE /api/chat/documents/[id]`: Removes a document from knowledge base.

---

## LLM Features & Guardrails

- **Dynamic Routing**: Automatically switches between Gemini and Groq based on available environment variables.
- **Smart Context**: 
  - **Google Gemini**: Uses `gemini-2.5-flash` with a large context window for complex queries involving multiple documents.
  - **Groq**: Uses `openai/gpt-oss-120b` for instant, high-intelligence responses.
- **Document Pre-filtering**: Automatically prioritizes store policy documents over personal uploads (like CVs) when store-related questions are detected.
- **Strict Guidelines**: The agent is instructed to only use provided document data and never hallucinate internal metadata or name documents.

---

## Default Store Knowledge

On first use, the backend seeds three default documents:
- **Shipping Policy**
- **Return & Refund Policy**
- **Support Hours & Contact**

These provide the baseline "Source of Truth" for the agent.

---

## Architecture Overview

- **App Router**: Optimized server/client component separation.
- **Server Actions/API Routes**: Safe handling of LLM keys and DB operations.
- **Material UI**: Implementation of a modern "glassmorphism" and "independent scroll" design.
- **React Query**: Efficient state management and cache invalidation.
- **PDF Extraction**: Server-side parsing of uploaded knowledge documents.

"use client";

import { ReactNode, useState } from "react";
import { Box } from "@mui/material";
import { Sidebar } from "./Sidebar";
import { ChatPanel } from "./ChatPanel";
import { DocumentManager } from "./DocumentManager";

export function ChatLayout(): ReactNode {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  return (
    <Box
      height="100vh"
      display="grid"
      gridTemplateColumns="260px 1.6fr 1.1fr"
      overflow="hidden"
    >
      <Sidebar
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        onChatCreated={setSelectedChatId}
      />
      <ChatPanel
        chatId={selectedChatId}
        onChatCreated={setSelectedChatId}
      />
      <DocumentManager />
    </Box>
  );
}

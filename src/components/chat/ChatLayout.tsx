"use client";

import { ReactNode, useState } from "react";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { Sidebar } from "./Sidebar";
import { ChatPanel } from "./ChatPanel";
import { DocumentManager } from "./DocumentManager";

export function ChatLayout(): ReactNode {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [docManagerOpen, setDocManagerOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const toggleSidebar = (open: boolean) => () => {
    setSidebarOpen(open);
  };

  const toggleDocManager = (open: boolean) => () => {
    setDocManagerOpen(open);
  };

  return (
    <Box
      height="100vh"
      display="grid"
      gridTemplateColumns={isMobile ? "1fr" : "260px 1.6fr 1.1fr"}
      overflow="hidden"
    >
      {/* Sidebar - Drawer on Mobile, Static on Desktop */}
      {isMobile ? (
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={toggleSidebar(false)}
          PaperProps={{
            sx: { width: 280, backgroundImage: "none", bgcolor: "background.default" },
          }}
        >
          <Sidebar
            selectedChatId={selectedChatId}
            onSelectChat={(id) => {
              setSelectedChatId(id);
              setSidebarOpen(false);
            }}
            onChatCreated={(id) => {
              setSelectedChatId(id);
              setSidebarOpen(false);
            }}
          />
        </Drawer>
      ) : (
        <Sidebar
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          onChatCreated={setSelectedChatId}
        />
      )}

      {/* Main Chat Panel */}
      <ChatPanel
        chatId={selectedChatId}
        onChatCreated={setSelectedChatId}
        onToggleSidebar={isMobile ? toggleSidebar(true) : undefined}
        onToggleDocManager={isMobile ? toggleDocManager(true) : undefined}
      />

      {/* Document Manager - Drawer on Mobile, Static on Desktop */}
      {isMobile ? (
        <Drawer
          anchor="right"
          open={docManagerOpen}
          onClose={toggleDocManager(false)}
          PaperProps={{
            sx: { width: "85vw", maxWidth: 400, backgroundImage: "none", bgcolor: "background.default" },
          }}
        >
          <DocumentManager />
        </Drawer>
      ) : (
        <DocumentManager />
      )}
    </Box>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { Chat, Message } from "@/types";

interface ChatWithPreview extends Chat {
  lastMessage?: Message | null;
}

interface SidebarProps {
  onSelectChat?: (chatId: string | null) => void;
}

export function Sidebar({ onSelectChat }: SidebarProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const { data: chats, refetch } = useQuery<ChatWithPreview[]>({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await fetch("/api/chat/all-messages");
      if (!res.ok) {
        throw new Error("Failed to load chats");
      }
      return res.json();
    },
  });

  useEffect(() => {
    onSelectChat?.(selectedChatId);
  }, [onSelectChat, selectedChatId]);

  const handleNewChat = () => {
    setSelectedChatId(null);
    onSelectChat?.(null);
    refetch();
  };

  return (
    <Box
      component="aside"
      display="flex"
      flexDirection="column"
      borderRight={1}
      borderColor="divider"
      p={2}
    >
      <Typography variant="h6" gutterBottom>
        Conversations
      </Typography>
      <Button
        variant="contained"
        color="success"
        startIcon={<AddIcon />}
        onClick={handleNewChat}
        fullWidth
      >
        New chat
      </Button>
      <Divider />
      <List
        sx={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        {chats?.map((chat) => (
          <ListItem key={chat.chatId} disablePadding>
            <ListItemButton
              selected={chat.chatId === selectedChatId}
              onClick={() => setSelectedChatId(chat.chatId)}
            >
              <ListItemText
                primary={chat.title || "Untitled chat"}
                secondary={
                  chat.lastMessage?.text
                    ? chat.lastMessage.text.slice(0, 50)
                    : "No messages yet"
                }
                primaryTypographyProps={{ noWrap: true }}
                secondaryTypographyProps={{ noWrap: true }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        {chats && chats.length === 0 && (
          <Typography variant="body2" color="text.secondary" mt={2}>
            No conversations yet. Start a new chat to see it appear here.
          </Typography>
        )}
      </List>
    </Box>
  );
}



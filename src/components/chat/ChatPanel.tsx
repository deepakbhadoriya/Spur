"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PauseIcon from "@mui/icons-material/Pause";
import type { Message } from "@/types";

interface ChatPanelProps {
  chatId?: string | null;
}

export function ChatPanel({ chatId }: ChatPanelProps) {
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId ?? null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const effectiveChatId = useMemo(
    () => chatId ?? currentChatId,
    [chatId, currentChatId]
  );

  const {
    data: messages,
    refetch,
    isFetching,
  } = useQuery<Message[]>({
    queryKey: ["messages", effectiveChatId],
    queryFn: async () => {
      if (!effectiveChatId) return [];
      const res = await fetch(`/api/chat/messages/${effectiveChatId}`);
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    enabled: !!effectiveChatId,
  });

  useEffect(() => {
    if (chatId && chatId !== currentChatId) {
      setCurrentChatId(chatId);
      refetch();
    }
  }, [chatId, currentChatId, refetch]);

  const canSend = input.trim().length > 0 && !isSending;

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          chatId: effectiveChatId ?? undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send message");
      }

      const data = (await res.json()) as { reply: string; chatId: string };
      setInput("");
      setCurrentChatId(data.chatId);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chats"] }),
        queryClient.invalidateQueries({ queryKey: ["messages", data.chatId] }),
      ]);
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // Swallow abort error
      } else {
        console.error("Error sending message:", error);
        alert(
          "Something went wrong while sending your message. Please try again."
        );
      }
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        void handleSend();
      }
    }
  };

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isFetching]);

  return (
    <Box
      component="section"
      display="flex"
      flexDirection="column"
      borderRight={1}
      borderColor="divider"
    >
      <Box component="header" p={2} borderBottom={1} borderColor="divider">
        <Typography variant="subtitle1">Support chat</Typography>
        <Typography variant="body2" color="text.secondary">
          Ask about shipping, returns, or anything about our fictional store.
        </Typography>
      </Box>

      <Box
        flex={1}
        overflow="auto"
        p={2}
        display="flex"
        flexDirection="column"
        gap={1.5}
      >
        {messages?.map((m) => (
          <Box
            key={m.createdAt + m.sender}
            alignSelf={m.sender === "user" ? "flex-end" : "flex-start"}
            maxWidth="75%"
            borderRadius={2}
            px={1.5}
            py={1}
            bgcolor={m.sender === "user" ? "primary.main" : "background.paper"}
            color={m.sender === "user" ? "primary.contrastText" : "text.primary"}
            whiteSpace="pre-wrap"
          >
            <Typography variant="body2">{m.text}</Typography>
          </Box>
        ))}

        {(isFetching || isSending) && (
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            color="text.secondary"
          >
            <CircularProgress size={16} />
            <Typography variant="body2">Agent is typing…</Typography>
          </Box>
        )}

        <div ref={endRef} />
      </Box>

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSend) void handleSend();
        }}
        display="flex"
        gap={1}
        alignItems="center"
        p={1.5}
        borderTop={1}
        borderColor="divider"
      >
        <TextField
          fullWidth
          size="small"
          multiline
          maxRows={3}
          placeholder="Type your message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isSending}
        />
        <IconButton
          color={isSending ? "warning" : "primary"}
          onClick={isSending ? handleCancel : handleSend}
          disabled={!canSend && !isSending}
        >
          {isSending ? <PauseIcon /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
}



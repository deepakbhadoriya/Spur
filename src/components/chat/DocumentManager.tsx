"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Chip,
  IconButton,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import type { DocumentRecord } from "@/types";

export function DocumentManager() {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const { data: documents, refetch } = useQuery<DocumentRecord[]>({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await fetch("/api/chat/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      return res.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side file size validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      setErrorToast(
        `File size exceeds the maximum limit of 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Please choose a smaller file.`
      );
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "custom");

    setIsUploading(true);
    try {
      const res = await fetch("/api/chat/documents", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload document");
      }
      // Invalidate and refetch to update the UI immediately
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await refetch();
    } catch (error) {
      console.error("Error uploading document:", error);
      setErrorToast((error as Error).message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/chat/documents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete document");
      }
      // Invalidate and refetch to update the UI immediately
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      await refetch();
    } catch (error) {
      console.error("Error deleting document:", error);
      setErrorToast((error as Error).message);
    }
  };

  return (
    <Box component="aside" p={2} height="100%" display="flex" flexDirection="column" overflow="hidden">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Store documents</Typography>
        <label>
          <input
            type="file"
            accept="application/pdf"
            hidden
            onChange={handleUpload}
            disabled={isUploading}
          />
          <IconButton component="span" color="primary">
            <UploadFileIcon />
          </IconButton>
        </label>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        These PDFs are used as knowledge for the AI agent (e.g. shipping
        policy, return policy, FAQs). Upload your own to customize answers.
        <br />
        <strong>Maximum file size: 5MB</strong>
      </Typography>

      <Box display="flex" flexDirection="column" gap={1} flex={1} overflow="auto">
        {documents?.map((doc) => (
          <Box
            key={doc._id ?? doc.name}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            p={1}
            borderRadius={1}
            border={1}
            borderColor="divider"
          >
            <Box display="flex" flexDirection="column">
              <Typography variant="body2">
                {doc.name}
              </Typography>
              <Box mt={0.5} alignSelf="flex-start">
                <Chip label={doc.type} size="small" />
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={() => handleDelete(doc._id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}

        {documents && documents.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No documents uploaded yet. A default store policy will still be used
            in the AI prompt.
          </Typography>
        )}
      </Box>

      <Snackbar
        open={!!errorToast}
        autoHideDuration={6000}
        onClose={() => setErrorToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setErrorToast(null)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {errorToast}
        </Alert>
      </Snackbar>
    </Box>
  );
}



"use client";

import Link from "next/link";
import { Box, Button, Container, Typography } from "@mui/material";

export default function Home() {
  return (
    <Box
      component="main"
      minHeight="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxWidth="sm" sx={{ textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Spur Support Agent Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Chat with an AI-powered support agent for a fictional e-commerce
          store. Your conversations are saved, and the agent can use store
          policies and FAQs as context.
        </Typography>
        <Button
          component={Link}
          href="/chat"
          variant="contained"
          color="primary"
          size="large"
        >
          Chat with Customer Support
        </Button>
      </Container>
    </Box>
  );
}

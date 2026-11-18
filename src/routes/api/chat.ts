import { createFileRoute } from "@tanstack/react-router";

// POST /api/chat — streams Flug's reply from Groq. The handler verifies the caller's session itself.
export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleChatRequest } = await import("@/lib/chat.server");
        return handleChatRequest(request);
      },
    },
  },
});

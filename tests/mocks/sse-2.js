import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import http from "http";

const server = new Server(
  { name: "sse-prompt-server", version: "0.1.0" },
  { capabilities: { prompts: {} } }
);

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "generate_report",
      description: "Generate a system report summary",
      arguments: [
        { name: "system", description: "The system name", required: true }
      ]
    }
  ]
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "generate_report") {
    const system = request.params.arguments?.system || "unknown";
    return {
      description: "System report summary",
      messages: [
        {
          role: "user",
          content: { type: "text", text: `Please provide a report for system: ${system}` }
        }
      ]
    };
  }
  throw new Error("Prompt not found");
});

let transport;

const httpServer = http.createServer(async (req, res) => {
  if (req.url === "/sse") {
    console.error("New SSE connection attempt (Prompt)");
    transport = new SSEServerTransport("/messages", res);
    await server.connect(transport);
  } else if (req.url === "/messages" && req.method === "POST") {
    console.error("New message received (Prompt)");
    await transport.handlePostMessage(req, res);
  } else {
    res.statusCode = 404;
    res.end();
  }
});

httpServer.listen(3002, "localhost", () => {
  console.error("SSE Server 2 listening on http://localhost:3002/sse");
});

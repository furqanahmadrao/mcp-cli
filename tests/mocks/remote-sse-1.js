import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import http from "http";

const server = new Server(
  { name: "remote-sse-server", version: "0.1.0" },
  { capabilities: { tools: {}, resources: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_remote_time",
      description: "Get the current time from the remote server",
      inputSchema: { type: "object", properties: {} }
    }
  ]
}));

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "remote://server/status",
      name: "Remote Server Status",
      description: "Health and status of the remote SSE server",
      mimeType: "application/json"
    }
  ]
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === "remote://server/status") {
    return {
      contents: [{
        uri: "remote://server/status",
        mimeType: "application/json",
        text: JSON.stringify({ status: "healthy", transport: "sse", connections: 1 })
      }]
    };
  }
  throw new Error("Resource not found");
});

let transport;

const httpServer = http.createServer(async (req, res) => {
  if (req.url === "/sse") {
    console.error("New SSE connection attempt");
    transport = new SSEServerTransport("/messages", res);
    await server.connect(transport);
  } else if (req.url === "/messages" && req.method === "POST") {
    console.error("New message received");
    await transport.handlePostMessage(req, res);
  } else {
    res.statusCode = 404;
    res.end();
  }
});

httpServer.listen(3001, "localhost", () => {
  console.error("SSE Server 1 listening on http://localhost:3001/sse");
});

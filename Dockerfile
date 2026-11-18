# Glama builds a server by running its Dockerfile. FXpeek's real server is hosted at
# https://fxpeek.com/api/mcp, so this image is just the stdio bridge that talks to it.
FROM node:22-alpine

WORKDIR /app
COPY index.js package.json ./

ENV FXPEEK_MCP_URL=https://fxpeek.com/api/mcp

# stdio transport: the client speaks JSON-RPC over stdin/stdout.
ENTRYPOINT ["node", "index.js"]

# fxpeek MCP server

Model Context Protocol server for **FXpeek** historical reference exchange rates.

[![Jenpo/fxpeek-mcp MCP server](https://glama.ai/mcp/servers/Jenpo/fxpeek-mcp/badges/score.svg)](https://glama.ai/mcp/servers/Jenpo/fxpeek-mcp)
[![fxpeek MCP connector](https://glama.ai/mcp/connectors/io.github.Jenpo/fxpeek/badges/score.svg)](https://glama.ai/mcp/connectors/io.github.Jenpo/fxpeek)

- Hosted endpoint: `https://fxpeek.com/api/mcp` (Streamable HTTP) — connect to it directly if your client supports remote servers.
- This repo ships `index.js`, a dependency-free stdio bridge to that endpoint, so local clients and directory evaluations have something to build and run.
- Tools: `get_latest_rate(from,to)`, `get_history(from,to,days|date)`.
- Reference data only; not a transaction quote. Each row keeps its ECB/Frankfurter provenance. Spec: https://fxpeek.com/openapi.json

## Use (Claude / Cursor / any MCP client)

Remote, no install:

```json
{ "mcpServers": { "fxpeek": { "url": "https://fxpeek.com/api/mcp" } } }
```

Local stdio bridge (no dependencies, Node 18+):

```bash
node index.js
```

```json
{ "mcpServers": { "fxpeek": { "command": "node", "args": ["/path/to/fxpeek-mcp/index.js"] } } }
```

Override the upstream endpoint with `FXPEEK_MCP_URL` if you proxy it yourself.

## What `get_history` returns for a single date

An invoice dated Saturday 2024-06-01 is not a rate date. The tool returns both fields separately, so a caller can record the invoice date and the rate's effective date without conflating them:

```json
{
  "pair": "EUR/USD",
  "requestedDate": "2024-06-01",
  "date": "2024-05-31",
  "rate": 1.0852,
  "source": "ECB / Frankfurter",
  "note": "reference-only; the invoice date and the rate effective date are different fields and must both be recorded"
}
```

## Licence

MIT — see [LICENSE](LICENSE).

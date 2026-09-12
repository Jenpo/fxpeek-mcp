# fxpeek MCP server

Model Context Protocol server for **FXpeek** historical reference exchange rates.

- Endpoint: `https://fxpeek.com/api/mcp` (Streamable HTTP)
- Tools: `get_latest_rate(from,to)`, `get_history(from,to,days|date)`
- Reference data only; not a transaction quote. Spec: https://fxpeek.com/openapi.json

## Use (Claude / Cursor / any MCP client)

```json
{ "mcpServers": { "fxpeek": { "url": "https://fxpeek.com/api/mcp" } } }
```

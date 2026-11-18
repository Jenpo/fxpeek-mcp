#!/usr/bin/env node
/**
 * FXpeek MCP — stdio bridge to the hosted Streamable HTTP endpoint.
 *
 * Why this exists: Glama (and the MCP registry ecosystem generally) evaluates a server by
 * building a runnable entrypoint. FXpeek's real server is hosted at https://fxpeek.com/api/mcp
 * and has nothing to build, so a repo with only README/LICENSE/server.json cannot be scored.
 * This file is the smallest possible buildable entrypoint: it speaks MCP over stdio on the
 * client side and forwards every JSON-RPC message to the hosted endpoint over HTTP.
 *
 * No dependencies. Node 18+ (global fetch).
 *
 * Usage:
 *   node index.js                       # stdio bridge (default)
 *   FXPEK_MCP_URL=... node index.js     # override the upstream endpoint
 *
 * Tools are the upstream server's own: get_latest_rate, get_history.
 * get_history accepts days= (window) or date=YYYY-MM-DD (single dated lookup, returns
 * requestedDate plus the actual data date — weekends resolve to the nearest working day).
 */

const UPSTREAM = process.env.FXPEEK_MCP_URL || 'https://fxpeek.com/api/mcp'
const PROTOCOL_VERSION = '2025-06-18'
const REQUEST_TIMEOUT_MS = 20_000

// The hosted endpoint gates some routes by user-agent; node's default undici UA is accepted,
// but we send an explicit one so FXpeek can tell bridge traffic apart in its own logs.
const BRIDGE_UA = 'fxpeek-mcp-stdio-bridge/1.0 (+https://github.com/Jenpo/fxpeek-mcp)'

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

async function forward(body) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'user-agent': BRIDGE_UA,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    // notifications/initialized has no id and the upstream answers 202 with an empty body.
    if (response.status === 202 || response.status === 204) return null
    const text = await response.text()
    if (!text) return null
    // Accept both plain JSON and SSE-framed JSON, since the transport may answer either way.
    const payload = text.includes('data:')
      ? text.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('')
      : text
    try {
      return JSON.parse(payload)
    } catch {
      return {
        jsonrpc: '2.0',
        id: body.id ?? null,
        error: { code: -32603, message: `upstream returned non-JSON (HTTP ${response.status})` },
      }
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: body.id ?? null,
      error: { code: -32603, message: `upstream unreachable: ${error instanceof Error ? error.message : String(error)}` },
    }
  } finally {
    clearTimeout(timer)
  }
}

let buffer = ''

async function handleLine(line) {
  const trimmed = line.trim()
  if (!trimmed) return
  let message
  try {
    message = JSON.parse(trimmed)
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error' } })
    return
  }
  // A client may pin an older protocol revision; the hosted server only speaks 2025-06-18.
  if (message.method === 'initialize' && message.params) {
    message.params.protocolVersion = PROTOCOL_VERSION
  }
  const reply = await forward(message)
  if (reply) send(reply)
}

process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  buffer += chunk
  let index
  while ((index = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, index)
    buffer = buffer.slice(index + 1)
    handleLine(line)
  }
})
process.stdin.on('end', () => {
  if (buffer.trim()) handleLine(buffer)
})

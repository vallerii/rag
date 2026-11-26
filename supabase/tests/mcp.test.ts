// MCP-Server für Grok: Protokoll (JSON-RPC über HTTP), Zugangsschlüssel, Werkzeuge. Start: npm run test:fn
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handleHttp, keyOk, type Tool } from '../functions/_shared/mcp.ts'

const KEY = 'k'.repeat(16) + 'SecretKey1234567890'
const calls: string[] = []
const tools: Tool[] = [
  { name: 'ping', description: 'Test', inputSchema: { type: 'object', properties: {} }, run: async () => ({ pong: true }) },
  { name: 'boom', description: 'Fehler', inputSchema: { type: 'object', properties: {} }, run: async () => { throw new Error('nicht reserviert') } },
]
const log = async (tool: string, ok: boolean) => { calls.push(`${tool}:${ok}`) }
const post = (body: unknown, auth: 'query' | 'bearer' | 'none' | 'wrong' = 'query') => new Request(
  `https://x.supabase.co/functions/v1/grok-mcp${auth === 'query' ? `?key=${KEY}` : auth === 'wrong' ? '?key=falsch' : ''}`,
  { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(auth === 'bearer' ? { Authorization: `Bearer ${KEY}` } : {}) }, body: typeof body === 'string' ? body : JSON.stringify(body) })
const rpc = async (body: unknown, auth?: 'query' | 'bearer' | 'none' | 'wrong') => { const r = await handleHttp(post(body, auth), KEY, tools, log); return { status: r.status, body: r.status === 202 ? null : await r.json() } }

test('Schlüssel: in der URL oder als Bearer; falsch, fehlend oder zu kurz → 401', async () => {
  assert.equal((await rpc({ jsonrpc: '2.0', id: 1, method: 'ping' }, 'query')).status, 200)
  assert.equal((await rpc({ jsonrpc: '2.0', id: 1, method: 'ping' }, 'bearer')).status, 200)
  assert.equal((await rpc({ jsonrpc: '2.0', id: 1, method: 'ping' }, 'none')).status, 401)
  assert.equal((await rpc({ jsonrpc: '2.0', id: 1, method: 'ping' }, 'wrong')).status, 401)
  assert.equal(keyOk(new Request('https://x/?key=kurz'), 'kurz'), false) // zu kurzes Secret gilt nie
})

test('initialize: Protokollversion des Clients, sonst die neueste; Werkzeuge angekündigt', async () => {
  const a = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'grok' } } })
  assert.equal(a.body.result.protocolVersion, '2025-06-18')
  assert.deepEqual(a.body.result.capabilities, { tools: { listChanged: false } })
  assert.equal(a.body.result.serverInfo.name, 'rag-grok')
  const b = await rpc({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '1999-01-01' } })
  assert.equal(b.body.result.protocolVersion, '2025-11-25')
})

test('Benachrichtigung → 202 ohne Inhalt; unbekannte Methode → Fehler -32601; kaputtes JSON → -32700', async () => {
  assert.deepEqual(await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' }), { status: 202, body: null })
  assert.equal((await rpc({ jsonrpc: '2.0', id: 3, method: 'resources/list' })).body.error.code, -32601)
  const bad = await rpc('{kaputt')
  assert.equal(bad.status, 400); assert.equal(bad.body.error.code, -32700)
  assert.equal((await rpc({ id: 4, method: 'ping' })).body.error.code, -32600)
})

test('tools/list und tools/call: Ergebnis als Text, Fehler des Werkzeugs als isError (das Modell kann reagieren), Protokoll', async () => {
  const list = await rpc({ jsonrpc: '2.0', id: 5, method: 'tools/list' })
  assert.deepEqual(list.body.result.tools.map((t: { name: string }) => t.name), ['ping', 'boom'])
  assert.ok(!('run' in list.body.result.tools[0]))
  const okCall = await rpc({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'ping', arguments: {} } })
  assert.equal(okCall.body.result.isError, false)
  assert.deepEqual(JSON.parse(okCall.body.result.content[0].text), { pong: true })
  assert.deepEqual(okCall.body.result.structuredContent, { pong: true })
  const err = await rpc({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'boom', arguments: {} } })
  assert.equal(err.body.result.isError, true); assert.equal(err.body.result.content[0].text, 'nicht reserviert')
  assert.equal((await rpc({ jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'gibtsnicht' } })).body.error.code, -32602)
  assert.deepEqual(calls.slice(-2), ['ping:true', 'boom:false'])
})

test('Stapel (batch) und GET', async () => {
  const r = await rpc([{ jsonrpc: '2.0', id: 1, method: 'ping' }, { jsonrpc: '2.0', method: 'notifications/initialized' }, { jsonrpc: '2.0', id: 2, method: 'tools/list' }])
  assert.equal(r.body.length, 2)
  const get = await handleHttp(new Request(`https://x/grok-mcp?key=${KEY}`), KEY, tools)
  assert.equal(get.status, 405)
})

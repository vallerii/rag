// Минимальный MCP-сервер (Model Context Protocol, транспорт Streamable HTTP, без сессий): JSON-RPC 2.0 по POST,
// ответ — application/json. Хватает для коннектора Grok: initialize, tools/list, tools/call, ping.
// Без внешних библиотек и без Deno API — проверяется тестами под Node (supabase/tests/mcp.test.ts).

export type Tool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  run: (args: Record<string, unknown>) => Promise<unknown>
}
type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> }

export const SERVER_INFO = { name: 'rag-grok', version: '1.0.0' }
const VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']

const ok = (id: Rpc['id'], result: unknown) => ({ jsonrpc: '2.0', id: id ?? null, result })
const fail = (id: Rpc['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } })

/** Eine JSON-RPC-Nachricht. Benachrichtigungen (ohne id) → null (HTTP 202 ohne Inhalt). */
export async function handleRpc(msg: Rpc, tools: Tool[], log?: (tool: string, ok: boolean, detail: string) => Promise<void>): Promise<unknown | null> {
  if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return fail(msg?.id, -32600, 'Invalid Request')
  const isNote = msg.id === undefined || msg.id === null
  switch (msg.method) {
    case 'initialize': {
      const want = String(msg.params?.protocolVersion ?? '')
      return ok(msg.id, {
        protocolVersion: VERSIONS.includes(want) ? want : VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: 'OrtsFuchs: Analysen von Firmen, die auf eine vollständige Analyse warten. Erst list_pending_analyses, dann je Firma save_analysis.',
      })
    }
    case 'ping': return ok(msg.id, {})
    case 'tools/list':
      return ok(msg.id, { tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) })
    case 'tools/call': {
      const name = String(msg.params?.name ?? '')
      const tool = tools.find(t => t.name === name)
      if (!tool) return fail(msg.id, -32602, `Unknown tool: ${name}`)
      const args = (msg.params?.arguments ?? {}) as Record<string, unknown>
      try {
        const out = await tool.run(args)
        await log?.(name, true, JSON.stringify(args).slice(0, 500))
        return ok(msg.id, { content: [{ type: 'text', text: typeof out === 'string' ? out : JSON.stringify(out, null, 1) }], structuredContent: typeof out === 'object' && out !== null && !Array.isArray(out) ? out : undefined, isError: false })
      } catch (e) {
        const text = e instanceof Error ? e.message : String(e)
        await log?.(name, false, text.slice(0, 500))
        // Fehler des Werkzeugs gehen als Ergebnis an das Modell, damit es sie korrigieren kann.
        return ok(msg.id, { content: [{ type: 'text', text }], isError: true })
      }
    }
    default:
      if (isNote || msg.method.startsWith('notifications/')) return null
      return fail(msg.id, -32601, `Method not found: ${msg.method}`)
  }
}

/** Zugangsschlüssel: ?key=… in der URL oder «Authorization: Bearer …». Vergleich in konstanter Zeit. */
export function keyOk(req: Request, secret: string): boolean {
  if (!secret || secret.length < 24) return false
  const url = new URL(req.url)
  const given = url.searchParams.get('key') ?? (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (given.length !== secret.length) return false
  let diff = 0
  for (let i = 0; i < secret.length; i++) diff |= given.charCodeAt(i) ^ secret.charCodeAt(i)
  return diff === 0
}

/** HTTP-Rahmen: POST mit einer Nachricht oder einem Stapel; GET/DELETE → 405 (keine SSE-Sitzungen). */
export async function handleHttp(req: Request, secret: string, tools: Tool[], log?: (tool: string, ok: boolean, detail: string) => Promise<void>): Promise<Response> {
  if (!keyOk(req, secret)) return Response.json(fail(null, -32001, 'Unauthorized'), { status: 401 })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } })
  let body: unknown
  try { body = await req.json() } catch { return Response.json(fail(null, -32700, 'Parse error'), { status: 400 }) }
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map(m => handleRpc(m as Rpc, tools, log)))).filter(x => x !== null)
    return out.length ? Response.json(out) : new Response(null, { status: 202 })
  }
  const out = await handleRpc(body as Rpc, tools, log)
  return out === null ? new Response(null, { status: 202 }) : Response.json(out)
}

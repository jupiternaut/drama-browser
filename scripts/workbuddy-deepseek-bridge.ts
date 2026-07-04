#!/usr/bin/env bun
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'

type ChatRole = 'system' | 'user' | 'assistant' | 'tool' | string

interface ChatMessage {
  role: ChatRole
  content?: unknown
  name?: string
}

interface ChatCompletionRequest {
  model?: string
  messages?: ChatMessage[]
  stream?: boolean
}

const DEFAULT_CODEBUDDY_BIN =
  '/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy'
const DEFAULT_MODEL = 'deepseek-v4-pro'
const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 8123

function envString(name: string, fallback: string): string {
  const value = process.env[name]?.trim()
  return value && value.length > 0 ? value : fallback
}

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function codebuddyBin(): string {
  return envString('WORKBUDDY_CODEBUDDY_BIN', DEFAULT_CODEBUDDY_BIN)
}

function defaultModel(): string {
  return envString('WORKBUDDY_DEEPSEEK_MODEL', DEFAULT_MODEL)
}

function bridgeToken(): string | null {
  return process.env.WORKBUDDY_DEEPSEEK_BRIDGE_TOKEN?.trim() || null
}

function normalizeModel(model: string | undefined): string {
  const requested = model?.trim() || defaultModel()
  if (requested === 'workbuddy/deepseek-v4-pro' || requested === 'workbuddy-deepseek-v4-pro') {
    return 'deepseek-v4-pro'
  }
  if (requested === 'workbuddy/deepseek-v4-flash' || requested === 'workbuddy-deepseek-v4-flash') {
    return 'deepseek-v4-flash'
  }
  return requested
}

function contentToText(content: unknown): string {
  if (typeof content === 'string') return content
  if (content == null) return ''
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === 'string') return part
      if (!part || typeof part !== 'object') return String(part ?? '')
      const record = part as Record<string, unknown>
      if (typeof record.text === 'string') return record.text
      if (record.type === 'image_url') return '[image omitted by workbuddy-deepseek-bridge]'
      return JSON.stringify(record)
    }).filter(Boolean).join('\n')
  }
  if (typeof content === 'object') return JSON.stringify(content)
  return String(content)
}

function buildPrompt(messages: ChatMessage[]): string {
  const systemMessages = messages
    .filter((message) => message.role === 'system')
    .map((message) => contentToText(message.content).trim())
    .filter(Boolean)

  const transcript = messages
    .filter((message) => message.role !== 'system')
    .map((message) => {
      const role = String(message.role || 'user').toUpperCase()
      const name = message.name ? ` (${message.name})` : ''
      return `${role}${name}:\n${contentToText(message.content).trim()}`
    })
    .filter((entry) => !entry.endsWith(':\n'))

  return [
    systemMessages.length > 0
      ? `System instructions:\n${systemMessages.join('\n\n')}`
      : null,
    transcript.length > 0
      ? `Conversation:\n${transcript.join('\n\n')}`
      : null,
    'Return only the assistant response for the final user request.',
  ].filter(Boolean).join('\n\n')
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': 'http://127.0.0.1:3198',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'authorization,content-type,x-api-key',
      ...init.headers,
    },
  })
}

function errorResponse(status: number, code: string, message: string, details?: unknown): Response {
  return json({ error: { code, message, details } }, { status })
}

function checkAuth(request: Request): Response | null {
  const token = bridgeToken()
  if (!token) return null

  const authorization = request.headers.get('authorization') ?? ''
  const apiKey = request.headers.get('x-api-key') ?? ''
  if (authorization === `Bearer ${token}` || apiKey === token) return null

  return errorResponse(401, 'unauthorized', 'Invalid WorkBuddy DeepSeek bridge token.')
}

async function runCodeBuddy(prompt: string, model: string): Promise<string> {
  const bin = codebuddyBin()
  if (!existsSync(bin)) {
    throw new Error(`WorkBuddy codebuddy CLI not found at ${bin}`)
  }

  const timeoutMs = envNumber('WORKBUDDY_DEEPSEEK_TIMEOUT_MS', 300_000)
  const cwd = envString('WORKBUDDY_DEEPSEEK_CWD', process.cwd())
  const args = [
    '-p',
    '--model',
    model,
    '--tools',
    '',
    '--max-turns',
    envString('WORKBUDDY_DEEPSEEK_MAX_TURNS', '1'),
  ]

  const effort = process.env.WORKBUDDY_DEEPSEEK_EFFORT?.trim()
  if (effort) args.push('--effort', effort)

  return await new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let settled = false
    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill('SIGTERM')
      reject(new Error(`WorkBuddy codebuddy timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      reject(error)
    })
    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (code === 0) {
        resolve(stdout.trim())
        return
      }
      reject(new Error(`WorkBuddy codebuddy exited with ${code}: ${stderr.trim() || stdout.trim()}`))
    })
    child.stdin.end(prompt)
  })
}

function completionPayload(content: string, model: string) {
  return {
    id: `chatcmpl-${randomUUID()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      },
    ],
    usage: null,
  }
}

function streamCompletion(contentPromise: Promise<string>, model: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const id = `chatcmpl-${randomUUID()}`
      const created = Math.floor(Date.now() / 1000)
      try {
        const content = await contentPromise
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [{ index: 0, delta: { role: 'assistant', content }, finish_reason: null }],
        })}\n\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
        })}\n\n`))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          error: {
            message: error instanceof Error ? error.message : String(error),
            type: 'workbuddy_bridge_error',
          },
        })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      'connection': 'keep-alive',
      'access-control-allow-origin': 'http://127.0.0.1:3198',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'authorization,content-type,x-api-key',
    },
  })
}

async function handleChatCompletion(request: Request): Promise<Response> {
  const authError = checkAuth(request)
  if (authError) return authError

  let body: ChatCompletionRequest
  try {
    body = await request.json()
  } catch {
    return errorResponse(400, 'bad_request', 'Request body must be JSON.')
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return errorResponse(400, 'bad_request', 'messages must be a non-empty array.')
  }

  const model = normalizeModel(body.model)
  const prompt = buildPrompt(body.messages)
  const contentPromise = runCodeBuddy(prompt, model)

  if (body.stream) return streamCompletion(contentPromise, model)

  try {
    const content = await contentPromise
    return json(completionPayload(content, model))
  } catch (error) {
    return errorResponse(
      502,
      'workbuddy_bridge_error',
      error instanceof Error ? error.message : String(error),
    )
  }
}

function modelsPayload() {
  const now = Math.floor(Date.now() / 1000)
  const models = Array.from(new Set([
    defaultModel(),
    'deepseek-v4-pro',
    'deepseek-v4-flash',
  ])).map((model) => ({
    id: model,
    object: 'model',
    created: now,
    owned_by: 'workbuddy',
  }))

  return { object: 'list', data: models }
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return ''
  return await new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => { data += chunk })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

async function runOnce(argv: string[]): Promise<void> {
  const inlinePrompt = argv.join(' ').trim()
  const stdinPrompt = await readStdin()
  const prompt = inlinePrompt || stdinPrompt.trim()
  if (!prompt) throw new Error('Provide a prompt after --once or pipe prompt text through stdin.')
  const content = await runCodeBuddy(prompt, defaultModel())
  console.log(content)
}

function printHelp(): void {
  console.log(`Usage:
  bun run scripts/workbuddy-deepseek-bridge.ts
  bun run scripts/workbuddy-deepseek-bridge.ts --once "只输出 OK"

Environment:
  WORKBUDDY_CODEBUDDY_BIN              Path to WorkBuddy codebuddy CLI.
  WORKBUDDY_DEEPSEEK_MODEL            Model id. Default: deepseek-v4-pro.
  WORKBUDDY_DEEPSEEK_BRIDGE_HOST      Host. Default: 127.0.0.1.
  WORKBUDDY_DEEPSEEK_BRIDGE_PORT      Port. Default: 8123.
  WORKBUDDY_DEEPSEEK_BRIDGE_TOKEN     Optional bearer/x-api-key token.
  WORKBUDDY_DEEPSEEK_TIMEOUT_MS       Request timeout. Default: 300000.

OpenAI-compatible endpoints:
  GET  /health
  GET  /v1/models
  POST /v1/chat/completions
`)
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  if (argv.includes('-h') || argv.includes('--help')) {
    printHelp()
    return
  }
  if (argv[0] === '--once') {
    await runOnce(argv.slice(1))
    return
  }

  const host = envString('WORKBUDDY_DEEPSEEK_BRIDGE_HOST', DEFAULT_HOST)
  const port = envNumber('WORKBUDDY_DEEPSEEK_BRIDGE_PORT', DEFAULT_PORT)
  const bin = codebuddyBin()
  if (!existsSync(bin)) throw new Error(`WorkBuddy codebuddy CLI not found at ${bin}`)

  Bun.serve({
    hostname: host,
    port,
    async fetch(request) {
      const url = new URL(request.url)
      if (request.method === 'OPTIONS') return json({ ok: true })
      if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
        return json({
          ok: true,
          service: 'workbuddy-deepseek-bridge',
          model: defaultModel(),
          codebuddyBin: bin,
          auth: bridgeToken() ? 'token' : 'none',
        })
      }
      if (request.method === 'GET' && url.pathname === '/v1/models') return json(modelsPayload())
      if (request.method === 'POST' && url.pathname === '/v1/chat/completions') {
        return await handleChatCompletion(request)
      }
      return errorResponse(404, 'not_found', `Unknown route: ${url.pathname}`)
    },
  })

  console.log(`[workbuddy-deepseek-bridge] ready at http://${host}:${port}`)
  console.log(`[workbuddy-deepseek-bridge] model=${defaultModel()} codebuddy=${bin}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})

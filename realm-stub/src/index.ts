import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const loadEnvFile = (path: string): void => {
    let content = ''
    try {
        content = readFileSync(path, 'utf8')
    } catch {
        return
    }
    for (const line of content.split('\n')) {
        const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
        if (!match) continue
        const [, key, raw] = match
        if (process.env[key] !== undefined) continue
        process.env[key] = raw.replace(/^(['"])(.*)\1$/, '$2')
    }
}

loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env'))

const PORT = Number(process.env.REALM_STUB_PORT ?? 5100)
const API_URL = process.env.API_URL ?? 'http://127.0.0.1:6000'
const TOKEN = process.env.REALM_DEV_TOKEN ?? 'rlm_dev_local'
console.log({ TOKEN })
const ROOT = join(tmpdir(), 'webgame-realm-stub')

const log = (message: string, detail: unknown = '') =>
    console.log(`[realm-stub] ${message}`, detail === '' ? '' : detail)

const readBody = (request: IncomingMessage): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        request.on('data', (chunk: Buffer) => chunks.push(chunk))
        request.on('end', () => resolve(Buffer.concat(chunks)))
        request.on('error', reject)
    })

const decodeClaims = (token: string): Record<string, unknown> => {
    const [, payload] = token.split('.')
    if (!payload) return {}
    try {
        return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>
    } catch {
        return {}
    }
}

const CORS_HEADERS = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, PUT, POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '86400',
}

const send = (response: ServerResponse, status: number, body?: unknown) => {
    if (body === undefined) {
        response.writeHead(status, CORS_HEADERS)
        response.end()
        return
    }
    const payload = JSON.stringify(body)
    response.writeHead(status, { ...CORS_HEADERS, 'content-type': 'application/json' })
    response.end(payload)
}

const callApi = async (path: string, body: unknown): Promise<Response> =>
    fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify(body),
    })

const handleUpload = async (
    request: IncomingMessage,
    response: ServerResponse,
    assetId: string
): Promise<void> => {
    const token = (request.headers.authorization ?? '').replace('Bearer ', '').trim()
    if (!token) return send(response, 401, { error: 'missing upload token' })

    const claims = decodeClaims(token)
    const maxBytes = Number(claims.maxBytes ?? 0)
    const bytes = await readBody(request)

    if (maxBytes > 0 && bytes.length > maxBytes) {
        log('refused oversize upload', { assetId, declared: maxBytes, actual: bytes.length })
        await callApi(`/api/internal/uploads/${assetId}/finalize`, {
            sizeBytes: 0,
            checksum: '',
            storagePath: '',
            status: 'failed',
            error: 'body exceeded maxBytes',
        })
        return send(response, 413, { error: 'body exceeded maxBytes' })
    }

    const storagePath = join(String(claims.projectId ?? 'unknown'), assetId)
    const target = join(ROOT, storagePath)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, bytes)

    const checksum = createHash('sha256').update(bytes).digest('hex')
    const finalize = await callApi(`/api/internal/uploads/${assetId}/finalize`, {
        sizeBytes: bytes.length,
        checksum,
        storagePath,
        status: 'ready',
    })

    log('stored upload', { assetId, bytes: bytes.length, finalize: finalize.status })
    send(response, 200, { assetId, checksum, storagePath })
}

const handleServe = async (
    url: URL,
    response: ServerResponse,
    assetId: string
): Promise<void> => {
    const token = url.searchParams.get('token') ?? ''
    if (!token) return send(response, 401, { error: 'missing download token' })

    const claims = decodeClaims(token)
    const expires = Number(claims.exp ?? 0)
    if (claims.sub !== assetId || (expires > 0 && expires * 1000 < Date.now())) {
        return send(response, 401, { error: 'invalid download token' })
    }

    const storagePath = String(claims.storagePath ?? '')
    if (!storagePath) return send(response, 404, { error: 'not found' })

    let bytes: Buffer
    try {
        bytes = await readFile(join(ROOT, storagePath))
    } catch {
        return send(response, 404, { error: 'not found' })
    }

    response.writeHead(200, {
        ...CORS_HEADERS,
        'content-type': String(claims.mime ?? 'application/octet-stream'),
        'content-length': bytes.length,
        'cache-control': 'private, max-age=300',
    })
    response.end(bytes)
    log('served file', { assetId, bytes: bytes.length })
}

const handlePurge = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    const body = JSON.parse((await readBody(request)).toString('utf8') || '{}') as { paths?: string[] }
    for (const path of body.paths ?? []) {
        await rm(join(ROOT, path), { force: true }).catch(() => undefined)
    }
    log('purged paths', body.paths?.length ?? 0)
    send(response, 200, { purged: body.paths?.length ?? 0 })
}

const handleTransfer = async (
    request: IncomingMessage,
    response: ServerResponse,
    step: string
): Promise<void> => {
    const body = JSON.parse((await readBody(request)).toString('utf8') || '{}') as Record<string, unknown>
    log(`transfer ${step}`, Object.keys(body))
    if (step === 'export') return send(response, 200, { files: [] })
    if (step === 'verify') return send(response, 200, { complete: true })
    send(response, 200, { ok: true })
}

const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', `http://127.0.0.1:${PORT}`)
    const upload = /^\/uploads\/([^/]+)$/.exec(url.pathname)
    const file = /^\/files\/([^/]+)$/.exec(url.pathname)
    const transfer = /^\/transfer\/(export|import|verify|purge)$/.exec(url.pathname)

    const run = async () => {
        if (request.method === 'OPTIONS') return send(response, 204)
        if (request.method === 'PUT' && upload) return handleUpload(request, response, upload[1])
        if (request.method === 'GET' && file) return handleServe(url, response, file[1])
        if (request.method === 'POST' && url.pathname === '/purge') return handlePurge(request, response)
        if (request.method === 'POST' && transfer) return handleTransfer(request, response, transfer[1])
        if (request.method === 'GET' && url.pathname === '/health') return send(response, 200, { ok: true })
        send(response, 404, { error: 'not found' })
    }

    void run().catch((error) => {
        log('handler failed', String(error))
        if (!response.headersSent) send(response, 500, { error: String(error) })
    })
})

const heartbeat = async (): Promise<void> => {
    await callApi('/api/realm/heartbeat', {
        health: 'healthy',
        diskFreeBytes: 10 * 1024 * 1024 * 1024,
        queueDepth: Math.floor(Math.random() * 3),
        cpuUsage: 5 + Math.floor(Math.random() * 30),
        memoryUsedBytes: Math.floor((1.5 + Math.random()) * 1024 * 1024 * 1024),
        memoryTotalBytes: 8 * 1024 * 1024 * 1024,
    }).catch(() => undefined)
}

const pollBuilds = async (): Promise<void> => {
    for (;;) {
        try {
            const claim = await callApi('/api/realm/jobs/next', { waitMs: 25_000 })
            if (claim.status !== 200) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                continue
            }

            const envelope = await claim.json() as { data?: { jobId: string; payload: { uploadIds: string[] } } }
            const job = envelope.data
            if (!job) continue

            log('claimed build', job.jobId)
            await callApi(`/api/realm/jobs/${job.jobId}/status`, { status: 'in_progress', progress: 50 })

            await callApi(`/api/realm/jobs/${job.jobId}/result`, {
                state: 'fulfilled',
                artifactUrl: `http://127.0.0.1:${PORT}/artifacts/${job.jobId}.zip`,
                manifestUrl: `http://127.0.0.1:${PORT}/artifacts/${job.jobId}.json`,
                checksum: createHash('sha256').update(job.jobId).digest('hex'),
                sizeBytes: job.payload.uploadIds.length * 1024,
                durationMs: 250,
                files: [
                    {
                        group: 'textures',
                        name: 'atlas-0.png',
                        url: `http://127.0.0.1:${PORT}/artifacts/${job.jobId}/atlas-0.png`,
                        sizeBytes: 1024,
                        checksum: 'stub',
                    },
                ],
            })
            log('reported build', job.jobId)
        } catch (error) {
            log('poll failed', String(error))
            await new Promise((resolve) => setTimeout(resolve, 2000))
        }
    }
}

server.listen(PORT, () => {
    log(`listening on http://127.0.0.1:${PORT}, talking to ${API_URL}`)
    void heartbeat()
    setInterval(() => void heartbeat(), 30_000).unref()
    void pollBuilds()
})

// Scraper Server — Node.js HTTP server local (sem dependências extras)
// Porta: 3001 | Inicia: npm start (em scraper-server/) ou npx tsx index.ts
import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { searchByCpf } from './scrapers/index.js'
import { stats } from './lib/cache.js'

const PORT = 3001
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
]

function setCors(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin ?? 'http://localhost:5173'
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.setHeader('Access-Control-Allow-Origin', allowed)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function sendJson(res: ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  setCors(req, res)

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // POST /cpf — busca processos por CPF em todos os scrapers
  if (req.method === 'POST' && url.pathname === '/cpf') {
    try {
      const bodyStr = await readBody(req)
      const body = JSON.parse(bodyStr)
      const cpf = body?.cpf as string | undefined

      if (!cpf || cpf.replace(/\D/g, '').length < 11) {
        return sendJson(res, { erro: 'CPF inválido — informe 11 dígitos' }, 400)
      }

      const cpfMasked = cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4')
      console.log(`[scraper] Buscando CPF: ${cpfMasked}`)

      const resultado = await searchByCpf(cpf)
      console.log(`[scraper] Total processos encontrados: ${resultado.total}`)

      return sendJson(res, resultado)
    } catch (err: any) {
      console.error('[scraper] Erro:', err.message)
      return sendJson(res, { erro: err?.message ?? 'Erro interno' }, 500)
    }
  }

  // GET /status — health check + cache stats
  if (req.method === 'GET' && url.pathname === '/status') {
    return sendJson(res, {
      online: true,
      porta: PORT,
      versao: '1.0.0',
      cache: stats(),
      node: process.version,
      timestamp: new Date().toISOString(),
    })
  }

  // GET /cache/clear — limpar cache (dev)
  if (req.method === 'GET' && url.pathname === '/cache/clear') {
    const { size } = stats()
    return sendJson(res, { mensagem: `Cache limpo — ${size} entradas` })
  }

  res.writeHead(404)
  res.end('Not Found')
})

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  🔍 Scraper Server — SDR Jurídico           ║
║  Porta: ${PORT}  (Node.js ${process.version})            ║
║  Endpoints:                                  ║
║    POST /cpf       → buscar por CPF          ║
║    GET  /status    → health check            ║
║    GET  /cache/clear → limpar cache          ║
╚══════════════════════════════════════════════╝
`)
})

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Porta ${PORT} já está em uso. Encerre o processo anterior.`)
    process.exit(1)
  }
  console.error('[scraper-server] Erro fatal:', err)
})

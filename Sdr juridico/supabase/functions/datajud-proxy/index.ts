import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'

const DEFAULT_ORIGIN = Deno.env.get('APP_URL') || 'http://localhost:5173'
const BASE_CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const getCorsHeaders = (req: Request) => ({
  ...BASE_CORS_HEADERS,
  'Access-Control-Allow-Origin': req.headers.get('origin') || DEFAULT_ORIGIN,
})

const jsonError = (req: Request, status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  })


// Limites de rate limiting (por usuário/organização)
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 10

// Simples rate limiting em memória (em produção usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const limiter = rateLimitMap.get(key)

  if (!limiter || now > limiter.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (limiter.count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }

  limiter.count++
  return true
}

async function verifyUserAndOrg(supabaseAdmin: any, userId: string): Promise<{ orgId: string; isValid: boolean }> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .single()

    if (error || !user) {
      return { orgId: '', isValid: false }
    }

    return { orgId: user.org_id, isValid: true }
  } catch {
    return { orgId: '', isValid: false }
  }
}

async function logDataJudQuery(
  supabaseAdmin: any,
  userId: string,
  orgId: string,
  searchType: string,
  query: Record<string, any>,
  success: boolean
) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      org_id: orgId,
      action: 'datajud_search',
      resource_type: 'datajud',
      details: {
        search_type: searchType,
        query_params: {
          tribunal: query.tribunal,
          search_type: searchType,
        },
        success,
      },
      timestamp: new Date().toISOString(),
    })
  } catch {
    console.error('Erro ao fazer audit log:', Error)
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return jsonError(req, 401, 'Unauthorized')
    }

    // Verificar JWT token
    const token = authHeader.replace('Bearer ', '')
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const { data, error: jwtError } = await supabaseAdmin.auth.getUser(token)
    if (jwtError || !data.user) {
      return jsonError(req, 401, 'Invalid token')
    }

    const userId = data.user.id

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return jsonError(req, 429, 'Rate limit exceeded')
    }

    // Verificar se usuário pertence a uma organização válida
    const { orgId, isValid } = await verifyUserAndOrg(supabaseAdmin, userId)
    if (!isValid) {
      return jsonError(req, 403, 'Forbidden')
    }

    // Parse request
    const body = await req.json()
    const { searchType, tribunal = 'trf1', query: searchQuery, size = 10 } = body

    if (!searchType || !searchQuery) {
      return jsonError(req, 400, 'Missing required fields: searchType and query')
    }

    // Validar tribunal
    const validTribunais = ['trf1', 'trf2', 'trf3', 'trf4', 'trf5', 'trf6', 'stf', 'stj']
    if (!validTribunais.includes(tribunal)) {
      return jsonError(req, 400, 'Invalid tribunal')
    }

    // Sanitizar entrada
    const sanitizedQuery = String(searchQuery).replace(/[<>"']/g, '').trim().substring(0, 1000)

    // Chamar API DataJud
    const datajudApiKey = Deno.env.get('DATAJUD_API_KEY')
    if (!datajudApiKey) {
      return jsonError(req, 500, 'DataJud API key not configured')
    }

    const datajudUrl = `https://api-publica.datajud.cnj.jus.br/${tribunal}/`

    let datajudPayload: Record<string, any> = {
      size: Math.min(size, 50), // Limite máximo 50 resultados
    }

    if (searchType === 'numero_processo') {
      datajudPayload.query = {
        match: {
          numeroProcesso: sanitizedQuery,
        },
      }
    } else if (searchType === 'parte') {
      datajudPayload.query = {
        nested: {
          path: 'dadosBasicos.polo',
          query: {
            match: {
              'dadosBasicos.polo.nome': sanitizedQuery,
            },
          },
        },
      }
    } else {
      return jsonError(req, 400, 'Invalid searchType')
    }

    const response = await fetch(datajudUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${datajudApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datajudPayload),
    })

    const responseData = await response.json()

    // Log de auditoria
    await logDataJudQuery(supabaseAdmin, userId, orgId, searchType, { tribunal, search_type: searchType }, response.ok)

    if (!response.ok) {
      console.error('DataJud API error:', responseData)
      return jsonError(req, response.status, 'DataJud API error')
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return jsonError(req, 500, 'Internal server error')
  }
})

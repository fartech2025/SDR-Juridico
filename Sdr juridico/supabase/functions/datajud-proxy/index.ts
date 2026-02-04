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
      .eq('ativo', true) // Apenas membros ativos podem acessar
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
  console.log('🚀 DataJud Proxy - Nova requisição recebida')
  console.log('📋 Method:', req.method)

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight - retornando 204')
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('authorization')
    console.log('🔑 Auth header presente:', !!authHeader)

    if (!authHeader) {
      console.error('❌ Sem header de autorização')
      return jsonError(req, 401, 'Unauthorized')
    }

    // Verificar JWT token
    const token = authHeader.replace('Bearer ', '')
    console.log('🔐 Token extraído (primeiros 20 chars):', token.substring(0, 20) + '...')

    // MÉTODO ALTERNATIVO: Criar cliente com o token do usuário
    // Isso valida o token automaticamente e nos dá acesso ao usuário
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    console.log('🔍 Verificando JWT token via getUser()...')
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()

    if (userError || !user) {
      console.error('❌ Token inválido:', userError?.message || 'No user')
      return jsonError(req, 401, 'Invalid token')
    }

    const userId = user.id
    console.log('✅ Usuário autenticado:', userId)

    // Cliente admin para operações privilegiadas (queries, audit log)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Rate limiting
    console.log('⏱️  Verificando rate limit...')
    if (!checkRateLimit(userId)) {
      console.error('❌ Rate limit excedido para usuário:', userId)
      return jsonError(req, 429, 'Rate limit exceeded')
    }
    console.log('✅ Rate limit OK')

    // Verificar se usuário pertence a uma organização válida
    console.log('🏢 Verificando organização do usuário...')
    const { orgId, isValid } = await verifyUserAndOrg(supabaseAdmin, userId)
    console.log('📊 Resultado verifyUserAndOrg:', { orgId, isValid })

    if (!isValid) {
      console.error('❌ Usuário sem organização válida')
      return jsonError(req, 403, 'Forbidden - User not in active organization')
    }

    console.log('✅ Usuário vinculado à org:', orgId)

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
      console.error('❌ DataJud API key não configurada')
      return jsonError(req, 500, 'DataJud API key not configured')
    }

    const datajudUrl = `https://api-publica.datajud.cnj.jus.br/${tribunal}/`
    console.log('🔗 URL DataJud:', datajudUrl)

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

    console.log('📦 Payload DataJud:', JSON.stringify(datajudPayload, null, 2))

    console.log('🚀 Chamando API DataJud...')
    const response = await fetch(datajudUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${datajudApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datajudPayload),
    })

    console.log('📊 Status DataJud:', response.status, response.statusText)

    let responseData
    try {
      responseData = await response.json()
      console.log('✅ Response parseado como JSON')
    } catch (parseError) {
      console.error('❌ Erro ao parsear response JSON:', parseError)
      const text = await response.text()
      console.error('📝 Response text:', text)
      return jsonError(req, 500, 'Invalid JSON response from DataJud')
    }

    // Log de auditoria
    await logDataJudQuery(supabaseAdmin, userId, orgId, searchType, { tribunal, search_type: searchType }, response.ok)

    if (!response.ok) {
      console.error('❌ DataJud API error:', JSON.stringify(responseData, null, 2))
      return jsonError(req, response.status, `DataJud API error: ${responseData.error || responseData.message || 'Unknown'}`)
    }

    console.log('✅ Sucesso! Retornando dados...')

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return jsonError(req, 500, 'Internal server error')
  }
})

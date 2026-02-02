// supabase/functions/datajud-enhanced/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface DataJudSearchParams {
  tribunal: string
  searchType: "numero" | "parte" | "classe" | "avancada"
  query: string
  clienteId?: string
  pagina?: number
}

interface DataJudResponse {
  hits: {
    total: { value: number }
    hits: Array<{
      _source: Record<string, unknown>
    }>
  }
}

class HttpError extends Error {
  status: number
  body?: string
  constructor(status: number, message: string, body?: string) {
    super(message)
    this.status = status
    this.body = body
  }
}

const DEFAULT_ORIGIN = Deno.env.get("APP_URL") || "*"
const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const getCorsHeaders = (req: Request) => ({
  ...BASE_CORS_HEADERS,
  "Access-Control-Allow-Origin": req.headers.get("origin") || DEFAULT_ORIGIN,
})

// Rate limiting in-memory store (basic, production should use Redis)
const rateLimitStore: Record<string, { count: number; resetAt: number }> = {}

function checkRateLimit(orgId: string, limit: number = 100, windowMs: number = 3600000): boolean {
  const now = Date.now()
  const key = `org:${orgId}`

  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { count: 0, resetAt: now + windowMs }
  }

  const record = rateLimitStore[key]

  if (now > record.resetAt) {
    record.count = 0
    record.resetAt = now + windowMs
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callDataJudAPI(
  tribunal: string,
  searchType: string,
  query: string,
  attempt: number = 1,
  maxAttempts: number = 3
): Promise<DataJudResponse> {
  const apiKey = Deno.env.get("DATAJUD_API_KEY")
  if (!apiKey) {
    throw new Error("DATAJUD_API_KEY not configured")
  }

  const endpoint = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`

  let query_clause = {}
  if (searchType === "numero") {
    query_clause = {
      match: { numeroProcesso: query },
    }
  } else if (searchType === "parte") {
    query_clause = {
      multi_match: {
        query,
        fields: ["polo.nome", "polo.advocado.nome", "polo.advocado.oab"],
      },
    }
  } else if (searchType === "classe") {
    query_clause = {
      match: { classe: query },
    }
  } else {
    query_clause = {
      query_string: { query },
    }
  }

  const payload = {
    query: query_clause,
    size: 20,
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Conforme documentação oficial: Authorization: APIKey <chave>
        "Authorization": `APIKey ${apiKey}`,
        "Accept": "application/json",
        "User-Agent": "supabase-datajud-enhanced/1.0",
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()

    if (response.status === 429 && attempt < maxAttempts) {
      // Rate limited by API, retry with exponential backoff
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
      await sleep(backoffMs)
      return callDataJudAPI(tribunal, searchType, query, attempt + 1, maxAttempts)
    }

    if (!response.ok) {
      throw new HttpError(
        response.status,
        `DataJud returned ${response.status} ${response.statusText}`,
        responseText
      )
    }

    const data: DataJudResponse = responseText ? JSON.parse(responseText) : { hits: { total: { value: 0 }, hits: [] } }
    return data
  } catch (error) {
    if (attempt < maxAttempts && error instanceof HttpError && error.status === 429) {
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
      await sleep(backoffMs)
      return callDataJudAPI(tribunal, searchType, query, attempt + 1, maxAttempts)
    }
    throw error
  }
}

async function logApiCall(
  supabase: any,
  userId: string,
  orgId: string,
  params: DataJudSearchParams,
  resultCount: number,
  latencyMs: number,
  statusCode: number,
  errorMessage?: string
) {
  const { error } = await supabase.from("datajud_api_calls").insert({
    user_id: userId,
    org_id: orgId,
    action: "search",
    tribunal: params.tribunal,
    search_query: params.query,
    resultado_count: resultCount,
    api_latency_ms: latencyMs,
    status_code: statusCode,
    error_message: errorMessage,
  })

  if (error) {
    console.error("Failed to log API call:", error)
  }
}

serve(async (req) => {
  try {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders(req) })
    }

    // Validate request
    if (req.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: getCorsHeaders(req),
      })
    }

    // Get authorization header
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseServiceRole) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole)

    // Verify JWT and get user info
    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      })
    }

    // Parse request body
    const body: DataJudSearchParams = await req.json()

    if (!body.tribunal || !body.searchType || !body.query) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: tribunal, searchType, query",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
        }
      )
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .single()

    if (userError || !userData) {
      return new Response(JSON.stringify({ error: "User not part of any organization" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      })
    }

    const orgId = userData.org_id

    // Check rate limit
    if (!checkRateLimit(orgId, 100, 3600000)) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded (100 requests per hour per organization)",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
        }
      )
    }

    // Call DataJud API with timing
    const startTime = Date.now()
    let statusCode = 200
    let resultCount = 0
    let errorMessage: string | undefined

    try {
      const result = await callDataJudAPI(body.tribunal, body.searchType, body.query)
      resultCount = result.hits.total.value
      const latencyMs = Date.now() - startTime

      // Log the API call
      await logApiCall(supabase, user.id, orgId, body, resultCount, latencyMs, 200)

      return new Response(
        JSON.stringify({
          success: true,
          data: result,
          cached: false,
          latency_ms: latencyMs,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
        }
      )
    } catch (apiError) {
      if (apiError instanceof HttpError) {
        statusCode = apiError.status
        errorMessage = `${apiError.message}${apiError.body ? ` | body: ${apiError.body}` : ""}`
      } else {
        statusCode = 500
        errorMessage =
          apiError instanceof Error ? apiError.message : "Unknown DataJud API error"
      }
      const latencyMs = Date.now() - startTime

      // Log the failed API call
      await logApiCall(supabase, user.id, orgId, body, 0, latencyMs, statusCode, errorMessage)

      return new Response(
        JSON.stringify({
          error: errorMessage,
          cached: false,
        }),
        {
          status: statusCode,
          headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
        }
      )
    }
  } catch (error) {
    console.error("Error in datajud-enhanced function:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    )
  }
})

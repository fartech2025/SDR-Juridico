// supabase/functions/dou-search/index.ts
// Edge Function leve - proxy para busca pública do DOU (evita CORS do browser)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DEFAULT_ORIGIN = Deno.env.get("APP_URL") || "*"
const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const getCorsHeaders = (req: Request) => ({
  ...BASE_CORS_HEADERS,
  "Access-Control-Allow-Origin": req.headers.get("origin") || DEFAULT_ORIGIN,
})

// Rate limiting in-memory
const rateLimitStore: Record<string, { count: number; resetAt: number }> = {}

function checkRateLimit(orgId: string, limit: number = 50, windowMs: number = 3600000): boolean {
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
  if (record.count >= limit) return false
  record.count++
  return true
}

serve(async (req) => {
  try {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders(req) })
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: getCorsHeaders(req),
      })
    }

    // Validate auth
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !supabaseServiceRole) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole)

    // Verify JWT
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      })
    }

    // Get org_id
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

    // Rate limit
    if (!checkRateLimit(orgId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (50 req/hour)" }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      })
    }

    // Parse request
    const body = await req.json()
    const { termo, dataInicio, dataFim } = body

    if (!termo) {
      return new Response(JSON.stringify({ error: "Missing required field: termo" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      })
    }

    const startTime = Date.now()

    // FASE 1: Buscar em publicações já indexadas
    let query = supabase
      .from("dou_publicacoes")
      .select("*")
      .eq("org_id", orgId)

    if (dataInicio) query = query.gte("data_publicacao", dataInicio)
    if (dataFim) query = query.lte("data_publicacao", dataFim)

    query = query.or(`titulo.ilike.%${termo}%,conteudo.ilike.%${termo}%`)
    query = query.order("data_publicacao", { ascending: false })
    query = query.limit(50)

    const { data: indexedResults } = await query

    if (indexedResults && indexedResults.length > 0) {
      const latencyMs = Date.now() - startTime
      return new Response(JSON.stringify({
        success: true,
        data: indexedResults,
        source: "indexed",
        latency_ms: latencyMs,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      })
    }

    // FASE 2: Proxy para API pública do DOU
    const searchUrl = new URL("https://www.in.gov.br/consulta/-/buscar/dou")
    searchUrl.searchParams.set("q", termo)
    searchUrl.searchParams.set("s", "do3")
    if (dataInicio) {
      // Converter YYYY-MM-DD para DD-MM-YYYY
      const parts = dataInicio.split("-")
      if (parts.length === 3 && parts[0].length === 4) {
        searchUrl.searchParams.set("publishFrom", `${parts[2]}-${parts[1]}-${parts[0]}`)
      }
    }
    if (dataFim) {
      const parts = dataFim.split("-")
      if (parts.length === 3 && parts[0].length === 4) {
        searchUrl.searchParams.set("publishTo", `${parts[2]}-${parts[1]}-${parts[0]}`)
      }
    }
    searchUrl.searchParams.set("sortType", "0")

    const douResponse = await fetch(searchUrl.toString(), {
      headers: {
        "User-Agent": "SDR-Juridico-DOU-Search/1.0",
        "Accept": "text/html",
      },
    })

    const html = await douResponse.text()

    // Extrair hits do HTML
    const requestMatch = html.match(/var\s+request\s*=\s*(\{[\s\S]*?\});/)
    let hits: unknown[] = []
    let totalPages = 0

    if (requestMatch) {
      try {
        const jsonStr = requestMatch[1]
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]")
        const data = JSON.parse(jsonStr)
        hits = data.hits || []
        totalPages = data.totalPages || 0
      } catch {
        // Parse falhou
      }
    }

    const latencyMs = Date.now() - startTime

    return new Response(JSON.stringify({
      success: true,
      data: hits,
      source: "dou_publico",
      total_pages: totalPages,
      latency_ms: latencyMs,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
    })

  } catch (error) {
    console.error("Error in dou-search function:", error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Internal server error",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
    })
  }
})

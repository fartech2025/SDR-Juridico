// Querido Diário Proxy - Acesso à API de Diários Oficiais
// API: https://api.queridodiario.ok.org.br/docs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const QUERIDO_DIARIO_API = "https://api.queridodiario.ok.org.br";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint") || "gazettes";
    
    // Parâmetros para busca de diários
    const querystring = url.searchParams.get("querystring") || "";
    const territory_ids = url.searchParams.get("territory_ids") || "";
    const published_since = url.searchParams.get("published_since") || "";
    const published_until = url.searchParams.get("published_until") || "";
    const size = url.searchParams.get("size") || "10";
    const offset = url.searchParams.get("offset") || "0";
    const sort_by = url.searchParams.get("sort_by") || "descending_date";
    const excerpt_size = url.searchParams.get("excerpt_size") || "500";
    const number_of_excerpts = url.searchParams.get("number_of_excerpts") || "3";
    
    // Parâmetros para busca de empresa
    const cnpj = url.searchParams.get("cnpj") || "";

    let apiUrl = "";
    
    switch (endpoint) {
      case "gazettes":
        // Buscar publicações em diários oficiais
        const gazetteParams = new URLSearchParams();
        if (querystring) gazetteParams.append("querystring", querystring);
        if (territory_ids) {
          territory_ids.split(",").forEach(id => gazetteParams.append("territory_ids", id.trim()));
        }
        if (published_since) gazetteParams.append("published_since", published_since);
        if (published_until) gazetteParams.append("published_until", published_until);
        gazetteParams.append("size", size);
        gazetteParams.append("offset", offset);
        gazetteParams.append("sort_by", sort_by);
        gazetteParams.append("excerpt_size", excerpt_size);
        gazetteParams.append("number_of_excerpts", number_of_excerpts);
        
        apiUrl = `${QUERIDO_DIARIO_API}/gazettes?${gazetteParams.toString()}`;
        break;
        
      case "company":
        // Buscar informações de empresa por CNPJ
        if (!cnpj) {
          return new Response(
            JSON.stringify({ error: "CNPJ é obrigatório para busca de empresa" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        apiUrl = `${QUERIDO_DIARIO_API}/company/info/${cnpj}`;
        break;
        
      case "partners":
        // Buscar sócios de empresa por CNPJ
        if (!cnpj) {
          return new Response(
            JSON.stringify({ error: "CNPJ é obrigatório para busca de sócios" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        apiUrl = `${QUERIDO_DIARIO_API}/company/partners/${cnpj}`;
        break;
        
      case "cities":
        // Listar cidades disponíveis
        const cityName = url.searchParams.get("city_name") || "";
        apiUrl = `${QUERIDO_DIARIO_API}/cities${cityName ? `?city_name=${encodeURIComponent(cityName)}` : ""}`;
        break;
        
      case "city":
        // Buscar cidade por ID IBGE
        const territoryId = url.searchParams.get("territory_id") || "";
        if (!territoryId) {
          return new Response(
            JSON.stringify({ error: "territory_id é obrigatório" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        apiUrl = `${QUERIDO_DIARIO_API}/cities/${territoryId}`;
        break;
        
      case "themes":
        // Listar temas disponíveis
        apiUrl = `${QUERIDO_DIARIO_API}/gazettes/by_theme/themes/`;
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: `Endpoint '${endpoint}' não suportado` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`[Querido Diário] Fetching: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "SDR-Juridico/1.0"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Querido Diário] Error ${response.status}: ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `Erro na API Querido Diário: ${response.status}`,
          details: errorText
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300" // Cache por 5 minutos
        } 
      }
    );

  } catch (error) {
    console.error("[Querido Diário] Exception:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

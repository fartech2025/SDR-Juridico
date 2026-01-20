import { supabase } from "@/lib/supabaseClient";
import { AppError } from "@/utils/errors";
import { resolveOrgScope } from "@/services/orgScope";
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];
const mapDbDocumentoToDocumentoRow = (row) => {
  const meta = row.meta || {};
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.created_at,
    org_id: row.org_id ?? null,
    titulo: row.title,
    descricao: row.description || null,
    caso_id: row.caso_id || null,
    cliente_nome: meta.cliente_nome || null,
    tipo: meta.tipo || row.bucket || "docs",
    status: meta.status || "pendente",
    url: row.storage_path,
    arquivo_nome: meta.arquivo_nome || row.title,
    arquivo_tamanho: row.size_bytes || null,
    mime_type: row.mime_type || null,
    solicitado_por: row.uploaded_by || null,
    tags: row.tags || []
  };
};
const buildDocumentoPayload = (doc, applyDefaults) => {
  const payload = {};
  if (doc.titulo !== void 0) payload.title = doc.titulo;
  if (doc.descricao !== void 0) payload.description = doc.descricao;
  if (doc.caso_id !== void 0) payload.caso_id = doc.caso_id;
  if (doc.mime_type !== void 0) payload.mime_type = doc.mime_type;
  if (doc.arquivo_tamanho !== void 0) payload.size_bytes = doc.arquivo_tamanho;
  if (doc.tags !== void 0) payload.tags = doc.tags;
  if (doc.url !== void 0) payload.storage_path = doc.url ?? void 0;
  const meta = {};
  if (doc.tipo !== void 0) meta.tipo = doc.tipo;
  if (doc.status !== void 0) meta.status = doc.status;
  if (doc.arquivo_nome !== void 0) meta.arquivo_nome = doc.arquivo_nome;
  if (doc.cliente_nome !== void 0) meta.cliente_nome = doc.cliente_nome;
  if (Object.keys(meta).length > 0) payload.meta = meta;
  if (applyDefaults) {
    if (!payload.bucket) payload.bucket = "docs";
  }
  return payload;
};
const resolveOrgId = async (userId, casoId) => {
  if (casoId) {
    const { data: data2, error } = await supabase.from("casos").select("org_id").eq("id", casoId).single();
    if (!error && data2?.org_id) {
      return data2.org_id;
    }
  }
  const { data } = await supabase.from("org_members").select("org_id").eq("user_id", userId).eq("ativo", true).limit(1).maybeSingle();
  return data?.org_id || null;
};
const documentosService = {
  /**
   * Busca todos os documentos
   */
  async getDocumentos() {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope();
      if (!isFartechAdmin && !orgId) return [];
      const query = supabase.from("documentos").select("*").order("created_at", { ascending: false });
      const { data, error } = isFartechAdmin ? await query : await query.eq("org_id", orgId);
      if (error) throw new AppError(error.message, "database_error");
      return (data || []).map((row) => mapDbDocumentoToDocumentoRow(row));
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Erro ao buscar documentos", "database_error");
    }
  },
  /**
   * Busca um documento especifico
   */
  async getDocumento(id) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope();
      if (!isFartechAdmin && !orgId) {
        throw new AppError("Organizacao nao encontrada para o usuario atual", "auth_error");
      }
      const query = supabase.from("documentos").select("*").eq("id", id);
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq("org_id", orgId).single();
      if (error) throw new AppError(error.message, "database_error");
      if (!data) throw new AppError("Documento nao encontrado", "not_found");
      return mapDbDocumentoToDocumentoRow(data);
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Erro ao buscar documento", "database_error");
    }
  },
  /**
   * Busca documentos de um caso especifico
   */
  async getDocumentosByCaso(casoId) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope();
      if (!isFartechAdmin && !orgId) return [];
      const query = supabase.from("documentos").select("*").eq("caso_id", casoId).order("created_at", { ascending: false });
      const { data, error } = isFartechAdmin ? await query : await query.eq("org_id", orgId);
      if (error) throw new AppError(error.message, "database_error");
      return (data || []).map((row) => mapDbDocumentoToDocumentoRow(row));
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Erro ao buscar documentos do caso", "database_error");
    }
  },
  /**
   * Busca documentos por status
   */
  async getDocumentosByStatus(status) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope();
      if (!isFartechAdmin && !orgId) return [];
      const query = supabase.from("documentos").select("*").filter("meta->>status", "eq", status).order("created_at", { ascending: false });
      const { data, error } = isFartechAdmin ? await query : await query.eq("org_id", orgId);
      if (error) throw new AppError(error.message, "database_error");
      return (data || []).map((row) => mapDbDocumentoToDocumentoRow(row));
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Erro ao buscar documentos", "database_error");
    }
  },
  /**
   * Busca documentos por tipo
   */
  async getDocumentosByTipo(tipo) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope();
      if (!isFartechAdmin && !orgId) return [];
      const query = supabase.from("documentos").select("*").filter("meta->>tipo", "eq", tipo).order("created_at", { ascending: false });
      const { data, error } = isFartechAdmin ? await query : await query.eq("org_id", orgId);
      if (error) throw new AppError(error.message, "database_error");
      return (data || []).map((row) => mapDbDocumentoToDocumentoRow(row));
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Erro ao buscar documentos", "database_error");
    }
  },
  /**
   * Cria um novo documento
   */
  async createDocumento(documento) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope();
      if (!isFartechAdmin && !orgId) {
        throw new AppError("Organizacao nao encontrada para o usuario atual", "auth_error");
      }
      const payload = buildDocumentoPayload(documento, true);
      if (!isFartechAdmin) {
        payload.org_id = orgId;
      }
      const { data, error } = await supabase.from("documentos").insert([payload]).select("*").single();
      if (error) throw new AppError(error.message, "database_error");
      if (!data) throw new AppError("Erro ao criar documento", "database_error");
      return mapDbDocumentoToDocumentoRow(data);
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Erro ao criar documento", "database_error");
    }
  },
  /**
   * Atualiza um documento existente
   */
  async updateDocumento(id, updates) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope();
      if (!isFartechAdmin && !orgId) {
        throw new AppError("Organizacao nao encontrada para o usuario atual", "auth_error");
      }
      const payload = buildDocumentoPayload(updates, false);
      const query = supabase.from("documentos").update(payload).eq("id", id).select("*");
      const { data, error } = isFartechAdmin ? await query.single() : await query.eq("org_id", orgId).single();
      if (error) throw new AppError(error.message, "database_error");
      if (!data) throw new AppError("Documento nao encontrado", "not_found");
      return mapDbDocumentoToDocumentoRow(data);
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Erro ao atualizar documento", "database_error");
    }
  },
  /**
   * Deleta um documento
   */
  async deleteDocumento(id) {
    try {
      const { orgId, isFartechAdmin } = await resolveOrgScope();
      if (!isFartechAdmin && !orgId) {
        throw new AppError("Organizacao nao encontrada para o usuario atual", "auth_error");
      }
      const query = supabase.from("documentos").delete().eq("id", id);
      const { error } = isFartechAdmin ? await query : await query.eq("org_id", orgId);
      if (error) throw new AppError(error.message, "database_error");
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Erro ao deletar documento", "database_error");
    }
  },
  /**
   * Marca documento como completo
   */
  async marcarCompleto(id) {
    return this.updateDocumento(id, { status: "aprovado" });
  },
  /**
   * Marca documento como rejeitado
   */
  async marcarRejeitado(id) {
    return this.updateDocumento(id, { status: "rejeitado" });
  },
  /**
   * Solicita documento novamente
   */
  async solicitarNovamente(id) {
    return this.updateDocumento(id, { status: "solicitado" });
  },
  /**
   * Marca documento como pendente
   */
  async marcarPendente(id) {
    return this.updateDocumento(id, { status: "pendente" });
  },
  /**
   * Busca documentos pendentes
   */
  async getDocumentosPendentes() {
    return this.getDocumentosByStatus("pendente");
  },
  /**
   * Busca estatisticas de documentos
   */
  async getEstatisticas() {
    try {
      const documentos = await this.getDocumentos();
      return {
        total: documentos.length,
        pendentes: documentos.filter((doc) => doc.status === "pendente").length,
        completos: documentos.filter((doc) => doc.status === "aprovado").length
      };
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Erro ao buscar estatisticas", "database_error");
    }
  },
  /**
   * Faz upload de um documento para o Supabase Storage
   */
  async uploadDocumento(params) {
    try {
      const { arquivo, categoria = "geral", casoId, tags, descricao, orgId } = params;
      if (!arquivo) {
        throw new AppError("Arquivo e obrigatorio", "validation_error");
      }
      const maxSize = 10 * 1024 * 1024;
      if (arquivo.size > maxSize) {
        throw new AppError("Arquivo muito grande. Tamanho maximo: 10MB", "validation_error");
      }
      if (!ALLOWED_MIME_TYPES.includes(arquivo.type)) {
        throw new AppError("Tipo de arquivo nao permitido. Use PDF, imagens ou documentos Office", "validation_error");
      }
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) {
        throw new AppError("Usuario nao autenticado. Faca login para fazer upload de documentos.", "auth_error");
      }
      const user = session.user;
      const resolvedOrgId = orgId || await resolveOrgId(user.id, casoId);
      if (!resolvedOrgId) {
        throw new AppError("Nao foi possivel identificar a organizacao do usuario.", "validation_error");
      }
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const extensao = arquivo.name.split(".").pop();
      const nomeArquivo = `${timestamp}_${randomStr}.${extensao}`;
      const storagePath = `${user.id}/${resolvedOrgId}/${nomeArquivo}`;
      const { error: uploadError } = await supabase.storage.from("documentos").upload(storagePath, arquivo, {
        cacheControl: "3600",
        upsert: false
      });
      if (uploadError) {
        throw new AppError(uploadError.message, "storage_error");
      }
      const payload = {
        title: arquivo.name,
        description: descricao || null,
        bucket: "docs",
        storage_path: storagePath,
        mime_type: arquivo.type,
        size_bytes: arquivo.size,
        caso_id: casoId || null,
        uploaded_by: user.id,
        tags: tags || [],
        org_id: resolvedOrgId,
        meta: {
          status: "pendente",
          tipo: categoria || "geral",
          arquivo_nome: arquivo.name
        }
      };
      const { data: documento, error: dbError } = await supabase.from("documentos").insert(payload).select("*").single();
      if (dbError) {
        await supabase.storage.from("documentos").remove([storagePath]);
        throw new AppError(dbError.message, "database_error");
      }
      return mapDbDocumentoToDocumentoRow(documento);
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Erro ao fazer upload do documento", "unknown_error");
    }
  },
  /**
   * Obtem URL publica temporaria para visualizar/baixar documento
   */
  async obterUrlDocumento(storagePath) {
    try {
      if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
        return storagePath;
      }
      const { data, error } = await supabase.storage.from("documentos").createSignedUrl(storagePath, 3600);
      if (error) throw new AppError(error.message, "storage_error");
      if (!data.signedUrl) throw new AppError("Erro ao gerar URL", "storage_error");
      return data.signedUrl;
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Erro ao obter URL do documento", "unknown_error");
    }
  },
  /**
   * Faz download de um documento
   */
  async downloadDocumento(storagePath, nomeOriginal) {
    try {
      let fileData;
      if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
        const response = await fetch(storagePath);
        if (!response.ok) {
          throw new AppError(`Erro ao baixar documento (${response.status})`, "storage_error");
        }
        fileData = await response.blob();
      } else {
        const { data, error } = await supabase.storage.from("documentos").download(storagePath);
        if (error) throw new AppError(error.message, "storage_error");
        fileData = data;
      }
      const url = URL.createObjectURL(fileData);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeOriginal;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw error instanceof AppError ? error : new AppError("Erro ao fazer download do documento", "unknown_error");
    }
  }
};
function formatarTamanhoArquivo(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}
function obterIconeArquivo(tipoArquivo) {
  if (tipoArquivo.includes("pdf")) return "[PDF]";
  if (tipoArquivo.includes("image")) return "[IMG]";
  if (tipoArquivo.includes("word") || tipoArquivo.includes("document")) return "[DOC]";
  if (tipoArquivo.includes("excel") || tipoArquivo.includes("sheet")) return "[XLS]";
  return "[FILE]";
}
export {
  documentosService,
  formatarTamanhoArquivo,
  obterIconeArquivo
};

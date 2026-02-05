export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advogado_carteira_clientes: {
        Row: {
          advogado_user_id: string
          ativo: boolean
          cliente_id: string
          created_at: string
          id: string
          org_id: string
        }
        Insert: {
          advogado_user_id: string
          ativo?: boolean
          cliente_id: string
          created_at?: string
          id?: string
          org_id: string
        }
        Update: {
          advogado_user_id?: string
          ativo?: boolean
          cliente_id?: string
          created_at?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advogado_carteira_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advogado_carteira_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advogado_carteira_clientes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamentos: {
        Row: {
          caso_id: string | null
          cliente_id: string | null
          created_at: string
          description: string | null
          end_at: string
          external_event_id: string | null
          external_provider: string | null
          id: string
          lead_id: string | null
          location: string | null
          meta: Json
          org_id: string
          owner_user_id: string | null
          start_at: string
          status: string | null
          tipo: string | null
          title: string
        }
        Insert: {
          caso_id?: string | null
          cliente_id?: string | null
          created_at?: string
          description?: string | null
          end_at: string
          external_event_id?: string | null
          external_provider?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          meta?: Json
          org_id: string
          owner_user_id?: string | null
          start_at: string
          status?: string | null
          tipo?: string | null
          title: string
        }
        Update: {
          caso_id?: string | null
          cliente_id?: string | null
          created_at?: string
          description?: string | null
          end_at?: string
          external_event_id?: string | null
          external_provider?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          meta?: Json
          org_id?: string
          owner_user_id?: string | null
          start_at?: string
          status?: string | null
          tipo?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_com_datajud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          device_info: Json | null
          event_name: string
          event_type: string
          id: string
          org_id: string | null
          properties: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          event_name: string
          event_type: string
          id?: string
          org_id?: string | null
          properties?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          org_id?: string | null
          properties?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimento_estado: {
        Row: {
          created_at: string | null
          ultimo_aviso_fora_horario: string | null
          updated_at: string | null
          wa_id: string
        }
        Insert: {
          created_at?: string | null
          ultimo_aviso_fora_horario?: string | null
          updated_at?: string | null
          wa_id: string
        }
        Update: {
          created_at?: string | null
          ultimo_aviso_fora_horario?: string | null
          updated_at?: string | null
          wa_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          changed_at: string | null
          changed_by: string | null
          changed_fields: string[] | null
          created_at: string
          details: Json
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          org_id: string
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          changed_at?: string | null
          changed_by?: string | null
          changed_fields?: string[] | null
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          org_id: string
          record_id?: string
          table_name?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          changed_at?: string | null
          changed_by?: string | null
          changed_fields?: string[] | null
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          org_id?: string
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      caso_partes: {
        Row: {
          caso_id: string
          cliente_id: string | null
          created_at: string
          documento: string | null
          extra: Json
          id: string
          nome: string | null
          org_id: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          caso_id: string
          cliente_id?: string | null
          created_at?: string
          documento?: string | null
          extra?: Json
          id?: string
          nome?: string | null
          org_id: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          caso_id?: string
          cliente_id?: string | null
          created_at?: string
          documento?: string | null
          extra?: Json
          id?: string
          nome?: string | null
          org_id?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caso_partes_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caso_partes_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caso_partes_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_com_datajud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caso_partes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caso_partes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caso_partes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      casos: {
        Row: {
          area: string | null
          assunto_principal: string | null
          cached_at: string | null
          classe_processual: string | null
          cliente_id: string | null
          created_at: string
          datajud_last_sync_at: string | null
          datajud_processo_id: string | null
          datajud_sync_error: string | null
          datajud_sync_status: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          encerrado_em: string | null
          fase_atual: string | null
          grau: string | null
          heat: string | null
          id: string
          lead_id: string | null
          numero_processo: string | null
          org_id: string | null
          prioridade: number
          responsavel_user_id: string | null
          sla_risk: string | null
          status: Database["public"]["Enums"]["case_status"]
          subarea: string | null
          titulo: string
          tribunal: string | null
          valor_estimado: number | null
        }
        Insert: {
          area?: string | null
          assunto_principal?: string | null
          cached_at?: string | null
          classe_processual?: string | null
          cliente_id?: string | null
          created_at?: string
          datajud_last_sync_at?: string | null
          datajud_processo_id?: string | null
          datajud_sync_error?: string | null
          datajud_sync_status?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          encerrado_em?: string | null
          fase_atual?: string | null
          grau?: string | null
          heat?: string | null
          id?: string
          lead_id?: string | null
          numero_processo?: string | null
          org_id?: string | null
          prioridade?: number
          responsavel_user_id?: string | null
          sla_risk?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          subarea?: string | null
          titulo: string
          tribunal?: string | null
          valor_estimado?: number | null
        }
        Update: {
          area?: string | null
          assunto_principal?: string | null
          cached_at?: string | null
          classe_processual?: string | null
          cliente_id?: string | null
          created_at?: string
          datajud_last_sync_at?: string | null
          datajud_processo_id?: string | null
          datajud_sync_error?: string | null
          datajud_sync_status?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          encerrado_em?: string | null
          fase_atual?: string | null
          grau?: string | null
          heat?: string | null
          id?: string
          lead_id?: string | null
          numero_processo?: string | null
          org_id?: string | null
          prioridade?: number
          responsavel_user_id?: string | null
          sla_risk?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          subarea?: string | null
          titulo?: string
          tribunal?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "casos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          documento: string | null
          email: string | null
          endereco: Json
          health: string | null
          id: string
          nome: string
          observacoes: string | null
          org_id: string | null
          owner_user_id: string | null
          status: string | null
          tags: string[]
          telefone: string | null
          tipo: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          documento?: string | null
          email?: string | null
          endereco?: Json
          health?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          org_id?: string | null
          owner_user_id?: string | null
          status?: string | null
          tags?: string[]
          telefone?: string | null
          tipo?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          documento?: string | null
          email?: string | null
          endereco?: Json
          health?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          org_id?: string | null
          owner_user_id?: string | null
          status?: string | null
          tags?: string[]
          telefone?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversa_buffer: {
        Row: {
          buffer_text: string
          first_message_at: string
          id: string
          last_message_at: string
          org: string
          pending_reply: boolean
          wa_id: string
        }
        Insert: {
          buffer_text: string
          first_message_at?: string
          id?: string
          last_message_at?: string
          org: string
          pending_reply?: boolean
          wa_id: string
        }
        Update: {
          buffer_text?: string
          first_message_at?: string
          id?: string
          last_message_at?: string
          org?: string
          pending_reply?: boolean
          wa_id?: string
        }
        Relationships: []
      }
      conversas: {
        Row: {
          aberto: boolean
          bloqueado: boolean
          canal: Database["public"]["Enums"]["channel_type"]
          caso_id: string | null
          cliente_id: string | null
          created_at: string
          expirar_bloqueado: string | null
          humano_na_conversa: boolean
          id: string
          lead_id: string | null
          org_id: string
          remote_id: string
          ultimo_evento_em: string | null
        }
        Insert: {
          aberto?: boolean
          bloqueado?: boolean
          canal?: Database["public"]["Enums"]["channel_type"]
          caso_id?: string | null
          cliente_id?: string | null
          created_at?: string
          expirar_bloqueado?: string | null
          humano_na_conversa?: boolean
          id?: string
          lead_id?: string | null
          org_id: string
          remote_id: string
          ultimo_evento_em?: string | null
        }
        Update: {
          aberto?: boolean
          bloqueado?: boolean
          canal?: Database["public"]["Enums"]["channel_type"]
          caso_id?: string | null
          cliente_id?: string | null
          created_at?: string
          expirar_bloqueado?: string | null
          humano_na_conversa?: boolean
          id?: string
          lead_id?: string | null
          org_id?: string
          remote_id?: string
          ultimo_evento_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversas_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_com_datajud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      datajud_api_calls: {
        Row: {
          action: string
          api_latency_ms: number | null
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          org_id: string
          resultado_count: number | null
          search_query: string | null
          status_code: number | null
          tribunal: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          api_latency_ms?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          org_id: string
          resultado_count?: number | null
          search_query?: string | null
          status_code?: number | null
          tribunal?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          api_latency_ms?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          org_id?: string
          resultado_count?: number | null
          search_query?: string | null
          status_code?: number | null
          tribunal?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "datajud_api_calls_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      datajud_movimentacoes: {
        Row: {
          codigo: string | null
          complemento: string | null
          created_at: string
          data_hora: string | null
          data_movimentacao: string | null
          datajud_processo_id: string
          descricao: string | null
          detected_at: string | null
          id: string
          nome: string | null
          notified: boolean | null
          org_id: string
          payload: Json
          raw_response: Json | null
        }
        Insert: {
          codigo?: string | null
          complemento?: string | null
          created_at?: string
          data_hora?: string | null
          data_movimentacao?: string | null
          datajud_processo_id: string
          descricao?: string | null
          detected_at?: string | null
          id?: string
          nome?: string | null
          notified?: boolean | null
          org_id: string
          payload?: Json
          raw_response?: Json | null
        }
        Update: {
          codigo?: string | null
          complemento?: string | null
          created_at?: string
          data_hora?: string | null
          data_movimentacao?: string | null
          datajud_processo_id?: string
          descricao?: string | null
          detected_at?: string | null
          id?: string
          nome?: string | null
          notified?: boolean | null
          org_id?: string
          payload?: Json
          raw_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "datajud_movimentacoes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datajud_movimentacoes_processo_id_fkey"
            columns: ["datajud_processo_id"]
            isOneToOne: false
            referencedRelation: "datajud_processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datajud_movimentacoes_processo_id_fkey"
            columns: ["datajud_processo_id"]
            isOneToOne: false
            referencedRelation: "v_casos_com_datajud"
            referencedColumns: ["datajud_processo_id"]
          },
        ]
      }
      datajud_processos: {
        Row: {
          area: string | null
          assunto: string | null
          cached_at: string | null
          caso_id: string | null
          classe: string | null
          cliente_id: string | null
          created_at: string
          dataajuizamento: string | null
          dataatualizacao: string | null
          id: string
          last_sync_at: string | null
          numero_processo: string
          org_id: string
          payload: Json
          raw_response: Json | null
          sigiloso: boolean | null
          tribunal: string | null
        }
        Insert: {
          area?: string | null
          assunto?: string | null
          cached_at?: string | null
          caso_id?: string | null
          classe?: string | null
          cliente_id?: string | null
          created_at?: string
          dataajuizamento?: string | null
          dataatualizacao?: string | null
          id?: string
          last_sync_at?: string | null
          numero_processo: string
          org_id: string
          payload?: Json
          raw_response?: Json | null
          sigiloso?: boolean | null
          tribunal?: string | null
        }
        Update: {
          area?: string | null
          assunto?: string | null
          cached_at?: string | null
          caso_id?: string | null
          classe?: string | null
          cliente_id?: string | null
          created_at?: string
          dataajuizamento?: string | null
          dataatualizacao?: string | null
          id?: string
          last_sync_at?: string | null
          numero_processo?: string
          org_id?: string
          payload?: Json
          raw_response?: Json | null
          sigiloso?: boolean | null
          tribunal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "datajud_processos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datajud_processos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datajud_processos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_com_datajud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datajud_processos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datajud_processos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datajud_processos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      datajud_sync_jobs: {
        Row: {
          caso_id: string | null
          completed_at: string | null
          created_at: string
          erro_mensagem: string | null
          error: string | null
          finished_at: string | null
          id: string
          numero_processo: string | null
          org_id: string
          params: Json
          proximo_retry: string | null
          resultado: Json | null
          started_at: string | null
          status: string
          tentativas: number | null
          tipo: string
        }
        Insert: {
          caso_id?: string | null
          completed_at?: string | null
          created_at?: string
          erro_mensagem?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          numero_processo?: string | null
          org_id: string
          params?: Json
          proximo_retry?: string | null
          resultado?: Json | null
          started_at?: string | null
          status?: string
          tentativas?: number | null
          tipo: string
        }
        Update: {
          caso_id?: string | null
          completed_at?: string | null
          created_at?: string
          erro_mensagem?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          numero_processo?: string | null
          org_id?: string
          params?: Json
          proximo_retry?: string | null
          resultado?: Json | null
          started_at?: string | null
          status?: string
          tentativas?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "datajud_sync_jobs_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datajud_sync_jobs_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datajud_sync_jobs_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_com_datajud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datajud_sync_jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          bucket: string
          caso_id: string | null
          cliente_id: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          lead_id: string | null
          meta: Json
          mime_type: string | null
          org_id: string | null
          size_bytes: number | null
          status: string | null
          storage_path: string
          tags: string[]
          tipo: string | null
          title: string
          uploaded_by: string | null
          visibility: Database["public"]["Enums"]["doc_visibility"]
        }
        Insert: {
          bucket?: string
          caso_id?: string | null
          cliente_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          meta?: Json
          mime_type?: string | null
          org_id?: string | null
          size_bytes?: number | null
          status?: string | null
          storage_path: string
          tags?: string[]
          tipo?: string | null
          title: string
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["doc_visibility"]
        }
        Update: {
          bucket?: string
          caso_id?: string | null
          cliente_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          meta?: Json
          mime_type?: string | null
          org_id?: string | null
          size_bytes?: number | null
          status?: string | null
          storage_path?: string
          tags?: string[]
          tipo?: string | null
          title?: string
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["doc_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documentos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_com_datajud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          name: string | null
          org_id: string
          provider: string
          secrets: Json
          settings: Json
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string | null
          org_id: string
          provider: string
          secrets?: Json
          settings?: Json
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string | null
          org_id?: string
          provider?: string
          secrets?: Json
          settings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          heat_anterior: string | null
          heat_novo: string | null
          id: string
          lead_id: string
          metadata: Json | null
          motivo: string | null
          org_id: string
          status_anterior: string | null
          status_novo: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          heat_anterior?: string | null
          heat_novo?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          motivo?: string | null
          org_id: string
          status_anterior?: string | null
          status_novo: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          heat_anterior?: string | null
          heat_novo?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          motivo?: string | null
          org_id?: string
          status_anterior?: string | null
          status_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_status_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_user_id: string | null
          assunto: string | null
          canal: Database["public"]["Enums"]["channel_type"]
          cliente_id: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          heat: string | null
          id: string
          last_contact_at: string | null
          nome: string | null
          org_id: string | null
          origem: string | null
          qualificacao: Json
          remote_id: string | null
          resumo: string | null
          status: Database["public"]["Enums"]["lead_status"]
          telefone: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          assunto?: string | null
          canal?: Database["public"]["Enums"]["channel_type"]
          cliente_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          heat?: string | null
          id?: string
          last_contact_at?: string | null
          nome?: string | null
          org_id?: string | null
          origem?: string | null
          qualificacao?: Json
          remote_id?: string | null
          resumo?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          assunto?: string | null
          canal?: Database["public"]["Enums"]["channel_type"]
          cliente_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          heat?: string | null
          id?: string
          last_contact_at?: string | null
          nome?: string | null
          org_id?: string | null
          origem?: string | null
          qualificacao?: Json
          remote_id?: string | null
          resumo?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          body: string | null
          conversa_id: string
          created_at: string
          delivered_at: string | null
          direction: string
          from_remote: string | null
          id: string
          org_id: string
          payload: Json
          provider_msg_id: string | null
          read_at: string | null
          to_remote: string | null
        }
        Insert: {
          body?: string | null
          conversa_id: string
          created_at?: string
          delivered_at?: string | null
          direction: string
          from_remote?: string | null
          id?: string
          org_id: string
          payload?: Json
          provider_msg_id?: string | null
          read_at?: string | null
          to_remote?: string | null
        }
        Update: {
          body?: string | null
          conversa_id?: string
          created_at?: string
          delivered_at?: string | null
          direction?: string
          from_remote?: string | null
          id?: string
          org_id?: string
          payload?: Json
          provider_msg_id?: string | null
          read_at?: string | null
          to_remote?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      message_buffer: {
        Row: {
          buffered_text: string
          conversa_id: string
          created_at: string
          id: string
          last_message_at: string
          meta: Json
          open: boolean
          org_id: string
          window_started_at: string
        }
        Insert: {
          buffered_text?: string
          conversa_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          meta?: Json
          open?: boolean
          org_id: string
          window_started_at?: string
        }
        Update: {
          buffered_text?: string
          conversa_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          meta?: Json
          open?: boolean
          org_id?: string
          window_started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_buffer_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_buffer_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_log: {
        Row: {
          executed_at: string | null
          id: string
          migration_name: string
          notes: string | null
          status: string | null
        }
        Insert: {
          executed_at?: string | null
          id?: string
          migration_name: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          executed_at?: string | null
          id?: string
          migration_name?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: []
      }
      notas: {
        Row: {
          created_at: string
          created_by: string | null
          entidade: string
          entidade_id: string
          id: string
          org_id: string
          tags: string[]
          texto: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entidade: string
          entidade_id: string
          id?: string
          org_id: string
          tags?: string[]
          texto: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entidade?: string
          entidade_id?: string
          id?: string
          org_id?: string
          tags?: string[]
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          activated_at: string | null
          address: Json | null
          ativo: boolean
          billing_cycle: string | null
          billing_email: string | null
          cancelled_at: string | null
          cnpj: string | null
          created_at: string
          custom_domain: string | null
          email: string | null
          id: string
          logo_url: string | null
          managed_by: string | null
          max_cases: number | null
          max_storage_gb: number | null
          max_users: number | null
          metadata: Json | null
          name: string | null
          next_billing_date: string | null
          nome: string
          phone: string | null
          plan: string | null
          plano: string | null
          primary_color: string | null
          provisioned_by: string | null
          secondary_color: string | null
          settings: Json
          slug: string | null
          status: string | null
          suspended_at: string | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          address?: Json | null
          ativo?: boolean
          billing_cycle?: string | null
          billing_email?: string | null
          cancelled_at?: string | null
          cnpj?: string | null
          created_at?: string
          custom_domain?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          managed_by?: string | null
          max_cases?: number | null
          max_storage_gb?: number | null
          max_users?: number | null
          metadata?: Json | null
          name?: string | null
          next_billing_date?: string | null
          nome: string
          phone?: string | null
          plan?: string | null
          plano?: string | null
          primary_color?: string | null
          provisioned_by?: string | null
          secondary_color?: string | null
          settings?: Json
          slug?: string | null
          status?: string | null
          suspended_at?: string | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          address?: Json | null
          ativo?: boolean
          billing_cycle?: string | null
          billing_email?: string | null
          cancelled_at?: string | null
          cnpj?: string | null
          created_at?: string
          custom_domain?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          managed_by?: string | null
          max_cases?: number | null
          max_storage_gb?: number | null
          max_users?: number | null
          metadata?: Json | null
          name?: string | null
          next_billing_date?: string | null
          nome?: string
          phone?: string | null
          plan?: string | null
          plano?: string | null
          primary_color?: string | null
          provisioned_by?: string | null
          secondary_color?: string | null
          settings?: Json
          slug?: string | null
          status?: string | null
          suspended_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tarefa_documentos: {
        Row: {
          created_at: string
          delivered_at: string | null
          documento_id: string | null
          entregue: boolean
          id: string
          label: string
          org_id: string
          requested_by: string | null
          solicitado: boolean
          tarefa_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          documento_id?: string | null
          entregue?: boolean
          id?: string
          label: string
          org_id: string
          requested_by?: string | null
          solicitado?: boolean
          tarefa_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          documento_id?: string | null
          entregue?: boolean
          id?: string
          label?: string
          org_id?: string
          requested_by?: string | null
          solicitado?: boolean
          tarefa_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_documentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_documentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "v_documentos_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_documentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_documentos_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_documentos_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "v_tarefas_ativas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefa_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          metadata: Json | null
          motivo: string | null
          org_id: string
          status_anterior: string | null
          status_novo: string
          tarefa_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          motivo?: string | null
          org_id: string
          status_anterior?: string | null
          status_novo: string
          tarefa_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          motivo?: string | null
          org_id?: string
          status_anterior?: string | null
          status_novo?: string
          tarefa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_status_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_status_history_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_status_history_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "v_tarefas_ativas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          assigned_user_id: string | null
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          due_at: string | null
          entidade: string | null
          entidade_id: string | null
          id: string
          org_id: string
          priority: number
          rejected_reason: string | null
          status: Database["public"]["Enums"]["task_status"]
          submitted_at: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          due_at?: string | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          org_id: string
          priority?: number
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          submitted_at?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          due_at?: string | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          org_id?: string
          priority?: number
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          submitted_at?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          active: boolean
          content: string
          created_at: string
          id: string
          kind: string
          name: string
          org_id: string
          variables: Json
        }
        Insert: {
          active?: boolean
          content: string
          created_at?: string
          id?: string
          kind: string
          name: string
          org_id: string
          variables?: Json
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          id?: string
          kind?: string
          name?: string
          org_id?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          created_at: string
          email: string
          id: string
          nome_completo: string
          org_id: string | null
          permissoes: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nome_completo: string
          org_id?: string | null
          permissoes?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome_completo?: string
          org_id?: string | null
          permissoes?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_audit_user_changes: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_name: string | null
          changed_at: string | null
          changed_fields: string[] | null
          id: string | null
          new_values: Json | null
          old_values: Json | null
          org_name: string | null
          table_name: string | null
          target_user_email: string | null
          target_user_name: string | null
        }
        Relationships: []
      }
      v_casos_ativos: {
        Row: {
          area: string | null
          assunto_principal: string | null
          cached_at: string | null
          classe_processual: string | null
          cliente_id: string | null
          created_at: string | null
          datajud_last_sync_at: string | null
          datajud_processo_id: string | null
          datajud_sync_error: string | null
          datajud_sync_status: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          encerrado_em: string | null
          fase_atual: string | null
          grau: string | null
          heat: string | null
          id: string | null
          lead_id: string | null
          numero_processo: string | null
          org_id: string | null
          prioridade: number | null
          responsavel_user_id: string | null
          sla_risk: string | null
          status: Database["public"]["Enums"]["case_status"] | null
          subarea: string | null
          titulo: string | null
          tribunal: string | null
          valor_estimado: number | null
        }
        Insert: {
          area?: string | null
          assunto_principal?: string | null
          cached_at?: string | null
          classe_processual?: string | null
          cliente_id?: string | null
          created_at?: string | null
          datajud_last_sync_at?: string | null
          datajud_processo_id?: string | null
          datajud_sync_error?: string | null
          datajud_sync_status?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          encerrado_em?: string | null
          fase_atual?: string | null
          grau?: string | null
          heat?: string | null
          id?: string | null
          lead_id?: string | null
          numero_processo?: string | null
          org_id?: string | null
          prioridade?: number | null
          responsavel_user_id?: string | null
          sla_risk?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          subarea?: string | null
          titulo?: string | null
          tribunal?: string | null
          valor_estimado?: number | null
        }
        Update: {
          area?: string | null
          assunto_principal?: string | null
          cached_at?: string | null
          classe_processual?: string | null
          cliente_id?: string | null
          created_at?: string | null
          datajud_last_sync_at?: string | null
          datajud_processo_id?: string | null
          datajud_sync_error?: string | null
          datajud_sync_status?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          encerrado_em?: string | null
          fase_atual?: string | null
          grau?: string | null
          heat?: string | null
          id?: string | null
          lead_id?: string | null
          numero_processo?: string | null
          org_id?: string | null
          prioridade?: number | null
          responsavel_user_id?: string | null
          sla_risk?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          subarea?: string | null
          titulo?: string | null
          tribunal?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "casos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_casos_com_datajud: {
        Row: {
          area: string | null
          assunto_principal: string | null
          classe_processual: string | null
          datajud_last_sync_at: string | null
          datajud_processo_id: string | null
          datajud_sync_status: string | null
          grau: string | null
          id: string | null
          numero_processo: string | null
          stage: string | null
          status: Database["public"]["Enums"]["case_status"] | null
          titulo: string | null
          total_movimentacoes: number | null
          tribunal: string | null
          ultima_atualizacao_datajud: string | null
        }
        Relationships: []
      }
      v_clientes_ativos: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          documento: string | null
          email: string | null
          endereco: Json | null
          health: string | null
          id: string | null
          nome: string | null
          observacoes: string | null
          org_id: string | null
          owner_user_id: string | null
          status: string | null
          tags: string[] | null
          telefone: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          documento?: string | null
          email?: string | null
          endereco?: Json | null
          health?: string | null
          id?: string | null
          nome?: string | null
          observacoes?: string | null
          org_id?: string | null
          owner_user_id?: string | null
          status?: string | null
          tags?: string[] | null
          telefone?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          documento?: string | null
          email?: string | null
          endereco?: Json | null
          health?: string | null
          id?: string | null
          nome?: string | null
          observacoes?: string | null
          org_id?: string | null
          owner_user_id?: string | null
          status?: string | null
          tags?: string[] | null
          telefone?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_documentos_ativos: {
        Row: {
          bucket: string | null
          caso_id: string | null
          cliente_id: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string | null
          lead_id: string | null
          meta: Json | null
          mime_type: string | null
          org_id: string | null
          size_bytes: number | null
          status: string | null
          storage_path: string | null
          tags: string[] | null
          tipo: string | null
          title: string | null
          uploaded_by: string | null
          visibility: Database["public"]["Enums"]["doc_visibility"] | null
        }
        Insert: {
          bucket?: string | null
          caso_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string | null
          lead_id?: string | null
          meta?: Json | null
          mime_type?: string | null
          org_id?: string | null
          size_bytes?: number | null
          status?: string | null
          storage_path?: string | null
          tags?: string[] | null
          tipo?: string | null
          title?: string | null
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["doc_visibility"] | null
        }
        Update: {
          bucket?: string | null
          caso_id?: string | null
          cliente_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string | null
          lead_id?: string | null
          meta?: Json | null
          mime_type?: string | null
          org_id?: string | null
          size_bytes?: number | null
          status?: string | null
          storage_path?: string | null
          tags?: string[] | null
          tipo?: string | null
          title?: string | null
          uploaded_by?: string | null
          visibility?: Database["public"]["Enums"]["doc_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "v_casos_com_datajud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_leads_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_leads_ativos: {
        Row: {
          assigned_user_id: string | null
          assunto: string | null
          canal: Database["public"]["Enums"]["channel_type"] | null
          cliente_id: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          heat: string | null
          id: string | null
          last_contact_at: string | null
          nome: string | null
          org_id: string | null
          origem: string | null
          qualificacao: Json | null
          remote_id: string | null
          resumo: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          telefone: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          assunto?: string | null
          canal?: Database["public"]["Enums"]["channel_type"] | null
          cliente_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          heat?: string | null
          id?: string | null
          last_contact_at?: string | null
          nome?: string | null
          org_id?: string | null
          origem?: string | null
          qualificacao?: Json | null
          remote_id?: string | null
          resumo?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          telefone?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          assunto?: string | null
          canal?: Database["public"]["Enums"]["channel_type"] | null
          cliente_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          heat?: string | null
          id?: string | null
          last_contact_at?: string | null
          nome?: string | null
          org_id?: string | null
          origem?: string | null
          qualificacao?: Json | null
          remote_id?: string | null
          resumo?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "v_clientes_ativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_tarefa_timeline: {
        Row: {
          changed_by: string | null
          changed_by_email: string | null
          changed_by_name: string | null
          created_at: string | null
          id: string | null
          metadata: Json | null
          motivo: string | null
          org_id: string | null
          status_anterior: string | null
          status_novo: string | null
          tarefa_id: string | null
          tarefa_titulo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_status_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_status_history_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_status_history_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "v_tarefas_ativas"
            referencedColumns: ["id"]
          },
        ]
      }
      v_tarefas_ativas: {
        Row: {
          assigned_user_id: string | null
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          due_at: string | null
          entidade: string | null
          entidade_id: string | null
          id: string | null
          org_id: string | null
          priority: number | null
          rejected_reason: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          submitted_at: string | null
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          due_at?: string | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string | null
          org_id?: string | null
          priority?: number | null
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          submitted_at?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          due_at?: string | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string | null
          org_id?: string | null
          priority?: number | null
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          submitted_at?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_user_effective_permissions: {
        Row: {
          effective_permission: string | null
          email: string | null
          global_permissions: string[] | null
          is_active_in_org: boolean | null
          is_advogado: boolean | null
          is_fartech_admin: boolean | null
          is_org_admin: boolean | null
          nome_completo: string | null
          org_id: string | null
          org_name: string | null
          org_role: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_read_caso: {
        Args: { _caso_id: string; _org_id: string }
        Returns: boolean
      }
      can_read_cliente: {
        Args: { _cliente_id: string; _org_id: string }
        Returns: boolean
      }
      can_read_conversa: {
        Args: { _conversa_id: string; _org_id: string }
        Returns: boolean
      }
      can_read_documento: {
        Args: { _doc: string; _org: string }
        Returns: boolean
      }
      can_read_lead: { Args: { _lead: string; _org: string }; Returns: boolean }
      cleanup_expired_sessions: {
        Args: never
        Returns: {
          deleted_count: number
          execution_time: string
        }[]
      }
      cleanup_old_notifications: {
        Args: never
        Returns: {
          deleted_count: number
          execution_time: string
        }[]
      }
      cleanup_old_sync_jobs: {
        Args: never
        Returns: {
          deleted_count: number
          execution_time: string
        }[]
      }
      cleanup_old_telemetry: {
        Args: never
        Returns: {
          analytics_deleted: number
          api_calls_deleted: number
          execution_time: string
        }[]
      }
      get_lead_history: {
        Args: { p_lead_id: string }
        Returns: {
          changed_by: string
          changed_by_name: string
          created_at: string
          heat_anterior: string
          heat_novo: string
          id: string
          motivo: string
          status_anterior: string
          status_novo: string
        }[]
      }
      get_org_recent_changes: {
        Args: { p_hours_back?: number; p_org_id: string }
        Returns: {
          action: string
          actor_email: string
          changed_at: string
          changed_fields: string[]
          table_name: string
          target_user_email: string
        }[]
      }
      get_tarefa_history: {
        Args: { p_tarefa_id: string }
        Returns: {
          changed_by: string
          changed_by_name: string
          created_at: string
          id: string
          motivo: string
          status_anterior: string
          status_novo: string
          tempo_no_status: unknown
        }[]
      }
      get_user_audit_history: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          action: string
          changed_at: string
          changed_by_email: string
          changed_fields: string[]
          new_values: Json
          old_values: Json
          org_name: string
          table_name: string
        }[]
      }
      get_user_org_id: { Args: never; Returns: string }
      hard_delete_old: {
        Args: { p_days_old?: number; p_table_name: string }
        Returns: number
      }
      has_any_role: {
        Args: {
          _org: string
          roles: Database["public"]["Enums"]["user_role"][]
        }
        Returns: boolean
      }
      is_adminish: { Args: { _org_id: string }; Returns: boolean }
      is_advogado: { Args: { _org_id: string }; Returns: boolean }
      is_associado: { Args: { _org_id: string }; Returns: boolean }
      is_fartech_admin: { Args: never; Returns: boolean }
      is_global_admin: { Args: never; Returns: boolean }
      is_member: { Args: { _org_id: string }; Returns: boolean }
      is_org_admin: { Args: never; Returns: boolean }
      is_org_admin_for_org: { Args: { _org_id: string }; Returns: boolean }
      is_org_adminish: { Args: { _org_id: string }; Returns: boolean }
      is_org_manager: { Args: { p_org: string }; Returns: boolean }
      is_org_member: { Args: { _org_id: string }; Returns: boolean }
      is_org_staff: { Args: { _org_id: string }; Returns: boolean }
      is_staff: { Args: { _org_id: string }; Returns: boolean }
      log_tarefa_status_change: {
        Args: {
          p_metadata?: Json
          p_motivo?: string
          p_org_id: string
          p_status_anterior: string
          p_status_novo: string
          p_tarefa_id: string
        }
        Returns: string
      }
      member_role: {
        Args: { _org: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      restore_deleted: {
        Args: { p_record_id: string; p_table_name: string }
        Returns: boolean
      }
      run_all_cleanups: {
        Args: never
        Returns: {
          cleanup_name: string
          execution_timestamp: string
          records_deleted: number
        }[]
      }
      show_cleanup_targets: {
        Args: never
        Returns: {
          old_records_to_cleanup: number
          retention_policy: string
          table_name: string
          total_records: number
        }[]
      }
      soft_delete: {
        Args: { p_record_id: string; p_table_name: string }
        Returns: boolean
      }
    }
    Enums: {
      case_status:
        | "aberto"
        | "triagem"
        | "negociacao"
        | "contrato"
        | "andamento"
        | "encerrado"
        | "arquivado"
      channel_type: "whatsapp" | "email" | "telefone" | "webchat" | "outro"
      doc_visibility: "privado" | "interno" | "cliente"
      lead_status:
        | "novo"
        | "em_triagem"
        | "qualificado"
        | "nao_qualificado"
        | "convertido"
        | "perdido"
      task_status:
        | "pendente"
        | "em_andamento"
        | "concluida"
        | "cancelada"
        | "devolvida"
        | "aguardando_validacao"
      user_role:
        | "admin"
        | "gestor"
        | "advogado"
        | "associado"
        | "secretaria"
        | "leitura"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      case_status: [
        "aberto",
        "triagem",
        "negociacao",
        "contrato",
        "andamento",
        "encerrado",
        "arquivado",
      ],
      channel_type: ["whatsapp", "email", "telefone", "webchat", "outro"],
      doc_visibility: ["privado", "interno", "cliente"],
      lead_status: [
        "novo",
        "em_triagem",
        "qualificado",
        "nao_qualificado",
        "convertido",
        "perdido",
      ],
      task_status: [
        "pendente",
        "em_andamento",
        "concluida",
        "cancelada",
        "devolvida",
        "aguardando_validacao",
      ],
      user_role: [
        "admin",
        "gestor",
        "advogado",
        "associado",
        "secretaria",
        "leitura",
      ],
    },
  },
} as const

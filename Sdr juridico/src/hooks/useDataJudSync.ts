// src/hooks/useDataJudSync.ts
import { useEffect, useRef, useState } from 'react'
import { datajudCaseService } from '@/services/datajudCaseService'
import type { DataJudProcesso, DataJudMovimento } from '@/types/domain'
import { supabase } from '@/lib/supabaseClient'

interface UseDataJudSyncOptions {
  autoSync?: boolean
  syncInterval?: number // milliseconds
  enablePolling?: boolean
}

interface UseDataJudSyncState {
  processos: DataJudProcesso[]
  movimentos: DataJudMovimento[]
  loading: boolean
  error: string | null
  syncing: boolean
  lastSyncAt?: Date
}

type TimeoutHandle = ReturnType<typeof setTimeout>

export function useDataJudSync(options: UseDataJudSyncOptions = {}): UseDataJudSyncState & {
  searchProcessos: (clienteName: string, clienteId?: string) => Promise<void>
  syncMovimentos: (processId: string, numeroProcesso: string, tribunal: string) => Promise<void>
  retry: () => void
} {
  const {
    autoSync = false,
    syncInterval = 5 * 60 * 1000, // 5 minutes default
    enablePolling = false,
  } = options

  const [state, setState] = useState<UseDataJudSyncState>({
    processos: [],
    movimentos: [],
    loading: false,
    error: null,
    syncing: false,
    lastSyncAt: undefined,
  })

  const syncTimeoutRef = useRef<TimeoutHandle | null>(null)
  const pollingIntervalRef = useRef<TimeoutHandle | null>(null)

  const searchProcessos = async (clienteName: string, clienteId?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData?.session
      console.log(
        'DataJud session token',
        session?.access_token,
        'expires at',
        session?.expires_at
      )
      const result = await datajudCaseService.searchProcessosForCliente(
        clienteId || "",
        clienteName
      )
      setState((prev) => ({
        ...prev,
        processos: result.processos,
        loading: false,
        lastSyncAt: new Date(),
      }))
    } catch (error) {
      const rawMsg = error instanceof Error ? error.message : "Unknown error"
      const errorMessage = mapFriendlyError(rawMsg)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
    }
  }

  const syncMovimentos = async (
    processId: string,
    numeroProcesso: string,
    tribunal: string
  ) => {
    setState((prev) => ({ ...prev, syncing: true, error: null }))
    try {
      const result = await datajudCaseService.syncProcessoMovimentos(
        processId,
        numeroProcesso,
        tribunal
      )
      setState((prev) => ({
        ...prev,
        movimentos: result.movimentos,
        syncing: false,
        lastSyncAt: new Date(),
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setState((prev) => ({
        ...prev,
        syncing: false,
        error: errorMessage,
      }))
    }
  }

  const retry = () => {
    setState((prev) => ({ ...prev, error: null }))
  }

  // Setup auto-sync
  useEffect(() => {
    if (!autoSync) return

    // Initial sync
    const performSync = async () => {
      if (state.processos.length > 0 && state.processos[0].id) {
        try {
          await syncMovimentos(
            state.processos[0].id,
            state.processos[0].numero_processo,
            state.processos[0].tribunal
          )
        } catch (error) {
          console.error("Auto-sync failed:", error)
        }
      }
    }

    // Schedule initial sync
    syncTimeoutRef.current = setTimeout(performSync, 5000)

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [autoSync, state.processos])

  // Setup polling
  useEffect(() => {
    if (!enablePolling || state.processos.length === 0) return

    const pollMovimentos = async () => {
      if (state.processos[0]?.id) {
        try {
          await syncMovimentos(
            state.processos[0].id,
            state.processos[0].numero_processo,
            state.processos[0].tribunal
          )
        } catch (error) {
          console.error("Polling sync failed:", error)
        }
      }
    }

    pollingIntervalRef.current = setInterval(pollMovimentos, syncInterval)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [enablePolling, state.processos, syncInterval])

  // Cleanup
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  return {
    ...state,
    searchProcessos,
    syncMovimentos,
    retry,
  }
}

function mapFriendlyError(message: string): string {
  const msg = message.toLowerCase()
  if (msg.includes("invalid token") || msg.includes("401")) {
    return "Sessão expirada ou token inválido. Faça login novamente."
  }
  if (msg.includes("user not part of any organization") || msg.includes("403")) {
    return "Usuário não vinculado a uma organização. Confirme o acesso ou peça ao administrador."
  }
  if (msg.includes("rate limit")) {
    return "Limite de requisições ao DataJud atingido. Aguarde alguns minutos e tente novamente."
  }
  if (msg.includes("datajud returned")) {
    return `Erro ao chamar DataJud: ${message}`
  }
  return message || "Erro desconhecido ao buscar processos no DataJud."
}

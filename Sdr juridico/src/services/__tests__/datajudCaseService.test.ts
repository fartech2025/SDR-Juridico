// src/services/__tests__/datajudCaseService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { datajudCaseService } from "../datajudCaseService"
import { apiClient } from "../apiClient"

vi.mock("../apiClient")

describe("datajudCaseService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("searchProcessos", () => {
    it("should search for processos successfully", async () => {
      const mockResponse = {
        data: {
          hits: {
            total: { value: 1 },
            hits: [
              {
                _source: {
                  numeroProcesso: "0000001-00.2025.5.15.0000",
                  classe: "Ação Trabalhista",
                  assunto: "Aviso Prévio",
                  tribunal: "trt",
                  grau: "1º grau",
                  nivelSigilo: "Público",
                  dataAjuizamento: "2025-01-01T00:00:00Z",
                  dataAtualizacao: "2025-01-31T00:00:00Z",
                },
              },
            ],
          },
        },
        latency_ms: 150,
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await datajudCaseService.searchProcessos({
        tribunal: "trt",
        searchType: "parte",
        query: "João Silva",
      })

      expect(result.total).toBe(1)
      expect(result.processos).toHaveLength(1)
      expect(result.processos[0].numero_processo).toBe("0000001-00.2025.5.15.0000")
      expect(result.latency_ms).toBe(150)
    })

    it("should handle API errors gracefully", async () => {
      const mockError = new Error("API Rate Limited")
      vi.mocked(apiClient.post).mockRejectedValue(mockError)

      await expect(
        datajudCaseService.searchProcessos({
          tribunal: "trt",
          searchType: "parte",
          query: "João Silva",
        })
      ).rejects.toThrow("API Rate Limited")
    })

    it("should return empty array when no processos found", async () => {
      const mockResponse = {
        data: {
          hits: {
            total: { value: 0 },
            hits: [],
          },
        },
        latency_ms: 100,
      }

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await datajudCaseService.searchProcessos({
        tribunal: "stj",
        searchType: "numero",
        query: "0000000-00.0000.0.00.0000",
      })

      expect(result.total).toBe(0)
      expect(result.processos).toHaveLength(0)
    })
  })

  describe("linkProcessoToCaso", () => {
    it("should link processo to caso successfully", async () => {
      const mockCaso = {
        id: "caso-123",
        titulo: "Meu Caso",
        numero_processo: "0000001-00.2025.5.15.0000",
        tribunal: "trt",
      }

      vi.mocked(apiClient.patch).mockResolvedValue({ data: mockCaso })

      const processo = {
        id: "processo-123",
        numero_processo: "0000001-00.2025.5.15.0000",
        tribunal: "trt",
        grau: "1º grau",
        classe_processual: "Ação Trabalhista",
        assunto: "Aviso Prévio",
        raw_response: {},
      }

      const result = await datajudCaseService.linkProcessoToCaso(
        "caso-123",
        processo as any
      )

      expect(result.sucesso).toBe(true)
      expect(result.caso.numero_processo).toBe("0000001-00.2025.5.15.0000")
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/casos/caso-123",
        expect.objectContaining({
          numero_processo: "0000001-00.2025.5.15.0000",
          tribunal: "trt",
          datajud_sync_status: "sincronizado",
        })
      )
    })
  })

  describe("unlinkProcessoFromCaso", () => {
    it("should unlink processo from caso successfully", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: {} })

      const result = await datajudCaseService.unlinkProcessoFromCaso("caso-123")

      expect(result.sucesso).toBe(true)
      expect(apiClient.patch).toHaveBeenCalledWith(
        "/casos/caso-123",
        expect.objectContaining({
          numero_processo: null,
          tribunal: null,
          datajud_sync_status: "nunca_sincronizado",
        })
      )
    })
  })

  describe("getHistoricoConsultas", () => {
    it("should retrieve API call history", async () => {
      const mockHistory = [
        {
          id: "call-1",
          action: "search",
          tribunal: "trt",
          search_query: "João Silva",
          resultado_count: 5,
          created_at: "2025-01-31T12:00:00Z",
        },
      ]

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockHistory })

      const result = await datajudCaseService.getHistoricoConsultas(50)

      expect(result).toHaveLength(1)
      expect(result[0].action).toBe("search")
      expect(apiClient.get).toHaveBeenCalledWith(
        "/datajud_api_calls?order=created_at.desc&limit=50"
      )
    })

    it("should return empty array on error", async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error("Network error"))

      const result = await datajudCaseService.getHistoricoConsultas(50)

      expect(result).toEqual([])
    })
  })
})

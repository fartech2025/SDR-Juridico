import { AppError } from "@/utils/errors";
import { resolveOrgScope } from "@/services/orgScope";
const defaultIntegrations = [
  { provider: "whatsapp", name: "WhatsApp", enabled: false },
  { provider: "google_calendar", name: "Google Calendar", enabled: false },
  { provider: "google_meet", name: "Google Meet", enabled: false },
  { provider: "teams", name: "Microsoft Teams", enabled: false },
  { provider: "datajud", name: "DataJud", enabled: false },
  { provider: "twilio", name: "Twilio", enabled: false },
  { provider: "evolution", name: "Evolution", enabled: false },
  { provider: "avisa", name: "Avisa", enabled: false }
];
const STORAGE_KEY = "sdr_integrations";
const resolveStorageKey = async () => {
  const { orgId, isFartechAdmin } = await resolveOrgScope();
  if (isFartechAdmin) return `${STORAGE_KEY}:fartech`;
  if (!orgId) return `${STORAGE_KEY}:unknown`;
  return `${STORAGE_KEY}:${orgId}`;
};
const readIntegrations = (key) => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const saveIntegrations = (key, rows) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(rows));
};
const loadIntegrations = async () => {
  const key = await resolveStorageKey();
  const rows = readIntegrations(key);
  if (rows.length > 0) {
    return { key, rows };
  }
  if (key !== STORAGE_KEY) {
    const legacy = readIntegrations(STORAGE_KEY);
    if (legacy.length > 0) {
      saveIntegrations(key, legacy);
      return { key, rows: legacy };
    }
  }
  return { key, rows: [] };
};
const seedDefaults = async () => {
  const stored = await loadIntegrations();
  if (stored.rows.length > 0) return stored;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const seeded = defaultIntegrations.map((item) => ({
    id: `${item.provider}-${now}`,
    provider: item.provider,
    name: item.name,
    enabled: item.enabled,
    secrets: {},
    settings: {},
    created_at: now
  }));
  saveIntegrations(stored.key, seeded);
  return { key: stored.key, rows: seeded };
};
const integrationsService = {
  async getIntegrations() {
    try {
      const stored = await seedDefaults();
      return stored.rows;
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao buscar integracoes",
        "database_error"
      );
    }
  },
  async cleanupDuplicates() {
    const stored = await seedDefaults();
    const rows = stored.rows;
    const idsToDelete = [];
    const grouped = /* @__PURE__ */ new Map();
    rows.forEach((row) => {
      const key = row.provider;
      const list = grouped.get(key) || [];
      list.push(row);
      grouped.set(key, list);
    });
    grouped.forEach((list) => {
      if (list.length <= 1) return;
      const connected = list.filter((row) => row.enabled);
      if (connected.length > 0) {
        list.filter((row) => !row.enabled).forEach((row) => idsToDelete.push(row.id));
        return;
      }
      const [, ...rest] = list;
      rest.forEach((row) => idsToDelete.push(row.id));
    });
    if (idsToDelete.length === 0) return 0;
    const filtered = rows.filter((row) => !idsToDelete.includes(row.id));
    saveIntegrations(stored.key, filtered);
    return idsToDelete.length;
  },
  async updateIntegration(id, updates) {
    try {
      const stored = await seedDefaults();
      const rows = stored.rows;
      const idx = rows.findIndex((row) => row.id === id);
      if (idx === -1) throw new AppError("Integracao nao encontrada", "not_found");
      const updated = { ...rows[idx], ...updates };
      const next = [...rows];
      next[idx] = updated;
      saveIntegrations(stored.key, next);
      return updated;
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao atualizar integracao",
        "database_error"
      );
    }
  },
  async ensureDefaultIntegrations() {
    try {
      await seedDefaults();
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Erro ao criar integracoes padrao",
        "database_error"
      );
    }
  }
};
export {
  integrationsService
};

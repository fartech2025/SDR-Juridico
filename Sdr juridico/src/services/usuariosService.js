import { supabase } from "@/lib/supabaseClient";
const getString = (value) => typeof value === "string" ? value : null;
const getBoolean = (value) => typeof value === "boolean" ? value : null;
const normalizeRole = (value) => {
  if (!value) return null;
  return value.toLowerCase().trim();
};
const buildPermissoes = (roles, isFartechAdmin) => {
  const perms = /* @__PURE__ */ new Set();
  if (isFartechAdmin || roles.includes("fartech_admin")) {
    perms.add("fartech_admin");
  }
  if (roles.some((role) => ["org_admin", "admin", "gestor"].includes(role))) {
    perms.add("org_admin");
    if (roles.includes("gestor")) {
      perms.add("gestor");
    }
  }
  if (perms.size === 0) {
    perms.add("user");
  }
  return Array.from(perms);
};
const upsertUsuarioFromSeed = async (userId, seed) => {
  const { data, error } = await supabase.from("usuarios").upsert(
    {
      id: userId,
      nome_completo: seed.nome_completo,
      email: seed.email,
      permissoes: seed.permissoes
    },
    { onConflict: "id" }
  ).select("id, nome_completo, email, permissoes, created_at, updated_at").maybeSingle();
  if (error) {
    console.warn("[usuariosService] Failed to upsert usuarios from seed:", error);
    return null;
  }
  return data || null;
};
const isMissingTable = (err, table) => {
  const message = err?.message || "";
  return err?.code === "42P01" || message.includes("schema cache") || message.includes(`public.${table}`) || message.includes(`table "${table}"`) || message.includes(`relation "public.${table}"`);
};
const deriveSeedFromUser = async (user) => {
  const metadata = user.user_metadata && typeof user.user_metadata === "object" ? user.user_metadata : {};
  const metadataName = getString(metadata.nome_completo) || getString(metadata.nome) || getString(metadata.name) || getString(metadata.full_name) || null;
  const metadataRole = normalizeRole(getString(metadata.role) || getString(metadata.perfil));
  const metadataOrgId = getString(metadata.org_id);
  const metadataFartechAdmin = getBoolean(metadata.is_fartech_admin) ?? getBoolean(metadata.fartech_admin) ?? false;
  const roleCandidates = [metadataRole].filter(Boolean);
  const isFartechAdmin = metadataFartechAdmin || roleCandidates.includes("fartech_admin");
  const permissoes = buildPermissoes(roleCandidates, isFartechAdmin);
  const fallbackEmail = user.email || "";
  const fallbackName = fallbackEmail ? fallbackEmail.split("@")[0] : "Usuario";
  return {
    nome_completo: (metadataName || fallbackName || "Usuario").trim(),
    email: user.email || fallbackEmail,
    permissoes,
    org_id: metadataOrgId || null,
    role: metadataRole || null,
    is_fartech_admin: isFartechAdmin
  };
};
async function ensureUsuario(user) {
  const seed = await deriveSeedFromUser(user);
  const { data, error } = await supabase.from("usuarios").select("id, nome_completo, email, permissoes, created_at, updated_at").eq("id", user.id).maybeSingle();
  if (error) {
    const missingUsuariosTable = isMissingTable(error, "usuarios");
    if (!missingUsuariosTable) {
      console.warn("[usuariosService] Failed to load usuarios:", error);
    }
    return { usuario: null, missingUsuariosTable, seed };
  }
  if (data) {
    return { usuario: data, missingUsuariosTable: false, seed: null };
  }
  const created = await upsertUsuarioFromSeed(user.id, seed);
  if (!created) {
    return { usuario: null, missingUsuariosTable: false, seed };
  }
  return {
    usuario: created,
    missingUsuariosTable: false,
    seed: null
  };
}
export {
  ensureUsuario
};

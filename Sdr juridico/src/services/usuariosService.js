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
  let profileName = null;
  let profileEmail = null;
  let profileOrgId = null;
  let profileRole = null;
  let profileFartechAdmin = false;
  const { data: profile, error: profileError } = await supabase.from("profiles").select("user_id, nome, email, org_id, role, is_fartech_admin").eq("user_id", user.id).maybeSingle();
  if (profileError && !isMissingTable(profileError, "profiles")) {
    console.warn("[usuariosService] Failed to load profiles seed:", profileError);
  }
  if (profile) {
    profileName = getString(profile.nome);
    profileEmail = getString(profile.email);
    profileOrgId = getString(profile.org_id);
    profileRole = normalizeRole(getString(profile.role));
    profileFartechAdmin = Boolean(profile.is_fartech_admin);
  }
  const roleCandidates = [profileRole, metadataRole].filter(Boolean);
  const isFartechAdmin = profileFartechAdmin || metadataFartechAdmin || roleCandidates.includes("fartech_admin");
  const permissoes = buildPermissoes(roleCandidates, isFartechAdmin);
  const fallbackEmail = user.email || "";
  const fallbackName = fallbackEmail ? fallbackEmail.split("@")[0] : "Usuario";
  return {
    nome_completo: (profileName || metadataName || fallbackName || "Usuario").trim(),
    email: profileEmail || user.email || fallbackEmail,
    permissoes,
    org_id: profileOrgId || metadataOrgId || null,
    role: profileRole || metadataRole || null,
    is_fartech_admin: isFartechAdmin
  };
};
async function ensureUsuario(user) {
  const { data, error } = await supabase.from("usuarios").select("id, nome_completo, email, permissoes, created_at, updated_at").eq("id", user.id).maybeSingle();
  if (error) {
    const seed2 = await deriveSeedFromUser(user);
    if (isMissingTable(error, "usuarios")) {
      return { usuario: null, missingUsuariosTable: true, seed: seed2 };
    }
    console.warn("[usuariosService] Failed to load usuarios:", error);
    return { usuario: null, missingUsuariosTable: false, seed: seed2 };
  }
  if (data) {
    return { usuario: data, missingUsuariosTable: false, seed: null };
  }
  const seed = await deriveSeedFromUser(user);
  const { data: created, error: insertError } = await supabase.from("usuarios").upsert(
    {
      id: user.id,
      nome_completo: seed.nome_completo,
      email: seed.email,
      permissoes: seed.permissoes
    },
    { onConflict: "id" }
  ).select("id, nome_completo, email, permissoes, created_at, updated_at").maybeSingle();
  if (insertError) {
    if (isMissingTable(insertError, "usuarios")) {
      return { usuario: null, missingUsuariosTable: true, seed };
    }
    console.warn("[usuariosService] Failed to upsert usuarios:", insertError);
    return { usuario: null, missingUsuariosTable: false, seed };
  }
  return { usuario: created || null, missingUsuariosTable: false, seed };
}
export {
  ensureUsuario
};

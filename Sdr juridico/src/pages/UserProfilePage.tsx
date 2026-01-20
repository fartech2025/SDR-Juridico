import * as React from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageState } from '@/components/PageState'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { supabase } from '@/lib/supabaseClient'

type ProfileFormState = {
  nome_completo: string
  email: string
  telefone: string
  cargo: string
  departamento: string
  foto_url: string
}

const buildFormState = (
  profile: {
    nome_completo?: string | null
    email?: string | null
    telefone?: string | null
    cargo?: string | null
    departamento?: string | null
    foto_url?: string | null
  } | null,
  fallbackEmail: string,
): ProfileFormState => ({
  nome_completo: profile?.nome_completo || '',
  email: profile?.email || fallbackEmail,
  telefone: profile?.telefone || '',
  cargo: profile?.cargo || '',
  departamento: profile?.departamento || '',
  foto_url: profile?.foto_url || '',
})

export const UserProfilePage = () => {
  const {
    user,
    profile,
    loading,
    error,
    displayName,
    roleLabel,
    initials,
  } = useCurrentUser()
  const fallbackEmail = user?.email || ''
  const [form, setForm] = React.useState<ProfileFormState>(() =>
    buildFormState(profile, fallbackEmail),
  )
  const [dirty, setDirty] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const updateFormFromProfile = React.useCallback(() => {
    setForm(buildFormState(profile, fallbackEmail))
    setDirty(false)
  }, [profile, fallbackEmail])

  React.useEffect(() => {
    updateFormFromProfile()
  }, [updateFormFromProfile])

  const handleChange =
    (field: keyof ProfileFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setForm((prev) => ({ ...prev, [field]: value }))
      setDirty(true)
    }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !profile) return
    setSaving(true)
    try {
      const email = (form.email || fallbackEmail).trim()
      const updates = {
        nome_completo: form.nome_completo.trim(),
        email,
        telefone: form.telefone.trim() || null,
        cargo: form.cargo.trim() || null,
        departamento: form.departamento.trim() || null,
        foto_url: form.foto_url.trim() || null,
      }
      const { error: updateError } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', profile.id)

      if (updateError) {
        throw updateError
      }

      toast.success('Perfil atualizado.')
      setDirty(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Nao foi possivel salvar o perfil.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const pageStatus = loading
    ? 'loading'
    : error
      ? 'error'
      : profile
        ? 'ready'
        : 'empty'

  const fotoUrl = form.foto_url.trim()

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-white via-white to-[#f3f6ff] p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-subtle">
                Perfil
              </p>
              <h1 className="text-2xl font-semibold text-text">
                {displayName}
              </h1>
              <p className="text-sm text-text-muted">{roleLabel}</p>
            </div>
          </div>
          <div className="text-xs text-text-muted">{fallbackEmail}</div>
        </div>
      </div>

      <PageState
        status={pageStatus}
        emptyTitle="Perfil nao encontrado"
        emptyDescription="Seu perfil ainda nao foi registrado."
        errorDescription={error?.message || 'Nao foi possivel carregar o perfil.'}
      >
        <Card className="border border-border bg-surface/90">
          <form onSubmit={handleSave} className="space-y-4">
            <CardHeader className="space-y-2">
              <CardTitle>Dados do usuario</CardTitle>
              <CardDescription>
                Atualize as informacoes principais do seu perfil.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text">
                  Nome completo
                </label>
                <Input
                  value={form.nome_completo}
                  onChange={handleChange('nome_completo')}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text">Email</label>
                <Input
                  value={form.email}
                  readOnly
                  className="bg-surface-2 text-text-subtle"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text">
                  Telefone
                </label>
                <Input
                  value={form.telefone}
                  onChange={handleChange('telefone')}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text">Cargo</label>
                <Input
                  value={form.cargo}
                  onChange={handleChange('cargo')}
                  placeholder="Ex: Admin, Gestor"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text">
                  Departamento
                </label>
                <Input
                  value={form.departamento}
                  onChange={handleChange('departamento')}
                  placeholder="Ex: Operacoes"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-text">
                  Foto (URL)
                </label>
                <Input
                  value={form.foto_url}
                  onChange={handleChange('foto_url')}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={updateFormFromProfile}
                disabled={!dirty || saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!dirty || saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </PageState>
    </div>
  )
}

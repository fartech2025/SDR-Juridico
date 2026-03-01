import React, { useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UpgradeWall } from '@/components/UpgradeWall'
import { useOrgBranding } from '@/hooks/useOrgBranding'
import { usePlan } from '@/hooks/usePlan'
import { buildHtmlWithBranding } from '@/services/documentoTemplateService'

export function BrandingConfigCard() {
  const { canUseBranding } = usePlan()

  if (!canUseBranding) {
    return <UpgradeWall feature="Aparência do Escritório" minPlan="Basic" />
  }

  return <BrandingForm />
}

function BrandingForm() {
  const { branding, loading, saving, saveBranding, uploadLogo } = useOrgBranding()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)

  // Local state para edição (não persiste até clicar em Salvar)
  const [form, setForm] = React.useState({
    corPrimaria:   branding.corPrimaria,
    corSecundaria: branding.corSecundaria,
    nomeDisplay:   branding.nomeDisplay   ?? '',
    oabRegistro:   branding.oabRegistro   ?? '',
    endereco:      branding.endereco      ?? '',
    telefone:      branding.telefone      ?? '',
    rodapeTexto:   branding.rodapeTexto   ?? '',
    marcaDagua:    branding.marcaDagua    ?? '',
  })

  // Sincroniza form quando branding é carregado do banco
  React.useEffect(() => {
    if (loading) return
    setForm({
      corPrimaria:   branding.corPrimaria,
      corSecundaria: branding.corSecundaria,
      nomeDisplay:   branding.nomeDisplay   ?? '',
      oabRegistro:   branding.oabRegistro   ?? '',
      endereco:      branding.endereco      ?? '',
      telefone:      branding.telefone      ?? '',
      rodapeTexto:   branding.rodapeTexto   ?? '',
      marcaDagua:    branding.marcaDagua    ?? '',
    })
  }, [loading, branding])

  const previewBranding = { ...branding, ...form }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo deve ter no máximo 2MB')
      return
    }
    setUploading(true)
    try {
      await uploadLogo(file)
      toast.success('Logo atualizado com sucesso')
    } catch {
      toast.error('Erro ao fazer upload do logo')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    try {
      await saveBranding({
        corPrimaria:   form.corPrimaria,
        corSecundaria: form.corSecundaria,
        nomeDisplay:   form.nomeDisplay   || undefined,
        oabRegistro:   form.oabRegistro   || undefined,
        endereco:      form.endereco      || undefined,
        telefone:      form.telefone      || undefined,
        rodapeTexto:   form.rodapeTexto   || undefined,
        marcaDagua:    form.marcaDagua    || undefined,
      })
      toast.success('Aparência salva com sucesso')
    } catch {
      toast.error('Erro ao salvar configurações de aparência')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Aparência do Escritório</CardTitle>
        <p className="text-xs text-gray-500">
          Personalize o cabeçalho e rodapé dos documentos gerados pelo sistema.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">

          {/* ── Coluna esquerda: formulário ──────────────────────────────── */}
          <div className="space-y-4">

            {/* Logo */}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Logo do Escritório</p>
              <div className="flex items-center gap-3">
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt="Logo"
                    className="h-14 w-auto object-contain rounded border border-gray-100"
                  />
                ) : (
                  <div
                    className="h-14 w-14 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: form.corPrimaria }}
                  >
                    Logo
                  </div>
                )}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                    {uploading ? 'Enviando...' : 'Alterar logo'}
                  </Button>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG, WebP · máx. 2MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>

            {/* Cores */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1">Cor Primária</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.corPrimaria}
                    onChange={(e) => setForm((f) => ({ ...f, corPrimaria: e.target.value }))}
                    className="h-8 w-10 rounded border border-gray-200 cursor-pointer p-0.5"
                  />
                  <Input
                    value={form.corPrimaria}
                    onChange={(e) => setForm((f) => ({ ...f, corPrimaria: e.target.value }))}
                    className="font-mono text-xs"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1">Cor Secundária</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.corSecundaria}
                    onChange={(e) => setForm((f) => ({ ...f, corSecundaria: e.target.value }))}
                    className="h-8 w-10 rounded border border-gray-200 cursor-pointer p-0.5"
                  />
                  <Input
                    value={form.corSecundaria}
                    onChange={(e) => setForm((f) => ({ ...f, corSecundaria: e.target.value }))}
                    className="font-mono text-xs"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Nome / OAB */}
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1">Nome do Escritório</label>
              <Input
                value={form.nomeDisplay}
                onChange={(e) => setForm((f) => ({ ...f, nomeDisplay: e.target.value }))}
                placeholder="Ex: Silva & Associados Advocacia"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1">Registro OAB</label>
              <Input
                value={form.oabRegistro}
                onChange={(e) => setForm((f) => ({ ...f, oabRegistro: e.target.value }))}
                placeholder="Ex: OAB/MG 123.456"
              />
            </div>

            {/* Rodapé */}
            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1">Endereço</label>
              <Input
                value={form.endereco}
                onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                placeholder="Ex: Av. Afonso Pena, 1000 – Centro, BH/MG"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1">Telefone</label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                  placeholder="(31) 99999-9999"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1">Texto de Rodapé</label>
                <Input
                  value={form.rodapeTexto}
                  onChange={(e) => setForm((f) => ({ ...f, rodapeTexto: e.target.value }))}
                  placeholder="Mensagem personalizada"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wide text-gray-500 block mb-1">Marca d'água nos documentos</label>
              <Input
                value={form.marcaDagua}
                onChange={(e) => setForm((f) => ({ ...f, marcaDagua: e.target.value }))}
                placeholder="Ex: RASCUNHO, CONFIDENCIAL (vazio = desativado)"
                maxLength={30}
              />
              <p className="text-xs text-gray-400 mt-1">
                Aparece diagonal no fundo de todos os PDFs gerados pelo escritório.
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: '#721011' }}
              className="w-full text-white hover:opacity-90"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? 'Salvando...' : 'Salvar Aparência'}
            </Button>
          </div>

          {/* ── Coluna direita: preview do cabeçalho ─────────────────────── */}
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Pré-visualização do Cabeçalho</p>
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm overflow-hidden">
              <div
                className="text-xs"
                style={{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '117%' }}
                dangerouslySetInnerHTML={{
                  __html: buildHtmlWithBranding(
                    '<p style="color:#9ca3af;font-style:italic;margin:20px 0;">Conteúdo do documento aqui...</p>',
                    previewBranding,
                  ),
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

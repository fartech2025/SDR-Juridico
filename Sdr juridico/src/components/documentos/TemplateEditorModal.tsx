import React, { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Heading1, Heading2, Plus, Trash2, CloudUpload,
} from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DrivePickerModal } from '@/components/documentos/DrivePickerModal'
import { extractVariables } from '@/services/documentoTemplateService'
import type {
  DocumentoTemplate,
  DocumentoTemplateCreateInput,
  TemplateCategoria,
  TemplateVariavel,
} from '@/types/documentoTemplate'
import { TEMPLATE_CATEGORIA_LABELS } from '@/types/documentoTemplate'

interface Props {
  open: boolean
  onClose: () => void
  template?: DocumentoTemplate | null   // null = novo, defined = editar
  onSave: (input: DocumentoTemplateCreateInput) => Promise<void>
}

const TOOLBAR_BTN = 'rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-30'
const TOOLBAR_BTN_ACTIVE = `${TOOLBAR_BTN} bg-gray-200 text-gray-900`

export function TemplateEditorModal({ open, onClose, template, onSave }: Props) {
  const [titulo, setTitulo]     = React.useState('')
  const [categoria, setCategoria] = React.useState<TemplateCategoria>('contrato')
  const [variaveis, setVariaveis] = React.useState<TemplateVariavel[]>([])
  const [saving, setSaving]       = React.useState(false)
  const [showDrivePicker, setShowDrivePicker] = React.useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Escreva o conteúdo do template aqui...' }),
    ],
    content: '',
    onUpdate({ editor: ed }) {
      // Detecta variáveis automaticamente conforme o usuário escreve
      const html = ed.getHTML()
      const found = extractVariables(html)
      setVariaveis((prev) => {
        const existingKeys = new Set(prev.map((v) => v.key))
        const novos: TemplateVariavel[] = found
          .filter((k) => !existingKeys.has(k))
          .map((k) => ({ key: k, label: formatKeyAsLabel(k), required: true }))
        // Remove variáveis que não existem mais no texto
        const atuais = prev.filter((v) => found.includes(v.key))
        return [...atuais, ...novos]
      })
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none',
      },
    },
  })

  // Ao abrir, preencher com dados do template (edição) ou limpar (novo)
  useEffect(() => {
    if (!open) return
    if (template) {
      setTitulo(template.titulo)
      setCategoria(template.categoria)
      setVariaveis(template.variaveis ?? [])
      editor?.commands.setContent(template.conteudo ?? '')
    } else {
      setTitulo('')
      setCategoria('contrato')
      setVariaveis([])
      editor?.commands.setContent('')
    }
  }, [open, template, editor])

  const inserirVariavel = useCallback(
    (key: string) => {
      editor?.commands.insertContent(`{${key}}`)
      editor?.commands.focus()
    },
    [editor],
  )

  const adicionarVariavel = useCallback(() => {
    const key = `variavel_${variaveis.length + 1}`
    setVariaveis((prev) => [...prev, { key, label: `Variável ${variaveis.length + 1}`, required: true }])
    // Insere no cursor
    editor?.commands.insertContent(`{${key}} `)
    editor?.commands.focus()
  }, [variaveis, editor])

  const removerVariavel = useCallback((key: string) => {
    setVariaveis((prev) => prev.filter((v) => v.key !== key))
  }, [])

  async function handleSave() {
    if (!titulo.trim() || !editor) return
    setSaving(true)
    try {
      await onSave({ titulo: titulo.trim(), categoria, conteudo: editor.getHTML(), variaveis })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!editor) return null

  return (
    <Modal open={open} onClose={onClose} title={template ? 'Editar Template' : 'Novo Template'} maxWidth="72rem" noPadding>
      <div className="flex flex-col" style={{ height: '82vh' }}>
        {/* ── Metadados ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-3">
          <div className="flex flex-1 flex-col gap-1 min-w-[200px]">
            <label className="text-xs uppercase tracking-wide text-gray-500">Título</label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Contrato de Honorários" />
          </div>
          <div className="flex flex-col gap-1 w-48">
            <label className="text-xs uppercase tracking-wide text-gray-500">Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as TemplateCategoria)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {(Object.keys(TEMPLATE_CATEGORIA_LABELS) as TemplateCategoria[]).map((k) => (
                <option key={k} value={k}>{TEMPLATE_CATEGORIA_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 justify-end">
            <label className="text-xs uppercase tracking-wide text-gray-500 invisible">Importar</label>
            <Button variant="outline" onClick={() => setShowDrivePicker(true)} title="Importar de Google Drive ou OneDrive">
              <CloudUpload className="mr-2 h-4 w-4" />
              Importar do Drive
            </Button>
          </div>
        </div>

        {/* Drive Picker */}
        <DrivePickerModal
          open={showDrivePicker}
          onClose={() => setShowDrivePicker(false)}
          onImport={(html) => {
            editor?.commands.setContent(html)
            editor?.commands.focus()
            setShowDrivePicker(false)
          }}
        />

        {/* ── Corpo: editor + painel de variáveis ────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-gray-50 px-3 py-2">
              <button className={editor.isActive('bold')        ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito"><Bold className="h-4 w-4" /></button>
              <button className={editor.isActive('italic')      ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico"><Italic className="h-4 w-4" /></button>
              <button className={editor.isActive('underline')   ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado"><UnderlineIcon className="h-4 w-4" /></button>
              <div className="mx-1.5 h-4 w-px bg-gray-200" />
              <button className={editor.isActive('heading', { level: 1 }) ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1"><Heading1 className="h-4 w-4" /></button>
              <button className={editor.isActive('heading', { level: 2 }) ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2"><Heading2 className="h-4 w-4" /></button>
              <div className="mx-1.5 h-4 w-px bg-gray-200" />
              <button className={editor.isActive({ textAlign: 'left' })   ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Alinhar à esquerda"><AlignLeft className="h-4 w-4" /></button>
              <button className={editor.isActive({ textAlign: 'center' }) ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centralizar"><AlignCenter className="h-4 w-4" /></button>
              <button className={editor.isActive({ textAlign: 'right' })  ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Alinhar à direita"><AlignRight className="h-4 w-4" /></button>
              <div className="mx-1.5 h-4 w-px bg-gray-200" />
              <button className={editor.isActive('bulletList')  ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista"><List className="h-4 w-4" /></button>
              <button className={editor.isActive('orderedList') ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada"><ListOrdered className="h-4 w-4" /></button>
            </div>

            {/* Área de edição */}
            <div className="flex-1 overflow-y-auto">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Painel de variáveis */}
          <div className="flex w-64 flex-col border-l border-gray-100 bg-gray-50/50 overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Variáveis</span>
              <button
                onClick={adicionarVariavel}
                className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                title="Adicionar variável"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {variaveis.length === 0 ? (
                <p className="text-xs text-gray-400 text-center mt-4">
                  Digite <code className="bg-gray-100 px-1 rounded">{'{variavel}'}</code> no texto para criar variáveis.
                </p>
              ) : (
                variaveis.map((v) => (
                  <div key={v.key} className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => inserirVariavel(v.key)}
                        className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700 hover:bg-gray-200"
                        title="Inserir no cursor"
                      >
                        {`{${v.key}}`}
                      </button>
                      <button
                        onClick={() => removerVariavel(v.key)}
                        className="rounded p-0.5 text-gray-300 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <Input
                      value={v.label}
                      onChange={(e) =>
                        setVariaveis((prev) =>
                          prev.map((x) => (x.key === v.key ? { ...x, label: e.target.value } : x)),
                        )
                      }
                      placeholder="Label do campo"
                      className="text-xs"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500">
                      <input
                        type="checkbox"
                        checked={v.required}
                        onChange={(e) =>
                          setVariaveis((prev) =>
                            prev.map((x) => (x.key === v.key ? { ...x, required: e.target.checked } : x)),
                          )
                        }
                        className="rounded"
                      />
                      Obrigatório
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !titulo.trim()}
            style={{ backgroundColor: '#721011' }}
            className="text-white hover:opacity-90"
          >
            {saving ? 'Salvando...' : 'Salvar Template'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Util: 'nome_cliente' → 'Nome Cliente' ─────────────────────────────────────
function formatKeyAsLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

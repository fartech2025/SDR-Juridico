import React, { useEffect, useCallback, useRef } from 'react'
import { Extension } from '@tiptap/core'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import FontFamily from '@tiptap/extension-font-family'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import {
  Bold, Italic, UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Heading1, Heading2, Heading3, Plus, Trash2,
  CloudUpload, ImageIcon, Table2, ChevronDown, Type,
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
  VariavelTipo,
} from '@/types/documentoTemplate'
import { TEMPLATE_CATEGORIA_LABELS, VARIAVEL_TIPO_LABELS } from '@/types/documentoTemplate'

// ── Custom FontSize extension (extends TextStyle attributes) ──────────────────
const FontSizeExtension = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, string | null>) => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
})

// ── Color palettes ────────────────────────────────────────────────────────────
const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#ffffff',
  '#721011', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#4a86e8',
]
const HIGHLIGHT_COLORS = [
  '#ffff00', '#00ff00', '#00ffff', '#ff9900', '#ff0000', '#9900ff',
  '#ffd966', '#e06666',
]
const FONT_SIZES = [
  { label: 'Pequeno', value: '11px' },
  { label: 'Normal',  value: '13px' },
  { label: 'Grande',  value: '15px' },
  { label: 'Maior',   value: '18px' },
]

// ── Campos sugeridos para inserção rápida ────────────────────────────────────
interface CampoSugerido {
  key: string
  label: string
  tipo: VariavelTipo
  required: boolean
  defaultValue?: string
  options?: string[]
}

const CAMPOS_SUGERIDOS: CampoSugerido[] = [
  { key: 'nome_cliente',     label: 'Nome do cliente',      tipo: 'texto',  required: true  },
  { key: 'cpf_cliente',      label: 'CPF do cliente',       tipo: 'cpf',    required: true  },
  { key: 'cnpj_cliente',     label: 'CNPJ do cliente',      tipo: 'cnpj',   required: false },
  { key: 'numero_processo',  label: 'Número do processo',   tipo: 'texto',  required: false },
  { key: 'tribunal',         label: 'Tribunal',             tipo: 'texto',  required: false },
  { key: 'area',             label: 'Área jurídica',        tipo: 'texto',  required: false },
  { key: 'data_contrato',    label: 'Data do contrato',     tipo: 'data',   required: true,  defaultValue: '$hoje' },
  { key: 'cidade',           label: 'Cidade',               tipo: 'texto',  required: false },
  { key: 'nome_advogado',    label: 'Nome do advogado',     tipo: 'texto',  required: false, defaultValue: '$advogado' },
  { key: 'oab',              label: 'OAB',                  tipo: 'texto',  required: false },
  { key: 'nome_escritorio',  label: 'Nome do escritório',   tipo: 'texto',  required: false, defaultValue: '$org' },
  { key: 'valor_honorarios', label: 'Valor dos honorários', tipo: 'moeda',  required: true  },
  { key: 'forma_pagamento',  label: 'Forma de pagamento',   tipo: 'select', required: false, options: ['À vista', 'Parcelado', 'Mensal'] },
  { key: 'prazo',            label: 'Prazo',                tipo: 'texto',  required: false },
  { key: 'objeto',           label: 'Objeto do contrato',   tipo: 'texto',  required: false },
]

// Converte label em chave interna: "Nome do cliente" → "nome_do_cliente"
function labelToKey(label: string): string {
  return label
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
    .replace(/\s+/g, '_').slice(0, 30) || 'campo'
}

// ── Toolbar button classes ─────────────────────────────────────────────────────
const TB = 'rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-30'
const TB_ACTIVE = `${TB} bg-gray-200 text-gray-900`

interface Props {
  open: boolean
  onClose: () => void
  template?: DocumentoTemplate | null
  onSave: (input: DocumentoTemplateCreateInput) => Promise<void>
}

export function TemplateEditorModal({ open, onClose, template, onSave }: Props) {
  // ── Core state ───────────────────────────────────────────────────────────────
  const [titulo, setTitulo]         = React.useState('')
  const [categoria, setCategoria]   = React.useState<TemplateCategoria>('contrato')
  const [variaveis, setVariaveis]   = React.useState<TemplateVariavel[]>([])
  const [saving, setSaving]         = React.useState(false)
  const [showDrivePicker, setShowDrivePicker] = React.useState(false)

  // ── Toolbar dropdown states ─────────────────────────────────────────────────
  const [showFontSize, setShowFontSize]     = React.useState(false)
  const [showColor, setShowColor]           = React.useState(false)
  const [showHighlight, setShowHighlight]   = React.useState(false)
  const [showTablePicker, setShowTablePicker] = React.useState(false)
  const [tableHover, setTableHover]         = React.useState({ r: 0, c: 0 })
  const [colorInput, setColorInput]         = React.useState('#000000')

  // ── Painel "Inserir Campo" ───────────────────────────────────────────────────
  const [showInsertField, setShowInsertField]     = React.useState(false)
  const [newFieldLabel, setNewFieldLabel]         = React.useState('')
  const [newFieldTipo, setNewFieldTipo]           = React.useState<VariavelTipo>('texto')
  const [newFieldRequired, setNewFieldRequired]   = React.useState(true)

  // ── Image dialog state ──────────────────────────────────────────────────────
  const [showImgDialog, setShowImgDialog] = React.useState(false)
  const [imgMode, setImgMode]             = React.useState<'url' | 'upload'>('url')
  const [imgUrl, setImgUrl]               = React.useState('')
  const imgFileRef                        = useRef<HTMLInputElement>(null)

  // ── Close all dropdowns helper ──────────────────────────────────────────────
  const closeAll = useCallback(() => {
    setShowFontSize(false)
    setShowColor(false)
    setShowHighlight(false)
    setShowTablePicker(false)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function onDocClick() { closeAll() }
    if (showFontSize || showColor || showHighlight || showTablePicker) {
      document.addEventListener('click', onDocClick, true)
      return () => document.removeEventListener('click', onDocClick, true)
    }
  }, [showFontSize, showColor, showHighlight, showTablePicker, closeAll])

  // ── Editor ─────────────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      Placeholder.configure({ placeholder: 'Escreva o conteúdo do template aqui...' }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily.configure({ types: ['textStyle'] }),
      FontSizeExtension,
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    onUpdate({ editor: ed }) {
      const html  = ed.getHTML()
      const found = extractVariables(html)
      setVariaveis((prev) => {
        const existingKeys = new Set(prev.map((v) => v.key))
        const novos: TemplateVariavel[] = found
          .filter((k) => !existingKeys.has(k))
          .map((k) => ({ key: k, label: formatKeyAsLabel(k), required: true, tipo: 'texto' }))
        const atuais = prev.filter((v) => found.includes(v.key))
        return [...atuais, ...novos]
      })
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[900px]',
      },
    },
  })

  // ── Populate editor when opening ─────────────────────────────────────────────
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

  // ── Variable helpers ─────────────────────────────────────────────────────────
  const inserirVariavel = useCallback((key: string) => {
    editor?.chain().focus().insertContent(`{${key}}`).run()
  }, [editor])

  const adicionarVariavel = useCallback(() => {
    const key = `variavel_${variaveis.length + 1}`
    setVariaveis((prev) => [
      ...prev,
      { key, label: `Variável ${prev.length + 1}`, required: true, tipo: 'texto' },
    ])
    editor?.chain().focus().insertContent(`{${key}} `).run()
  }, [variaveis.length, editor])

  const removerVariavel = useCallback((key: string) => {
    setVariaveis((prev) => prev.filter((v) => v.key !== key))
  }, [])

  const updateVariavel = useCallback((key: string, patch: Partial<TemplateVariavel>) => {
    setVariaveis((prev) => prev.map((v) => v.key === key ? { ...v, ...patch } : v))
  }, [])

  // Insere campo (sugerido ou personalizado) no editor e no painel
  const inserirCampo = useCallback((campo: CampoSugerido) => {
    setVariaveis((prev) => {
      if (prev.some((v) => v.key === campo.key)) return prev
      return [...prev, { key: campo.key, label: campo.label, tipo: campo.tipo, required: campo.required, defaultValue: campo.defaultValue, options: campo.options }]
    })
    editor?.chain().focus().insertContent(`{${campo.key}}`).run()
    setShowInsertField(false)
  }, [editor])

  const inserirCampoPersonalizado = useCallback(() => {
    if (!newFieldLabel.trim()) return
    const base = labelToKey(newFieldLabel)
    const key  = variaveis.some((v) => v.key === base) ? `${base}_${variaveis.length}` : base
    inserirCampo({ key, label: newFieldLabel.trim(), tipo: newFieldTipo, required: newFieldRequired })
    setNewFieldLabel('')
    setNewFieldTipo('texto')
    setNewFieldRequired(true)
  }, [newFieldLabel, newFieldTipo, newFieldRequired, variaveis, inserirCampo])

  // ── Font size ─────────────────────────────────────────────────────────────────
  const applyFontSize = (size: string) => {
    editor?.chain().focus().setMark('textStyle', { fontSize: size }).run()
    setShowFontSize(false)
  }

  // ── Image insertion ──────────────────────────────────────────────────────────
  async function handleInsertImage() {
    if (imgMode === 'url' && imgUrl.trim()) {
      editor?.commands.setImage({ src: imgUrl.trim() })
    } else if (imgMode === 'upload' && imgFileRef.current?.files?.[0]) {
      const file = imgFileRef.current.files[0]
      const base64 = await fileToBase64(file)
      editor?.commands.setImage({ src: base64 })
    }
    setShowImgDialog(false)
    setImgUrl('')
    editor?.commands.focus()
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
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
      <div className="flex flex-col" style={{ height: '88vh' }}>

        {/* ── Metadata bar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-3">
          <div className="flex flex-1 flex-col gap-1 min-w-[200px]">
            <label className="text-xs uppercase tracking-wide text-gray-500">Título</label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Contrato de Honorários" />
          </div>
          <div className="flex flex-col gap-1 w-44">
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
            <Button variant="outline" onClick={() => setShowDrivePicker(true)}>
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
            editor.commands.setContent(html)
            editor.commands.focus()
            setShowDrivePicker(false)
          }}
        />

        {/* ── Body: editor + variable panel ────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Editor column ─────────────────────────────────────────────────── */}
          <div className="flex flex-1 flex-col overflow-hidden min-w-0">

            {/* Toolbar */}
            <div
              className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-gray-50 px-3 py-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bold / Italic / Underline */}
              <button className={editor.isActive('bold')      ? TB_ACTIVE : TB} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito"><Bold className="h-4 w-4" /></button>
              <button className={editor.isActive('italic')    ? TB_ACTIVE : TB} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico"><Italic className="h-4 w-4" /></button>
              <button className={editor.isActive('underline') ? TB_ACTIVE : TB} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado"><UnderlineIcon className="h-4 w-4" /></button>

              <div className="mx-1.5 h-4 w-px bg-gray-200" />

              {/* Headings */}
              <button className={editor.isActive('heading', { level: 1 }) ? TB_ACTIVE : TB} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1"><Heading1 className="h-4 w-4" /></button>
              <button className={editor.isActive('heading', { level: 2 }) ? TB_ACTIVE : TB} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2"><Heading2 className="h-4 w-4" /></button>
              <button className={editor.isActive('heading', { level: 3 }) ? TB_ACTIVE : TB} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3"><Heading3 className="h-4 w-4" /></button>

              <div className="mx-1.5 h-4 w-px bg-gray-200" />

              {/* Font size */}
              <div className="relative">
                <button
                  className={`${TB} flex items-center gap-0.5 px-2`}
                  title="Tamanho da fonte"
                  onClick={(e) => { e.stopPropagation(); closeAll(); setShowFontSize((v) => !v) }}
                >
                  <Type className="h-3.5 w-3.5" />
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {showFontSize && (
                  <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg py-1 min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                    {FONT_SIZES.map((s) => (
                      <button
                        key={s.value}
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                        onClick={() => applyFontSize(s.value)}
                      >
                        {s.label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1 px-3 pb-1.5">
                      <p className="text-xs text-gray-400 mb-1">Personalizado</p>
                      <input
                        type="number"
                        placeholder="px"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') applyFontSize(`${(e.target as HTMLInputElement).value}px`)
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mx-1.5 h-4 w-px bg-gray-200" />

              {/* Text color */}
              <div className="relative">
                <button
                  className={`${TB} flex items-center gap-0.5 px-2`}
                  title="Cor do texto"
                  onClick={(e) => { e.stopPropagation(); closeAll(); setShowColor((v) => !v) }}
                >
                  <span className="font-bold text-sm leading-none" style={{ color: colorInput }}>A</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {showColor && (
                  <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg p-3 w-52" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs text-gray-400 mb-2">Cor do texto</p>
                    <div className="grid grid-cols-6 gap-1 mb-2">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c}
                          title={c}
                          className="h-6 w-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                          onClick={() => {
                            editor.chain().focus().setColor(c).run()
                            setColorInput(c)
                            setShowColor(false)
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        className="h-7 w-8 rounded cursor-pointer border border-gray-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                        maxLength={7}
                      />
                      <button
                        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                        onClick={() => { editor.chain().focus().setColor(colorInput).run(); setShowColor(false) }}
                      >
                        OK
                      </button>
                    </div>
                    <button
                      className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                      onClick={() => { editor.chain().focus().unsetColor().run(); setShowColor(false) }}
                    >
                      Remover cor
                    </button>
                  </div>
                )}
              </div>

              {/* Highlight */}
              <div className="relative">
                <button
                  className={`${TB} flex items-center gap-0.5 px-2`}
                  title="Realce"
                  onClick={(e) => { e.stopPropagation(); closeAll(); setShowHighlight((v) => !v) }}
                >
                  <span className="text-sm leading-none" style={{ backgroundColor: '#ffff00', padding: '0 2px' }}>A</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {showHighlight && (
                  <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg p-3" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs text-gray-400 mb-2">Realce</p>
                    <div className="grid grid-cols-4 gap-1">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <button
                          key={c}
                          title={c}
                          className="h-6 w-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                          onClick={() => {
                            editor.chain().focus().toggleHighlight({ color: c }).run()
                            setShowHighlight(false)
                          }}
                        />
                      ))}
                    </div>
                    <button
                      className="mt-2 text-xs text-gray-400 hover:text-gray-600 block"
                      onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlight(false) }}
                    >
                      Remover realce
                    </button>
                  </div>
                )}
              </div>

              <div className="mx-1.5 h-4 w-px bg-gray-200" />

              {/* Alignment */}
              <button className={editor.isActive({ textAlign: 'left' })   ? TB_ACTIVE : TB} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Esquerda"><AlignLeft className="h-4 w-4" /></button>
              <button className={editor.isActive({ textAlign: 'center' }) ? TB_ACTIVE : TB} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centro"><AlignCenter className="h-4 w-4" /></button>
              <button className={editor.isActive({ textAlign: 'right' })  ? TB_ACTIVE : TB} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Direita"><AlignRight className="h-4 w-4" /></button>

              <div className="mx-1.5 h-4 w-px bg-gray-200" />

              {/* Lists */}
              <button className={editor.isActive('bulletList')  ? TB_ACTIVE : TB} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista"><List className="h-4 w-4" /></button>
              <button className={editor.isActive('orderedList') ? TB_ACTIVE : TB} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numerada"><ListOrdered className="h-4 w-4" /></button>

              <div className="mx-1.5 h-4 w-px bg-gray-200" />

              {/* Table */}
              <div className="relative">
                <button
                  className={`${TB} flex items-center gap-0.5 px-2`}
                  title="Inserir tabela"
                  onClick={(e) => { e.stopPropagation(); closeAll(); setShowTablePicker((v) => !v) }}
                >
                  <Table2 className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
                {showTablePicker && (
                  <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg p-3" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs text-gray-400 mb-2">
                      {tableHover.r > 0 ? `${tableHover.r} × ${tableHover.c}` : 'Selecione tamanho'}
                    </p>
                    <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                      {Array.from({ length: 5 }, (_, ri) =>
                        Array.from({ length: 5 }, (_, ci) => (
                          <button
                            key={`${ri}-${ci}`}
                            className="h-6 w-6 rounded border transition-colors"
                            style={{
                              backgroundColor: ri < tableHover.r && ci < tableHover.c ? '#fecaca' : '#f3f4f6',
                              borderColor: ri < tableHover.r && ci < tableHover.c ? '#ef4444' : '#e5e7eb',
                            }}
                            onMouseEnter={() => setTableHover({ r: ri + 1, c: ci + 1 })}
                            onClick={() => {
                              editor.chain().focus().insertTable({ rows: tableHover.r, cols: tableHover.c, withHeaderRow: true }).run()
                              setShowTablePicker(false)
                              setTableHover({ r: 0, c: 0 })
                            }}
                          />
                        )),
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Image */}
              <button
                className={TB}
                title="Inserir imagem"
                onClick={(e) => { e.stopPropagation(); closeAll(); setShowImgDialog(true) }}
              >
                <ImageIcon className="h-4 w-4" />
              </button>

            </div>

            {/* Image dialog (inline, no separate Modal) */}
            {showImgDialog && (
              <div className="border-b border-gray-100 bg-amber-50/30 px-5 py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-gray-600">Inserir imagem:</span>
                  <div className="flex gap-2">
                    <button
                      className={`text-xs px-2 py-1 rounded ${imgMode === 'url' ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`}
                      onClick={() => setImgMode('url')}
                    >URL</button>
                    <button
                      className={`text-xs px-2 py-1 rounded ${imgMode === 'upload' ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`}
                      onClick={() => setImgMode('upload')}
                    >Upload</button>
                  </div>
                  {imgMode === 'url' ? (
                    <input
                      type="url"
                      value={imgUrl}
                      onChange={(e) => setImgUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 min-w-[200px] border border-gray-200 rounded px-3 py-1.5 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleInsertImage()}
                    />
                  ) : (
                    <input
                      ref={imgFileRef}
                      type="file"
                      accept="image/*"
                      className="text-sm"
                    />
                  )}
                  <Button size="sm" onClick={handleInsertImage}>Inserir</Button>
                  <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setShowImgDialog(false)}>✕</button>
                </div>
              </div>
            )}

            {/* A4 page container */}
            <div
              className="flex-1 overflow-auto"
              style={{ background: '#F3F4F6', padding: '24px 0' }}
            >
              <div
                style={{
                  width: 794,
                  minHeight: 1123,
                  margin: '0 auto',
                  background: 'white',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                  padding: '56px 72px',
                }}
              >
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {/* ── Variable panel ─────────────────────────────────────────────────── */}
          <div className="flex w-72 flex-col border-l border-gray-100 bg-gray-50/50 overflow-hidden shrink-0">

            {/* Cabeçalho do painel */}
            <div className="border-b border-gray-100 px-4 py-3 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Campos do documento</span>
              <button
                onClick={() => setShowInsertField((v) => !v)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition-colors ${
                  showInsertField
                    ? 'border-[#721011] bg-[rgba(114,16,17,0.05)] text-[#721011]'
                    : 'border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                Inserir Campo
              </button>
            </div>

            {/* Painel de inserção */}
            {showInsertField && (
              <div className="border-b border-gray-200 bg-white p-3 space-y-3">

                {/* Campos frequentes */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Campos frequentes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CAMPOS_SUGERIDOS
                      .filter((c) => !variaveis.some((v) => v.key === c.key))
                      .map((c) => (
                        <button
                          key={c.key}
                          onClick={() => inserirCampo(c)}
                          className="text-xs px-2 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-gray-700"
                        >
                          {c.label}
                        </button>
                      ))}
                    {CAMPOS_SUGERIDOS.every((c) => variaveis.some((v) => v.key === c.key)) && (
                      <p className="text-xs text-gray-400 italic">Todos os campos frequentes já foram inseridos.</p>
                    )}
                  </div>
                </div>

                {/* Campo personalizado */}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-500">Ou crie um campo personalizado</p>
                  <input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && inserirCampoPersonalizado()}
                    placeholder="Ex: Data da audiência"
                    autoFocus
                    className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[rgba(114,16,17,0.3)]"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={newFieldTipo}
                      onChange={(e) => setNewFieldTipo(e.target.value as VariavelTipo)}
                      className="flex-1 rounded border border-gray-200 bg-white px-2 py-1.5 text-xs"
                    >
                      {(Object.keys(VARIAVEL_TIPO_LABELS) as VariavelTipo[]).map((t) => (
                        <option key={t} value={t}>{VARIAVEL_TIPO_LABELS[t]}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="rounded"
                      />
                      Obrigatório
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={inserirCampoPersonalizado}
                      disabled={!newFieldLabel.trim()}
                      className="flex-1 rounded-md py-1.5 text-xs text-white disabled:opacity-40"
                      style={{ backgroundColor: '#721011' }}
                    >
                      Inserir
                    </button>
                    <button
                      onClick={() => { setShowInsertField(false); setNewFieldLabel('') }}
                      className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de campos */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {variaveis.length === 0 ? (
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-400">Nenhum campo adicionado ainda.</p>
                  <p className="text-xs text-gray-300 mt-1">Use o botão acima para inserir campos que serão preenchidos ao gerar o documento.</p>
                </div>
              ) : (
                variaveis.map((v) => (
                  <VariavelCard
                    key={v.key}
                    variavel={v}
                    onInsert={() => inserirVariavel(v.key)}
                    onRemove={() => removerVariavel(v.key)}
                    onUpdate={(patch) => updateVariavel(v.key, patch)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────────── */}
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

// ── Variable card (sub-component) ─────────────────────────────────────────────
interface VariavelCardProps {
  variavel: TemplateVariavel
  onInsert: () => void
  onRemove: () => void
  onUpdate: (patch: Partial<TemplateVariavel>) => void
}

function VariavelCard({ variavel: v, onInsert, onRemove, onUpdate }: VariavelCardProps) {
  const tipo = v.tipo ?? 'texto'

  // Traduz defaultValue técnico para texto amigável
  const autoFillInfo =
    v.defaultValue === '$hoje'        ? 'Preenche automaticamente com a data de hoje'
    : v.defaultValue === '$advogado'  ? 'Preenche automaticamente com o nome do advogado'
    : v.defaultValue === '$org'       ? 'Preenche automaticamente com o nome do escritório'
    : v.defaultValue === '$responsavel' ? 'Preenche automaticamente com o responsável do caso'
    : null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
      {/* Nome do campo + excluir */}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={v.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Nome do campo"
          className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[rgba(114,16,17,0.3)]"
        />
        <button onClick={onRemove} className="rounded p-1 text-gray-300 hover:text-red-400 shrink-0" title="Remover campo">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tipo + Obrigatório na mesma linha */}
      <div className="flex items-center gap-2">
        <select
          value={tipo}
          onChange={(e) => onUpdate({ tipo: e.target.value as VariavelTipo })}
          className="flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600"
        >
          {(Object.keys(VARIAVEL_TIPO_LABELS) as VariavelTipo[]).map((t) => (
            <option key={t} value={t}>{VARIAVEL_TIPO_LABELS[t]}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap cursor-pointer">
          <input
            type="checkbox"
            checked={v.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="rounded"
          />
          Obrigatório
        </label>
      </div>

      {/* Opções (só para Lista) */}
      {tipo === 'select' && (
        <div>
          <p className="text-xs text-gray-400 mb-1">Opções disponíveis (uma por linha):</p>
          <textarea
            value={(v.options ?? []).join('\n')}
            onChange={(e) => onUpdate({ options: e.target.value.split('\n').filter((o) => o.trim()) })}
            placeholder={"À vista\nParcelado\nMensal"}
            rows={3}
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs resize-none"
          />
        </div>
      )}

      {/* Info de preenchimento automático */}
      {autoFillInfo && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <span>✓</span> {autoFillInfo}
        </p>
      )}

      {/* Botão re-inserir no texto */}
      <button
        onClick={onInsert}
        className="w-full rounded border border-dashed border-gray-200 py-1 text-xs text-gray-400 hover:border-gray-300 hover:text-gray-600"
        title="Clique para inserir este campo onde o cursor estiver no texto"
      >
        Inserir no texto
      </button>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatKeyAsLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

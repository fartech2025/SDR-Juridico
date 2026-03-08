import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Scale,
  Target,
  Database,
  FileCode,
  Clock,
  Newspaper,
  CheckCircle2,
  ArrowRight,
  Star,
  Zap,
  Briefcase,
  Users,
  Activity,
} from 'lucide-react'

const LOGO_URL = 'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/Imagens%20pagina/talent%20jud%2003.png'

// Paleta — branco + vermelho borgonha + dourado. SEM preto.
const C = {
  dark:      '#4A0B0C',   // borgonha escuro — fundos premium
  brand:     '#721011',   // vermelho principal
  brandMid:  '#8B1415',   // vermelho médio (gradientes)
  gold:      '#A66029',   // dourado canônico
  goldLight: '#CC8652',   // dourado claro
  warm:      '#FAF3F3',   // branco quente — fundos claros
  ice:       '#F5E6E6',   // rosé suave — bordas claras
  steel:     '#6B5E58',   // cinza borgonha — texto secundário claro
  silver:    '#C9A0A0',   // rosé acinzentado — texto muted em fundo escuro
  white:     '#ffffff',
}

// ── PlanCard ──────────────────────────────────────────────────────────────────
interface PlanCardProps {
  tier: string
  price: string
  priceSub: string
  desc: string
  features: string[]
  cta: string
  onCta?: () => void
  ctaHref?: string
  featured?: boolean
  darkBg?: boolean
  badge?: string
}

function PlanCard({ tier, price, priceSub, desc, features, cta, ctaHref, featured, darkBg, badge }: PlanCardProps) {
  const bg          = darkBg ? C.dark  : C.white
  const textColor   = darkBg ? C.warm  : '#1a1010'
  const mutedColor  = darkBg ? C.silver: C.steel
  const borderColor = darkBg ? C.brand : C.ice

  return (
    <div style={{
      background: bg,
      border: `1px solid ${borderColor}`,
      borderRadius: 20,
      padding: '32px 28px',
      position: 'relative',
      boxShadow: featured
        ? '0 20px 60px rgba(114,16,17,0.22)'
        : '0 2px 16px rgba(114,16,17,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }}>
      {badge && (
        <div style={{
          position: 'absolute',
          top: -14,
          left: '50%',
          transform: 'translateX(-50%)',
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          padding: '4px 16px',
          borderRadius: 999,
        }}>
          <span style={{ color: C.dark }}>{badge}</span>
        </div>
      )}

      <div>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
          <span style={{ color: darkBg ? '#e8c97a' : C.brand }}>{tier}</span>
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 40, fontWeight: 800, color: darkBg ? '#e8c97a' : C.brand, fontFamily: 'DM Sans, sans-serif' }}>
            {price}
          </span>
          <span style={{ fontSize: 14, color: darkBg ? 'rgba(255,255,255,0.6)' : mutedColor, paddingBottom: 6 }}>{priceSub}</span>
        </div>
        <p style={{ fontSize: 14, marginTop: 6 }}>
          <span style={{ color: darkBg ? 'rgba(255,255,255,0.7)' : mutedColor }}>{desc}</span>
        </p>
      </div>

      <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
            <CheckCircle2 style={{ width: 16, height: 16, color: darkBg ? '#e8c97a' : C.brand, flexShrink: 0, marginTop: 2 }} />
            <span style={{ color: darkBg ? '#ffffff' : textColor }}>{f}</span>
          </li>
        ))}
      </ul>

      {ctaHref ? (
        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '14px 0',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            ...(darkBg
              ? { background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` }
              : { border: `2px solid ${C.brand}`, background: 'transparent' }),
          }}
        >
          <span style={{ color: darkBg ? C.dark : C.brand }}>{cta}</span>
        </a>
      ) : (
        <Link
          to="/login"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '14px 0',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            ...(featured
              ? { background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` }
              : { border: `2px solid ${C.brand}`, background: 'transparent' }),
          }}
        >
          <span style={{ color: featured ? C.dark : C.brand }}>{cta}</span>
        </Link>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUÇÕES PARA INSERIR SCREENSHOTS
//
// 1. Tire os prints das telas do sistema em http://localhost:5173 (ou produção)
//    com zoom do navegador em 100% e janela em tela cheia (~1280px de largura).
//
// 2. Faça o upload das imagens no Supabase Storage:
//    → Projeto: xocqcoebreoiaqxoutar
//    → Bucket: "Imagens Page"  (já existe e é público)
//    → Pasta:  screenshots/
//    → Formato sugerido: PNG, resolução mínima 1280×720px
//
// 3. Cada chave abaixo corresponde a uma tela específica do sistema:
//
//    HERO (tela inicial — cards flutuantes à direita do headline)
//    ├── hero_main   → Dashboard completo (/app/dashboard)
//    │                 Ideal: mostrar KPIs, gráfico de casos e lista de atividades
//    └── hero_card_a → Lista de Casos (/app/casos)
//                      Ideal: mostrar tabela com processos, status coloridos e filtros
//
//    SHOWCASE (seção "Veja o sistema em ação" — aba por aba)
//    ├── casos         → Página de Casos (/app/casos)
//    │                   Mostrar lista com números CNJ, área, status e responsável
//    ├── leads         → Pipeline de Leads (/app/leads)
//    │                   Mostrar Kanban com colunas Novo / Contato / Proposta / Fechado
//    ├── datajud       → Consulta DataJud (/app/datajud)
//    │                   Mostrar resultado de busca por CPF com lista de processos
//    ├── templates     → Editor de Templates (/app/templates ou modal aberto)
//    │                   Mostrar editor TipTap com variáveis {{nome}} destacadas
//    ├── timesheet     → Timesheet (/app/timesheet)
//    │                   Mostrar tabela de lançamentos com horas, caso e valor
//    ├── diario        → Diário Oficial (/app/diario-oficial)
//    │                   Mostrar lista de publicações com destaque de CPF encontrado
//    ├── controle      → Detalhe de Caso (/app/casos/[id]) ou Kanban de casos
//    │                   Mostrar drawer/detalhe com prazo, área, movimentações
//    ├── clientes      → Gestão de Clientes (/app/clientes)
//    │                   Mostrar lista com score de saúde, área e responsável
//    └── monitoramento → Qualquer tela de alertas/monitoramento
//                        Mostrar painel com alertas recentes por CPF/CNPJ
//
// 4. Após o upload, as URLs já ficam ativas automaticamente — não é necessário
//    alterar nenhuma linha de código, pois os paths já estão configurados abaixo.
// ─────────────────────────────────────────────────────────────────────────────
const SCREENSHOTS = {
  casos:      'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/screenshots/casos.png',
  leads:      'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/screenshots/leads.png',
  datajud:    'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/screenshots/datajud.png',
  templates:  'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/screenshots/templates.png',
  timesheet:  'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/screenshots/timesheet.png',
  diario:     'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/screenshots/diario.png',
  controle:   'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/screenshots/controle-casos.png',
  clientes:   'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/screenshots/clientes.png',
  monitoramento: 'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/screenshots/monitoramento.png',
  // Hero floating cards
  hero_main:   'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/screenshots/hero-dashboard.png',
  hero_card_a: 'https://xocqcoebreoiaqxoutar.supabase.co/storage/v1/object/public/Imagens%20Page/screenshots/hero-casos.png',
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function LandingPage() {
  const [activeFeature, setActiveFeature] = React.useState(0)

  const features = [
    { icon: Scale,     title: 'Gestão de Casos',      desc: 'Controle completo do ciclo de vida dos processos jurídicos com prioridades, prazos e histórico.' },
    { icon: Target,    title: 'CRM de Leads',          desc: 'Pipeline visual de prospecção com qualificação automática, follow-up e conversão integrada.' },
    { icon: Database,  title: 'DataJud CNJ',           desc: 'Consulta direta à Base Nacional de Dados do Poder Judiciário — 28 tribunais, busca por CPF, número e classe.' },
    { icon: FileCode,  title: 'Templates Jurídicos',   desc: 'Editor de documentos com variáveis dinâmicas, branding do escritório e exportação para Drive.' },
    { icon: Clock,     title: 'Timesheet',             desc: 'Controle de horas faturáveis por caso, geração automática de honorários e relatórios.' },
    { icon: Newspaper, title: 'Diário Oficial',        desc: 'Monitoramento automático de publicações no Diário Oficial com alertas por CPF e CNPJ.' },
  ]

  const stats = [
    { value: '500+',  label: 'Processos monitorados' },
    { value: '28',    label: 'Tribunais integrados'  },
    { value: '99,9%', label: 'Uptime garantido'      },
    { value: '3min',  label: 'Setup inicial'         },
  ]

  const showcaseFeatures = [
    {
      id: 'casos',
      label: 'Casos',
      icon: Scale,
      eyebrow: 'Gestão Jurídica',
      title: 'Controle total dos seus processos',
      desc: 'Acompanhe cada processo do início ao fim com timeline completa, prioridades automáticas por área jurídica e vinculação direta com o DataJud CNJ.',
      bullets: [
        'Timeline de movimentações em tempo real',
        'Priorização por urgência, área e prazo',
        'Vinculação automática com processos DataJud',
        'Histórico completo de atividades e responsáveis',
        'Soft delete com auditoria — nenhum dado é perdido',
      ],
      image: SCREENSHOTS.casos,
    },
    {
      id: 'leads',
      label: 'CRM de Leads',
      icon: Target,
      eyebrow: 'Prospecção',
      title: 'Pipeline que converte mais clientes',
      desc: 'Gerencie sua captação com pipeline visual, qualificação por temperatura, follow-up automatizado e conversão direta em caso jurídico com um clique.',
      bullets: [
        'Pipeline Kanban com drag & drop',
        'Qualificação por temperatura (Quente / Morno / Frio)',
        'Conversão de lead em cliente e caso em um clique',
        'Histórico de interações e próximas ações',
        'Filtros por status, calor e responsável',
      ],
      image: SCREENSHOTS.leads,
    },
    {
      id: 'datajud',
      label: 'DataJud CNJ',
      icon: Database,
      eyebrow: 'Integração Nacional',
      title: 'Consulta a 28 tribunais em segundos',
      desc: 'Busque processos por CPF, número CNJ ou nome diretamente na Base Nacional de Dados do Poder Judiciário — sem autenticação, sem custo extra.',
      bullets: [
        'Pesquisa por CPF, número CNJ ou classe processual',
        'Cobertura de todos os 28 tribunais integrados',
        'Importação automática de casos encontrados',
        'Importação automática para casos com área pré-definida',
        'Movimentações e histórico completo do processo',
      ],
      image: SCREENSHOTS.datajud,
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: FileCode,
      eyebrow: 'Documentos & Branding',
      title: 'Documentos com a identidade do escritório',
      desc: 'Crie modelos reutilizáveis com variáveis dinâmicas, editor rico TipTap, marca d\'água automática e exportação direta para Google Drive ou OneDrive.',
      bullets: [
        'Editor completo com tabelas, imagens e formatação',
        'Variáveis dinâmicas: nome, CPF, data, valor...',
        'Branding com logo e marca d\'água automática',
        'Exportação PDF com upload direto para o Drive',
        'Geração em lote para múltiplos clientes',
      ],
      image: SCREENSHOTS.templates,
    },
    {
      id: 'timesheet',
      label: 'Timesheet',
      icon: Clock,
      eyebrow: 'Horas & Honorários',
      title: 'Cada hora faturada com precisão',
      desc: 'Registre horas por caso, gere lançamentos de honorários automaticamente e apresente relatórios detalhados de produtividade para seus clientes.',
      bullets: [
        'Registro de horas por caso e advogado responsável',
        'Faturamento automático com criação de lançamento',
        'Relatórios por período, caso e profissional',
        'Integração com o módulo Financeiro',
        'Exportação para apresentação ao cliente',
      ],
      image: SCREENSHOTS.timesheet,
    },
    {
      id: 'diario',
      label: 'Diário Oficial',
      icon: Newspaper,
      eyebrow: 'Monitoramento Automático',
      title: 'Nunca perca uma publicação importante',
      desc: 'Monitoramento automático do Diário Oficial da União com alertas por CPF e CNPJ cadastrados — publicações indexadas diariamente sem intervenção manual.',
      bullets: [
        'Indexação diária do DOU (todas as seções)',
        'Alertas por CPF e CNPJ dos seus clientes',
        'Busca por texto completo nas publicações',
        'Histórico de publicações por cliente',
        'Vinculação de publicações a casos ativos',
      ],
      image: SCREENSHOTS.diario,
    },
    {
      id: 'controle',
      label: 'Controle de Casos',
      icon: Briefcase,
      eyebrow: 'Gestão Avançada',
      title: 'Visão completa de cada processo',
      desc: 'Controle detalhado do ciclo de vida de cada caso: status, prazo fatal, área jurídica, honorários vinculados, movimentações DataJud e toda a documentação em um só lugar.',
      bullets: [
        'Painel de status com prazo fatal destacado',
        'Área jurídica com derivação automática pelo DataJud',
        'Vinculação de documentos, timesheet e financeiro',
        'Movimentações processuais importadas em tempo real',
        'Kanban de casos por status e responsável',
      ],
      image: SCREENSHOTS.controle,
    },
    {
      id: 'clientes',
      label: 'Gestão de Clientes',
      icon: Users,
      eyebrow: 'CRM · Base de Clientes',
      title: 'Conheça cada cliente em profundidade',
      desc: 'Cadastro completo de clientes PF e PJ com histórico de casos, documentos, score de saúde do relacionamento e análise inteligente via Waze Jurídico.',
      bullets: [
        'Perfil completo PF e PJ com CPF/CNPJ',
        'Score de saúde do relacionamento (0–100)',
        'Histórico de todos os casos e documentos',
        'Análise de processos vinculados via DataJud CNJ',
        'Filtros por área, responsável, status e saúde',
      ],
      image: SCREENSHOTS.clientes,
    },
    {
      id: 'monitoramento',
      label: 'Monitoramento',
      icon: Activity,
      eyebrow: 'Alertas & Rastreamento',
      title: 'Seu escritório nunca dorme',
      desc: 'Central de monitoramento unificado: DataJud, Diário Oficial, Portal Transparência e Querido Diário em um só painel — alertas automáticos para cada cliente cadastrado.',
      bullets: [
        'Painel unificado de alertas por cliente e CPF',
        'Cruzamento DataJud + DOU + Portal Transparência',
        'Notificações de novas movimentações processuais',
        'Histórico de monitoramento com timestamps',
        'Analytics executivo de alertas por período',
      ],
      image: SCREENSHOTS.monitoramento,
    },
  ]

  return (
    <div id="sdr-landing" style={{ color: C.dark }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        #sdr-landing * { box-sizing: border-box; }
        #sdr-landing h1 { color: inherit !important; font-weight: inherit !important; }
        #sdr-landing h2 { color: inherit !important; font-weight: inherit !important; }
        #sdr-landing h3 { color: inherit !important; font-weight: inherit !important; }
        #sdr-landing p  { color: inherit !important; }
        #sdr-landing li { color: inherit !important; }
        #sdr-landing a  { color: inherit !important; text-decoration: none; }
        @keyframes float-a { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
        @keyframes float-b { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-7px)} }
        @keyframes float-c { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-13px)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes hero-grid-scroll { from{background-position:0 0} to{background-position:40px 40px} }
        .hero-float-a { animation: float-a 4s ease-in-out infinite; }
        .hero-float-b { animation: float-b 5s ease-in-out infinite 0.8s; }
        .hero-float-c { animation: float-c 3.5s ease-in-out infinite 1.5s; }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.ice}`,
        padding: '0 32px',
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'DM Sans, sans-serif',
        color: C.dark,
        boxShadow: '0 2px 16px rgba(114,16,17,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={LOGO_URL} alt="TalentJUD" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div className="landing-nav-links" style={{ display: 'flex', gap: 28 }}>
            {['Funcionalidades', 'Preços', 'Sobre'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                style={{ color: C.steel, fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.brand)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.steel)}
              >
                {item}
              </a>
            ))}
          </div>
          <Link
            to="/login"
            style={{
              background: `linear-gradient(135deg, ${C.brand}, ${C.dark})`,
              padding: '9px 22px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <span style={{ color: C.warm }}>Entrar</span>
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.dark} 0%, #6B0E0F 60%, ${C.brand} 100%)`,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '100px 48px 80px',
        fontFamily: 'DM Sans, sans-serif',
        color: C.warm,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dot grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        {/* Glow orb top-right */}
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 480, height: 480,
          borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(circle, rgba(204,134,82,0.18) 0%, transparent 65%)',
        }} />
        {/* Glow orb bottom-left */}
        <div style={{
          position: 'absolute', bottom: -120, left: -60, width: 400, height: 400,
          borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(circle, rgba(114,16,17,0.35) 0%, transparent 70%)',
        }} />

        <div style={{
          maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 64, alignItems: 'center',
        }}>

          {/* ── LEFT: copy ── */}
          <div>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(204,134,82,0.15)',
              border: '1px solid rgba(204,134,82,0.35)',
              borderRadius: 999, padding: '6px 16px', marginBottom: 32,
            }}>
              <Zap style={{ width: 13, height: 13, color: '#e8c97a' }} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                <span style={{ color: '#e8c97a' }}>Gestão Jurídica com IA</span>
              </span>
            </div>

            <h1 style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(38px, 5vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.08,
              marginBottom: 24,
              letterSpacing: '-0.02em',
            }}>
              <span style={{ color: '#ffffff' }}>O sistema jurídico que</span>
              <br />
              <span style={{ color: '#e8c97a' }}>trabalha enquanto</span>
              <br />
              <span style={{ color: '#ffffff' }}>você advoga.</span>
            </h1>

            <p style={{ fontSize: 18, lineHeight: 1.65, marginBottom: 36, maxWidth: 460 }}>
              <span style={{ color: 'rgba(255,255,255,0.72)' }}>CRM de leads, gestão de casos, DataJud CNJ, templates com branding e IA que analisa processos — tudo em um só lugar.</span>
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 36 }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
                  padding: '15px 30px', borderRadius: 12,
                  fontSize: 15, fontWeight: 700,
                  boxShadow: '0 8px 28px rgba(201,168,76,0.35)',
                }}
              >
                <span style={{ color: C.dark }}>Começar 14 dias grátis</span>
                <ArrowRight style={{ width: 17, height: 17, color: C.dark }} />
              </Link>
              <a
                href="#showcase"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  padding: '15px 28px', borderRadius: 12,
                  fontSize: 15, fontWeight: 600, background: 'rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span style={{ color: '#ffffff' }}>Ver o sistema</span>
              </a>
            </div>

            {/* Trust row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} style={{ width: 15, height: 15, color: '#e8c97a', fill: '#e8c97a' }} />
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>|</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Sem cartão de crédito · Cancele quando quiser</span>
            </div>
          </div>

          {/* ── RIGHT: screenshots reais ── */}
          <div style={{ position: 'relative', minHeight: 480 }}>

            {/* Main screenshot — Dashboard */}
            <div className="hero-float-a" style={{
              borderRadius: 20,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: '0 28px 72px rgba(0,0,0,0.45)',
            }}>
              {/* Browser chrome */}
              <div style={{
                background: 'rgba(255,255,255,0.06)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', opacity: 0.7 }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', opacity: 0.7 }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#22c55e', opacity: 0.7 }} />
                <div style={{
                  flex: 1, marginLeft: 10,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 5, height: 18,
                  display: 'flex', alignItems: 'center', padding: '0 8px',
                }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>app.talentjud.com.br/app/dashboard</span>
                </div>
              </div>
              <img
                src={SCREENSHOTS.hero_main}
                alt="Dashboard TalentJUD"
                style={{ width: '100%', display: 'block', minHeight: 280, objectFit: 'cover', objectPosition: 'top' }}
              />
            </div>

            {/* Floating screenshot top-right — Casos */}
            <div className="hero-float-b" style={{
              position: 'absolute', top: -32, right: -24,
              width: 220,
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid rgba(232,201,122,0.3)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}>
              <div style={{
                background: 'rgba(232,201,122,0.1)',
                borderBottom: '1px solid rgba(232,201,122,0.15)',
                padding: '7px 10px',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', opacity: 0.6 }} />
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', opacity: 0.6 }} />
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', opacity: 0.6 }} />
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginLeft: 6 }}>Casos</span>
              </div>
              <img
                src={SCREENSHOTS.hero_card_a}
                alt="Gestão de Casos"
                style={{ width: '100%', display: 'block', minHeight: 130, objectFit: 'cover', objectPosition: 'top' }}
              />
            </div>

          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────────────────── */}
      <section style={{
        background: C.white,
        borderTop: `1px solid ${C.ice}`,
        borderBottom: `1px solid ${C.ice}`,
        padding: '40px 24px',
        fontFamily: 'DM Sans, sans-serif',
        color: C.dark,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24, textAlign: 'center' }}>
          {stats.map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 36, fontWeight: 800, color: C.brand, fontFamily: 'DM Sans, sans-serif', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: C.steel, marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="funcionalidades" style={{
        background: C.warm,
        padding: '96px 24px',
        fontFamily: 'DM Sans, sans-serif',
        color: C.dark,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.brand, marginBottom: 12 }}>
              Funcionalidades
            </p>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              color: C.dark,
              lineHeight: 1.15,
            }}>
              Tudo que um escritório moderno precisa
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{
                background: C.white,
                border: `1px solid ${C.ice}`,
                borderRadius: 20,
                padding: '28px 24px',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `linear-gradient(135deg, ${C.dark}, ${C.brand})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon style={{ width: 22, height: 22, color: C.goldLight }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.dark, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: C.steel, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE SHOWCASE ─────────────────────────────────────────────────── */}
      <section id="showcase" style={{
        background: C.white,
        padding: '96px 24px',
        fontFamily: 'DM Sans, sans-serif',
        color: C.dark,
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.brand, marginBottom: 12 }}>
              Veja o sistema em ação
            </p>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              color: C.dark,
              lineHeight: 1.15,
              marginBottom: 16,
            }}>
              Cada ferramenta pensada para advogados
            </h2>
            <p style={{ fontSize: 16, color: C.steel, maxWidth: 520, margin: '0 auto' }}>
              Interface limpa, dados reais e automação que economiza horas por semana.
            </p>
          </div>

          {/* Tab bar */}
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            marginBottom: 40,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {showcaseFeatures.map((f, i) => {
              const Icon = f.icon
              const isActive = activeFeature === i
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFeature(i)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 999,
                    border: `1.5px solid ${isActive ? C.brand : C.ice}`,
                    background: isActive ? `linear-gradient(135deg, ${C.dark}, ${C.brand})` : C.white,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    boxShadow: isActive ? '0 4px 16px rgba(114,16,17,0.18)' : 'none',
                  }}
                >
                  <Icon style={{ width: 15, height: 15, color: isActive ? C.goldLight : C.brand }} />
                  <span style={{ color: isActive ? C.warm : C.dark }}>{f.label}</span>
                </button>
              )
            })}
          </div>

          {/* Showcase content */}
          {(() => {
            const feat = showcaseFeatures[activeFeature]
            const Icon = feat.icon
            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 40,
                alignItems: 'center',
              }}>
                {/* Screenshot panel */}
                <div style={{
                  position: 'relative',
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: `1px solid ${C.ice}`,
                  boxShadow: '0 20px 60px rgba(114,16,17,0.10)',
                  background: C.warm,
                  minHeight: 360,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {/* Browser chrome */}
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: 36,
                    background: C.ice,
                    borderBottom: `1px solid ${C.ice}`,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    gap: 6,
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: 0.6 }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: 0.6 }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', opacity: 0.6 }} />
                    <div style={{
                      flex: 1, marginLeft: 12,
                      background: C.white,
                      borderRadius: 6,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 10px',
                    }}>
                      <span style={{ fontSize: 11, color: C.steel }}>app.talentjud.com.br</span>
                    </div>
                  </div>
                  <img
                    src={feat.image}
                    alt={`Screenshot - ${feat.label}`}
                    style={{
                      width: '100%',
                      marginTop: 36,
                      display: 'block',
                      objectFit: 'cover',
                      minHeight: 320,
                    }}
                    onError={(e) => {
                      // Fallback visual quando screenshot ainda não está carregado
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent && !parent.querySelector('.screenshot-fallback')) {
                        const fb = document.createElement('div')
                        fb.className = 'screenshot-fallback'
                        fb.style.cssText = `display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:60px 32px;margin-top:36px;`
                        fb.innerHTML = `<div style="width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#4A0B0C,#721011);display:flex;align-items:center;justify-content:center;"><svg width="28" height="28" fill="none" stroke="#CC8652" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/></svg></div><p style="font-size:14px;color:#6B5E58;text-align:center;font-family:DM Sans,sans-serif;">Screenshot de <strong style="color:#721011">${feat.label}</strong><br/>em breve disponível</p>`
                        parent.appendChild(fb)
                      }
                    }}
                  />
                </div>

                {/* Description panel */}
                <div style={{ padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{
                      width: 52, height: 52,
                      borderRadius: 16,
                      background: `linear-gradient(135deg, ${C.dark}, ${C.brand})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon style={{ width: 24, height: 24, color: C.goldLight }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.brand, marginBottom: 2 }}>
                        {feat.eyebrow}
                      </p>
                      <h3 style={{
                        fontFamily: 'Cormorant Garamond, serif',
                        fontSize: 'clamp(22px, 3vw, 30px)',
                        fontWeight: 700,
                        color: C.dark,
                        lineHeight: 1.15,
                      }}>
                        {feat.title}
                      </h3>
                    </div>
                  </div>

                  <p style={{ fontSize: 15, color: C.steel, lineHeight: 1.7, marginBottom: 24 }}>
                    {feat.desc}
                  </p>

                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {feat.bullets.map((b) => (
                      <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <CheckCircle2 style={{ width: 17, height: 17, color: C.brand, flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 14, color: C.dark, lineHeight: 1.5 }}>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Navigation dots */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 32, alignItems: 'center' }}>
                    {showcaseFeatures.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveFeature(i)}
                        style={{
                          width: i === activeFeature ? 24 : 8,
                          height: 8,
                          borderRadius: 999,
                          background: i === activeFeature ? C.brand : C.ice,
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'all 0.3s',
                        }}
                      />
                    ))}
                    <button
                      onClick={() => setActiveFeature((activeFeature + 1) % showcaseFeatures.length)}
                      style={{
                        marginLeft: 'auto',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        border: `1.5px solid ${C.brand}`,
                        background: 'transparent',
                        padding: '8px 16px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      <span style={{ color: C.brand }}>Próxima</span>
                      <ArrowRight style={{ width: 14, height: 14, color: C.brand }} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* ── SPOTLIGHT B — DOCUMENTOS ────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.dark} 0%, ${C.brand} 100%)`,
        padding: '96px 24px',
        fontFamily: 'DM Sans, sans-serif',
        color: C.warm,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 64, alignItems: 'center' }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(201,160,160,0.25)',
            borderRadius: 24,
            padding: '32px',
          }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {['Contrato.docx', 'Petição.pdf', 'Procuração.pdf'].map((f) => (
                <div key={f} style={{
                  background: 'rgba(204,134,82,0.15)',
                  border: '1px solid rgba(204,134,82,0.3)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 12,
                  color: C.goldLight,
                }}>
                  {f}
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '20px', marginBottom: 16 }}>
              <div style={{ height: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 4, marginBottom: 8, width: '80%' }} />
              <div style={{ height: 10, background: 'rgba(255,255,255,0.1)',  borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 10, background: 'rgba(255,255,255,0.1)',  borderRadius: 4, width: '60%' }} />
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <div style={{ background: 'rgba(204,134,82,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: C.goldLight }}>{'{{nome_cliente}}'}</div>
                <div style={{ background: 'rgba(204,134,82,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: C.goldLight }}>{'{{data_hoje}}'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 10 }}>
              <CheckCircle2 style={{ width: 16, height: 16, color: '#4ade80' }} />
              <span style={{ fontSize: 13, color: '#4ade80' }}>Salvo no Google Drive com marca d&apos;água</span>
            </div>
          </div>

          <div>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 12 }}>
              <span style={{ color: '#e8c97a' }}>Documentos &amp; Branding</span>
            </p>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 20,
            }}>
              <span style={{ color: '#ffffff' }}>Templates que carregam a identidade do escritório</span>
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7 }}>
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>
                Editor de documentos completo com variáveis dinâmicas, integração com Google Drive e OneDrive, marca d&apos;água automática e branding personalizado.
              </span>
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
              {['Variáveis dinâmicas (nome, data, CPF...)', 'Sincroniza com Google Drive e OneDrive', 'Marca d\'água com logo do escritório', 'Geração de PDF com branding completo'].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
                  <Star style={{ width: 16, height: 16, color: '#e8c97a', flexShrink: 0, fill: '#e8c97a' }} />
                  <span style={{ color: '#ffffff' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="preços" style={{
        background: C.warm,
        padding: '96px 24px',
        fontFamily: 'DM Sans, sans-serif',
        color: C.dark,
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.brand, marginBottom: 12 }}>
              Preços
            </p>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              color: C.dark,
              lineHeight: 1.15,
              marginBottom: 16,
            }}>
              Planos transparentes, sem surpresas
            </h2>
            <p style={{ fontSize: 16, color: C.steel }}>14 dias grátis em todos os planos. Sem cartão de crédito.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, alignItems: 'start' }}>
            <PlanCard
              tier="Básico"
              price="R$ 89"
              priceSub="/mês"
              desc="Para advogados autônomos"
              features={['Até 1 usuário', 'CRM de leads e casos', 'Agenda integrada', 'Diário Oficial', 'DataJud básico']}
              cta="Começar grátis"
            />
            <PlanCard
              tier="Profissional"
              price="R$ 189"
              priceSub="/mês"
              desc="Para escritórios em crescimento"
              features={['Até 5 usuários', 'Tudo do Básico', 'Google Drive + OneDrive', 'Templates com variáveis', 'Waze Jurídico (IA)', 'Timesheet e honorários']}
              cta="Começar grátis"
              featured
              darkBg
              badge="Mais popular"
            />
            <PlanCard
              tier="Escritório"
              price="R$ 389"
              priceSub="/mês"
              desc="Para grandes escritórios"
              features={['Usuários ilimitados', 'Tudo do Profissional', 'Branding personalizado', 'Analytics executivo', 'Auditoria completa', 'Suporte prioritário']}
              cta="Falar com vendas"
              ctaHref="https://wa.me/5531999999999?text=Quero+conhecer+o+plano+Escritório+do+SDR+Jurídico"
            />
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.dark} 0%, ${C.brandMid} 100%)`,
        padding: '80px 24px',
        fontFamily: 'DM Sans, sans-serif',
        textAlign: 'center',
        color: C.warm,
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700,
            marginBottom: 16,
            lineHeight: 1.2,
          }}>
            <span style={{ color: '#ffffff' }}>Comece hoje. Veja resultados em 24h.</span>
          </h2>
          <p style={{ fontSize: 16, marginBottom: 36 }}>
            <span style={{ color: 'rgba(255,255,255,0.75)' }}>Mais de 500 processos já monitorados. Seu escritório pode ser o próximo.</span>
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/login"
              style={{
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                padding: '16px 32px',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
                display: 'inline-block',
              }}
            >
              <span style={{ color: C.dark }}>Criar conta grátis</span>
            </Link>
            <a
              href="https://wa.me/5531999999999?text=Quero+conhecer+o+SDR+Jurídico"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                border: `1.5px solid rgba(255,255,255,0.5)`,
                padding: '16px 32px',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ color: '#ffffff' }}>Falar com especialista</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{
        background: C.dark,
        padding: '64px 24px 32px',
        fontFamily: 'DM Sans, sans-serif',
        borderTop: `1px solid rgba(201,160,160,0.15)`,
        color: C.warm,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 48, marginBottom: 56 }}>
            <div>
              <div style={{ marginBottom: 12 }}>
                <img src={LOGO_URL} alt="TalentJUD" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
              </div>
              <p style={{ fontSize: 14, color: C.silver, lineHeight: 1.6 }}>
                O sistema de gestão jurídica mais completo do Brasil.
              </p>
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.goldLight, marginBottom: 16 }}>Produto</p>
              {['Funcionalidades', 'Preços', 'DataJud', 'Templates', 'Timesheet'].map((item) => (
                <div key={item} style={{ marginBottom: 10 }}>
                  <a href="#" style={{ fontSize: 14, color: C.silver }}>{item}</a>
                </div>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.goldLight, marginBottom: 16 }}>Empresa</p>
              {['Sobre nós', 'Blog', 'Parceiros', 'Carreiras'].map((item) => (
                <div key={item} style={{ marginBottom: 10 }}>
                  <a href="#" style={{ fontSize: 14, color: C.silver }}>{item}</a>
                </div>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.goldLight, marginBottom: 16 }}>Contato</p>
              <div style={{ marginBottom: 10 }}>
                <a href="mailto:contato@talentjud.com.br" style={{ fontSize: 14, color: C.silver }}>contato@talentjud.com.br</a>
              </div>
              <div style={{ marginBottom: 10 }}>
                <a href="https://wa.me/5531999999999" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: C.silver }}>WhatsApp</a>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <a href="#" style={{ color: C.silver, fontSize: 13 }}>LinkedIn</a>
                <a href="#" style={{ color: C.silver, fontSize: 13 }}>Instagram</a>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: `1px solid rgba(201,160,160,0.15)`,
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <p style={{ fontSize: 13, color: C.silver }}>© 2026 TalentJUD · Todos os direitos reservados</p>
            <div style={{ display: 'flex', gap: 20 }}>
              <a href="#" style={{ fontSize: 13, color: C.silver }}>LGPD</a>
              <a href="#" style={{ fontSize: 13, color: C.silver }}>Privacidade</a>
              <a href="#" style={{ fontSize: 13, color: C.silver }}>Termos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

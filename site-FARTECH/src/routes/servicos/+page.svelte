<script>
  const services = [
    {
      title: 'Lubrificação Inteligente',
      path: '/servicos/lubrificacao',
      desc: 'Módulo SaaS que escolhe produtos, organiza rotas IoT e sincroniza relatórios com o ERP.'
    },
    {
      title: 'Análises de Óleo com IA',
      path: '/servicos/analise-oleos',
      desc: 'Laboratórios conectados via API, insights automáticos e alertas preditivos no app.'
    },
    {
      title: 'Automação & Dados',
      path: '/servicos/automacao',
      desc: 'Integração PLC/SCADA, digital twins e dashboards executivos em tempo real.'
    },
    {
      title: 'Preventiva Digital',
      path: '/servicos/manutencao-preventiva',
      desc: 'Machine learning prioriza ativos, dispara ordens e mede impacto em MTBF.'
    },
    {
      title: 'Corretiva 24/7',
      path: '/servicos/manutencao-corretiva',
      desc: 'War room digital com playbooks, bots e acompanhamento de fornecedores.'
    },
    {
      title: 'Inspeções Técnicas',
      path: '/servicos/inspecoes-tecnicas',
      desc: 'Checklists Fartech, score de risco automático e plano de ação digital.'
    }
  ];
</script>

<section class="section">
  <div class="container">
    <p class="eyebrow">Serviços</p>
    <h1 class="section-title">Plataforma modular que fala a língua dos times técnicos.</h1>
    <p class="section-subtitle">Escolha os módulos, plugue nas APIs existentes e acompanhe os KPIs no mesmo dashboard.</p>
    <div class="services-grid">
      {#each services as service}
        <a class="card service" href={service.path}>
          <h3>{service.title}</h3>
          <p>{service.desc}</p>
          <span>Detalhes →</span>
        </a>
      {/each}
    </div>
  </div>
</section>

<style>
  .service h3 {
    font-family: var(--font-display);
  }

  .service span {
    color: var(--color-accent);
    font-weight: 600;
  }
</style>

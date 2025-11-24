<script>
  const cases = [
    {
      title: 'Siderúrgica Atlas',
      summary: 'Squad Fartech conectou sensores, estoque e analytics e reduziu 62% das falhas em rolamentos principais.',
      results: ['+18 meses de vida útil', 'Monitoramento em tempo real', 'ROI em 9 meses']
    },
    {
      title: 'Automotiva Vector',
      summary: 'Automação e SCADA integrados via Platform OS levaram a precisão de linha a 98%.',
      results: ['Integração MES', 'Alertas instantâneos', 'Capacidade +12%']
    },
    {
      title: 'Química Solaris',
      summary: 'Modelos térmicos e inspeções digitais reduziram hotspots em 37% e estabilizaram a produção.',
      results: ['Sensores IoT', 'Plano preditivo', 'Compliance ambiental']
    }
  ];
</script>

<section class="section">
  <div class="container">
    <p class="eyebrow">Cases</p>
    <h1 class="section-title">Estudos reais e KPIs comprovados.</h1>
    <div class="cases-grid">
      {#each cases as caseItem}
        <article class="card">
          <h3>{caseItem.title}</h3>
          <p>{caseItem.summary}</p>
          <ul>
            {#each caseItem.results as result}
              <li>{result}</li>
            {/each}
          </ul>
          <a class="btn btn-secondary" href="/contato">Quero replicar</a>
        </article>
      {/each}
    </div>
  </div>
</section>

<script>
  const logos = ['Atlas', 'Vector', 'Solaris', 'Lumin', 'Boreal', 'Synt']
</script>

<section class="section">
  <div class="container">
    <p class="eyebrow">Clientes</p>
    <h1 class="section-title">Scale-ups industriais e operações globais conectadas à Fartech.</h1>
    <div class="grid-12" style="text-align:center;">
      {#each logos as logo}
        <div class="card" style="grid-column: span 3;">
          <span class="client-logo">{logo}</span>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .client-logo {
    font-family: var(--font-display);
    font-size: 1.1rem;
    letter-spacing: 0.18em;
    color: #0b1021;
  }
</style>

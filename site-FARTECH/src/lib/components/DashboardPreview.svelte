<script lang="ts">
  export let eyebrow = 'Dashboard Preview';
  export let title = 'Rocket Rides';
  export let subtitle = 'Dashboard de vendas';
  export let stats: Array<{ label: string; value: string; chart?: boolean }> = [];
  export let transactions: Array<{ value: string; label: string; status?: string }> = [];
</script>

<section class="dashboard-preview">
  <div class="preview-container">
    <div class="preview-left">
      <div class="preview-header">
        <span class="preview-tag">{eyebrow.toUpperCase()}</span>
        <button class="btn-ghost">Pesquisar</button>
      </div>

      <h3 class="preview-title">{title}</h3>
      <p class="preview-subtitle">{subtitle}</p>

      <div class="stats-grid">
        {#each stats as stat}
          <div class="stat-box">
            <p class="stat-label">{stat.label}</p>
            <p class="stat-value">{stat.value}</p>
            {#if stat.chart}
              <div class="mini-chart"></div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="transactions">
        <p class="transactions-label">Transações recentes</p>
        <p class="transactions-meta">Atualizado há 2min</p>

        {#each transactions as tx}
          <div class="transaction-item">
            <div class="tx-info">
              <p class="tx-value">{tx.value}</p>
              <p class="tx-label">{tx.label}</p>
            </div>
            <span class="tx-status" class:pago={tx.status === 'Pago'} class:analise={tx.status === 'Análise'} class:falha={tx.status === 'Falha'}>
              {tx.status}
            </span>
          </div>
        {/each}
      </div>
    </div>

    <div class="preview-right">
      <slot />
    </div>
  </div>
</section>

<style>
  .dashboard-preview {
    width: 100%;
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .preview-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(24px, 4vw, 48px);
    align-items: center;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 0;
  }

  .preview-left {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .preview-tag {
    display: inline-flex;
    padding: 8px 16px;
    background: linear-gradient(135deg, rgba(0, 102, 255, 0.1), rgba(124, 58, 237, 0.1));
    border: 1px solid rgba(0, 102, 255, 0.3);
    border-radius: 24px;
    font-size: 12px;
    font-weight: 600;
    color: #0066ff;
    letter-spacing: 0.5px;
  }

  .btn-ghost {
    padding: 8px 16px;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    color: #6b7280;
    cursor: pointer;
    transition: all 250ms var(--transition-smooth);
  }

  .btn-ghost:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  .preview-title {
    font-size: clamp(28px, 4vw, 36px);
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .preview-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 20px 0;
  }

  .stat-box {
    padding: 16px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    transition: all 300ms var(--transition-smooth);
  }

  .stat-box:hover {
    background: #ffffff;
    border-color: #d1d5db;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  }

  .stat-label {
    font-size: 12px;
    color: #9ca3af;
    margin: 0 0 8px 0;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .mini-chart {
    width: 100%;
    height: 32px;
    background: linear-gradient(to right, #0066ff, #7c3aed);
    border-radius: 4px;
    margin-top: 8px;
    opacity: 0.2;
  }

  .transactions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .transactions-label {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .transactions-meta {
    font-size: 12px;
    color: #9ca3af;
    margin: 0 0 8px 0;
  }

  .transaction-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
    transition: all 250ms var(--transition-smooth);
  }

  .transaction-item:hover {
    background: #f3f4f6;
  }

  .tx-info {
    display: flex;
    flex-direction: column;
  }

  .tx-value {
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .tx-label {
    font-size: 12px;
    color: #6b7280;
    margin: 0;
  }

  .tx-status {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .tx-status.pago {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .tx-status.analise {
    background: rgba(251, 146, 60, 0.1);
    color: #f97316;
  }

  .tx-status.falha {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .preview-right {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 1024px) {
    .preview-container {
      grid-template-columns: 1fr;
      gap: 32px;
    }

    .preview-right {
      width: 100%;
      max-width: 400px;
    }
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .preview-title {
      font-size: 24px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dashboard-preview {
      animation: none;
    }
  }
</style>

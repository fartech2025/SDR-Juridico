<script lang="ts">
  export let title: string;
  export let description: string;
  export let metric: string;
  export let href: string = '/cases';
</script>

<article class="card case-card">
  <p class="eyebrow">{metric}</p>
  <h3>{title}</h3>
  <p class="summary">{description}</p>
  <a class="btn btn-secondary" href={href}>Ver Case</a>
</article>

<style>
  .case-card {
    display: flex;
    flex-direction: column;
    gap: 20px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.94));
    border: 1px solid rgba(13, 17, 23, 0.06);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    border-radius: 12px;
    padding: 32px;
    transition: var(--transition);
    position: relative;
    overflow: hidden;
  }

  .case-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--gradient-primary);
    opacity: 0;
    transition: var(--transition);
  }

  .case-card:hover {
    transform: translateY(-4px);
    border-color: rgba(9, 105, 218, 0.15);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .case-card:hover::before {
    opacity: 1;
  }

  h3 {
    font-family: var(--font-display);
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--color-text);
  }

  .summary {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.95rem;
    line-height: 1.6;
  }
</style>

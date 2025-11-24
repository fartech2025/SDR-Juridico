<script lang="ts">
  export let title: string;
  export let description: string;
  export let href: string = '/servicos';
</script>

<a class="card service-card" href={href}>
  <h3>{title}</h3>
  <p>{description}</p>
  <span>Saiba mais →</span>
</a>

<style>
  .service-card {
    color: inherit;
    text-decoration: none;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.94));
    border: 1px solid rgba(13, 17, 23, 0.06);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    padding: 28px;
    transition: var(--transition);
  }

  .service-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(9, 105, 218, 0.06), rgba(137, 87, 229, 0.03));
    opacity: 0;
    transition: var(--transition);
    z-index: 0;
  }

  .service-card:hover {
    transform: translateY(-4px);
    border-color: rgba(9, 105, 218, 0.15);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .service-card:hover::after {
    opacity: 1;
  }

  h3 {
    font-family: var(--font-display);
    margin: 0;
    font-size: 1.15rem;
    position: relative;
    z-index: 1;
    font-weight: 600;
    color: var(--color-text);
  }

  p {
    margin: 0;
    color: var(--color-muted);
    position: relative;
    z-index: 1;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  span {
    font-weight: 600;
    color: var(--color-accent);
    position: relative;
    z-index: 1;
    font-size: 0.93rem;
    transition: var(--transition);
  }

  .service-card:hover span {
    transform: translateX(4px);
  }
</style>

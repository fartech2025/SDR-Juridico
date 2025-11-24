<script lang="ts">
  export let title = 'ENEM ULTRA';
  export let description = 'Plataforma de simulados com IA';
</script>

<div class="enem-showcase">
  <img src="/images/enem-ultra.png" alt={title} class="enem-image" />
  <div class="enem-info">
    <h3 class="enem-title">{title}</h3>
    <p class="enem-description">{description}</p>
  </div>
</div>

<style>
  .enem-showcase {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
  }

  .enem-image {
    width: 100%;
    max-width: 280px;
    height: auto;
    border-radius: 12px;
    box-shadow: var(--shadow-xl);
    transition: all 400ms var(--transition-smooth);
  }

  .enem-image:hover {
    transform: translateY(-8px);
    box-shadow: 0 24px 48px rgba(0, 102, 255, 0.2);
  }

  .enem-info {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .enem-title {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .enem-description {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }

  @media (max-width: 768px) {
    .enem-image {
      max-width: 200px;
    }

    .enem-title {
      font-size: 18px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .enem-showcase {
      animation: none;
    }

    .enem-image:hover {
      transform: none;
    }
  }
</style>

<script lang="ts">
  export let quote: string;
  export let author: string;
  export let role: string;
</script>

<figure class="card depoimento">
  <blockquote class="quote">“{quote}”</blockquote>
  <figcaption>
    <strong>{author}</strong>
    <span>{role}</span>
  </figcaption>
</figure>

<style>
  .depoimento {
    display: flex;
    flex-direction: column;
    gap: 24px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.94));
    border: 1px solid rgba(13, 17, 23, 0.06);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    border-radius: 12px;
    padding: 32px;
    position: relative;
    overflow: hidden;
  }

  .depoimento::before {
    content: '❝';
    position: absolute;
    top: 16px;
    right: 24px;
    font-size: 3rem;
    color: rgba(9, 105, 218, 0.1);
    line-height: 0.8;
  }

  .depoimento:hover {
    transform: translateY(-4px);
    border-color: rgba(9, 105, 218, 0.15);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  figcaption {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  strong {
    font-family: var(--font-display);
    font-size: 1rem;
    color: var(--color-text);
    font-weight: 600;
  }

  span {
    color: var(--color-muted);
    font-size: 0.88rem;
  }

  .quote {
    margin: 0;
    color: var(--color-text);
    font-size: 1rem;
    line-height: 1.7;
    font-style: italic;
  }
</style>

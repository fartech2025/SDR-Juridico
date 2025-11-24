<script lang="ts">
  export let transparent = false;

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Quem Somos', href: '/quem-somos' },
    { label: 'Serviços', href: '/servicos' },
    { label: 'Cases', href: '/cases' },
    { label: 'Clientes', href: '/clientes' },
    { label: 'Contato', href: '/contato' }
  ];
</script>

<header class={`site-header ${transparent ? 'is-transparent' : ''}`}>
  <div class="container header-inner">
	<a class="logo" href="/">
		<img src="/images/logo.png" alt="Fartech Logo" />
	</a>    <nav>
      {#each links as link}
        <a href={link.href}>{link.label}</a>
      {/each}
    </nav>

    <a class="btn btn-primary" href="/contato">Solicitar Orçamento</a>
  </div>
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-sm);
  }

  .site-header::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.95);
    z-index: -1;
    border-bottom: 1px solid var(--color-line);
  }

  .site-header.is-transparent::after {
    background: rgba(255, 255, 255, 0.92);
  }

  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-block: 18px;
    gap: 24px;
    width: calc(100% - clamp(8px, 3vw, 80px));
    max-width: 1920px;
    margin-inline: auto;
    padding-inline: clamp(6px, 1.5vw, 16px);
  }

  nav {
    display: flex;
    gap: 4px;
    font-weight: 500;
    color: var(--color-text-primary);
    font-size: 0.94rem;
    letter-spacing: -0.01em;
  }

  nav a {
    padding: 10px 14px;
    border-radius: 8px;
    transition: var(--transition);
    border: 1px solid transparent;
  }

  nav a:hover {
    color: var(--color-blue);
    background: var(--color-blue-light);
    border-color: var(--color-blue);
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    flex-shrink: 0;
  }

  .logo img {
    height: 100%;
    width: auto;
    object-fit: contain;
  }

  .logo span {
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    color: transparent;
  }

  .logo small {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--color-text-tertiary);
    margin-top: 3px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  @media (max-width: 768px) {
    nav {
      display: none;
    }

    .header-inner {
      gap: 20px;
    }
  }
</style>

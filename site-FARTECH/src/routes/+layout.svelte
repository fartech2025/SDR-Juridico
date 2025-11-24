<script>
  import Header from '$components/Header.svelte';
  import Footer from '$components/Footer.svelte';
  import '$styles/global.css';
</script>

<div class="app-shell">
  <Header transparent />
  <main class="page-shell">
    <slot />
  </main>
  <Footer />
</div>

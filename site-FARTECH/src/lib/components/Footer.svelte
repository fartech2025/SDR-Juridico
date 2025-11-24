<footer class="footer">
  <div class="container">
    <div class="footer-columns">
      <div>
        <h4 class="footer-title">Fartech</h4>
        <p>Fartech Platform — infraestrutura digital para operações críticas, dados em tempo real e squads de produto embarcados.</p>
        <small>© Fartech 2025 • CNPJ 00.000.000/0000-00</small>
      </div>
      <div>
        <h4 class="footer-title">Contato</h4>
        <ul class="list-reset">
          <li><span>Endereço: Av. Industrial, 1000 • São Paulo - SP</span></li>
          <li><span>WhatsApp: (11) 99999-0000</span></li>
          <li><span>Email: contato@fartech.com.br</span></li>
        </ul>
      </div>
      <div>
        <h4 class="footer-title">Links</h4>
        <ul class="list-reset">
          <li><a href="/quem-somos">Quem Somos</a></li>
          <li><a href="/servicos">Serviços</a></li>
          <li><a href="/cases">Cases</a></li>
          <li><a href="/contato">Contato</a></li>
        </ul>
      </div>
    </div>
  </div>
</footer>

<style>
  .footer {
    background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
    color: rgba(230, 237, 243, 0.88);
    padding: 96px 0 48px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .footer-title {
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #f0f6fc;
    margin: 0 0 20px 0;
  }

  .footer-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 48px;
  }

  .footer p {
    margin: 0 0 16px 0;
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .list-reset {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .list-reset li {
    margin-bottom: 12px;
  }

  .list-reset a,
  .list-reset span {
    color: rgba(230, 237, 243, 0.88);
    text-decoration: none;
    font-size: 0.93rem;
    transition: var(--transition);
    display: inline;
  }

  .list-reset a:hover {
    color: #f0f6fc;
  }

  .footer small {
    color: rgba(255, 255, 255, 0.52);
    font-size: 0.85rem;
    margin-top: 20px;
    display: block;
  }
</style>

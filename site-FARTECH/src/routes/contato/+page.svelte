<section class="section">
  <div class="container">
    <p class="eyebrow">Contato</p>
    <h1 class="section-title">Agende um discovery com nossos product engineers.</h1>
    <p class="section-subtitle">Conte o cenário atual, integrações necessárias e metas de negócio. Respondemos em até 4h úteis.</p>
    <div class="grid-12">
      <form class="card" style="grid-column: span 7; display:flex; flex-direction:column; gap:16px;">
        <label>
          <span>Nome</span>
          <input type="text" required placeholder="Seu nome" />
        </label>
        <label>
          <span>E-mail corporativo</span>
          <input type="email" required placeholder="nome@suaempresa.com" />
        </label>
        <label>
          <span>Telefone</span>
          <input type="tel" placeholder="(00) 0000-0000" />
        </label>
        <label>
          <span>Mensagem</span>
          <textarea rows="4" placeholder="Conte-nos sobre sua operação"></textarea>
        </label>
        <button class="btn btn-primary" type="submit">Agendar discovery</button>
      </form>
      <div class="card" style="grid-column: span 5;">
        <h3>Atendimento</h3>
        <ul>
          <li>WhatsApp: (11) 99999-0000</li>
          <li>Email: contato@fartech.com.br</li>
          <li>Endereço: Av. Industrial, 1000 • São Paulo/SP</li>
        </ul>
        <p>Disponível 24/7 para emergências.</p>
      </div>
    </div>
  </div>
</section>

<style>
  label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-weight: 600;
  }

  input,
  textarea {
    border-radius: 12px;
    border: 1px solid rgba(12, 18, 52, 0.12);
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.85);
    color: var(--color-text);
  }

  input:focus,
  textarea:focus {
    outline: 2px solid rgba(108, 57, 255, 0.4);
  }
</style>

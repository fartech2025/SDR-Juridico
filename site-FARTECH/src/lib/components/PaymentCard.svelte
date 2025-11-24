<script lang="ts">
  export let status = 'Online';
  export let statusColor = '#10b981';
  export let title = 'Integração Pix Ready';
  export let subtitle = 'Checkout Fartech Pay';
  export let amount = 'R$ 1.284,90';
  export let customer = 'Rocket Rides';
  export let card = '•••• •••• •••• 4487';
  export let holder = 'Fernanda V.';
  export let cvv = '123';
  export let buttonText = 'Confirmar pagamento';
</script>

<div class="payment-card">
  <div class="card-header">
    <div class="header-info">
      <p class="status" style="--status-color: {statusColor}">● {status}</p>
      <h3 class="card-title">{title}</h3>
      <p class="card-subtitle">{subtitle}</p>
    </div>
  </div>

  <div class="card-content">
    <div class="amount-section">
      <div class="amount-row">
        <span class="amount-label">Valor a receber</span>
        <span class="amount-value">{amount}</span>
      </div>
      <div class="amount-row">
        <span class="amount-label">Cliente</span>
        <span class="amount-value">{customer}</span>
      </div>
    </div>

    <div class="form-section">
      <input type="text" class="input-field" value={card} readonly />
      <input type="text" class="input-field" value={holder} readonly />
      <input type="text" class="input-field input-small" value={cvv} readonly />
    </div>

    <button class="btn-payment">{buttonText}</button>
  </div>
</div>

<style>
  .payment-card {
    width: 100%;
    max-width: 320px;
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border: 2px solid #374151;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
  }

  .card-header {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .header-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .status {
    font-size: 12px;
    font-weight: 600;
    color: var(--status-color);
    margin: 0;
    letter-spacing: 0.5px;
  }

  .card-title {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
  }

  .card-subtitle {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .amount-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .amount-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .amount-label {
    font-size: 12px;
    color: #9ca3af;
  }

  .amount-value {
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .input-field {
    width: 100%;
    padding: 12px;
    background: #374151;
    border: 1px solid #4b5563;
    border-radius: 8px;
    font-size: 14px;
    color: #ffffff;
    font-weight: 500;
    transition: all 250ms var(--transition-smooth);
  }

  .input-field:hover {
    border-color: #6b7280;
    background: #4b5563;
  }

  .input-field:focus {
    outline: none;
    border-color: #0066ff;
    background: #374151;
  }

  .input-field.input-small {
    max-width: 70px;
  }

  .btn-payment {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #0066ff 0%, #0052cc 100%);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
    transition: all 300ms var(--transition-smooth);
    box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
  }

  .btn-payment:hover {
    background: linear-gradient(135deg, #0052cc 0%, #003d99 100%);
    box-shadow: 0 8px 20px rgba(0, 102, 255, 0.4);
    transform: translateY(-2px);
  }

  .btn-payment:active {
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .payment-card {
      animation: none;
    }
  }
</style>

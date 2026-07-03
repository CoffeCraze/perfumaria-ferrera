const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');

// Configuração do cliente Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc123' // Para evitar duplicidade de pagamentos
  }
});

// Instanciar serviços
const payment = new Payment(client);
const preference = new Preference(client);

/**
 * Criar pagamento PIX
 */
const createPixPayment = async (paymentData) => {
  try {
    console.log('💰 Iniciando criação de pagamento PIX...');
    console.log('Dados do pagamento:', {
      amount: paymentData.transactionAmount,
      description: paymentData.description,
      email: paymentData.email
    });

    const body = {
      transaction_amount: paymentData.transactionAmount,
      description: paymentData.description,
      payment_method_id: 'pix',
      payer: {
        email: paymentData.email,
        first_name: paymentData.firstName,
        last_name: paymentData.lastName,
        identification: {
          type: 'CPF',
          number: paymentData.cpf
        }
      },
      notification_url: 'https://seusite.com/api/orders/webhook',
      additional_info: {
        items: paymentData.items
      }
    };

    const result = await payment.create({ body });
    
    console.log('✅ Pagamento PIX criado:', {
      id: result.id,
      status: result.status,
      qrCodeAvailable: !!result.point_of_interaction?.transaction_data?.qr_code
    });

    return {
      success: true,
      paymentId: result.id,
      status: result.status,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticketUrl: result.point_of_interaction?.transaction_data?.ticket_url,
      copyPaste: result.point_of_interaction?.transaction_data?.qr_code,
      expirationDate: result.date_of_expiration
    };
  } catch (error) {
    console.error('❌ Erro ao criar pagamento PIX:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    
    throw new Error(`Erro no pagamento: ${error.message}`);
  }
};

/**
 * Verificar status do pagamento
 */
const checkPaymentStatus = async (paymentId) => {
  try {
    console.log(`🔍 Verificando status do pagamento ${paymentId}...`);
    
    const result = await payment.get({ id: paymentId });
    
    console.log('📊 Status do pagamento:', {
      id: result.id,
      status: result.status,
      statusDetail: result.status_detail,
      approved: result.status === 'approved'
    });

    return {
      success: true,
      status: result.status,
      statusDetail: result.status_detail,
      paymentId: result.id,
      amount: result.transaction_amount,
      dateApproved: result.date_approved,
      paymentMethod: result.payment_method_id
    };
  } catch (error) {
    console.error('❌ Erro ao verificar pagamento:', error);
    throw new Error(`Erro ao verificar status: ${error.message}`);
  }
};

module.exports = {
  createPixPayment,
  checkPaymentStatus,
  payment,
  preference
};
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Referência ao usuário
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Usuário é obrigatório']
  },
  
  // Número do pedido (gerado automaticamente)
  numeroPedido: {
    type: String,
    unique: true,
    required: true
  },
  
  // Itens do pedido
  itens: [{
    perfume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Perfume',
      required: true
    },
    nome: String,
    preco: Number,
    quantidade: {
      type: Number,
      required: true,
      min: [1, 'Quantidade mínima é 1']
    },
    subtotal: Number,
    imagem: String
  }],
  
  // Informações do pagamento
  pagamento: {
    metodo: {
      type: String,
      enum: ['pix', 'cartao_credito', 'boleto'],
      default: 'pix'
    },
    status: {
      type: String,
      enum: [
        'pendente',
        'aprovado',
        'rejeitado',
        'cancelado',
        'reembolsado',
        'em_processamento'
      ],
      default: 'pendente'
    },
    idExterno: String, // ID do pagamento no Mercado Pago
    qrCode: String,
    qrCodeBase64: String,
    copiaCola: String,
    dataPagamento: Date,
    dataExpiracao: Date,
    valorPago: Number
  },
  
  // Informações de entrega
  entrega: {
    endereco: {
      cep: String,
      rua: String,
      numero: String,
      complemento: String,
      bairro: String,
      cidade: String,
      estado: String
    },
    status: {
      type: String,
      enum: [
        'preparando',
        'enviado',
        'em_transito',
        'entregue',
        'cancelado'
      ],
      default: 'preparando'
    },
    codigoRastreio: String,
    transportadora: String,
    prazoEntrega: String,
    dataEnvio: Date,
    dataEntrega: Date
  },
  
  // Valores
  subtotal: {
    type: Number,
    required: true
  },
  
  frete: {
    type: Number,
    default: 0
  },
  
  desconto: {
    type: Number,
    default: 0
  },
  
  total: {
    type: Number,
    required: true
  },
  
  // Cupom de desconto
  cupom: {
    codigo: String,
    desconto: Number
  },
  
  // Informações adicionais
  observacoes: String,
  
  ipCliente: String,
  
  // Status geral do pedido
  statusPedido: {
    type: String,
    enum: [
      'aguardando_pagamento',
      'pagamento_confirmado',
      'preparando_pedido',
      'pedido_enviado',
      'pedido_entregue',
      'pedido_cancelado'
    ],
    default: 'aguardando_pagamento'
  },
  
  // Data do pedido
  dataPedido: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ===== MIDDLEWARES =====

// Gerar número do pedido automaticamente
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Formato: #ANO-MES-DIA-HORA-MINUTO-SEGUNDO-RANDOM
    const data = new Date();
    const ano = data.getFullYear().toString().slice(-2);
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const dia = data.getDate().toString().padStart(2, '0');
    const hora = data.getHours().toString().padStart(2, '0');
    const min = data.getMinutes().toString().padStart(2, '0');
    const seg = data.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    this.numeroPedido = `#${ano}${mes}${dia}${hora}${min}${seg}${random}`;
  }
  
  // Calcular subtotais dos itens
  this.itens.forEach(item => {
    item.subtotal = item.preco * item.quantidade;
  });
  
  next();
});

// ===== MÉTODOS =====

orderSchema.methods.calcularTotal = function() {
  this.subtotal = this.itens.reduce((sum, item) => sum + item.subtotal, 0);
  this.total = this.subtotal + this.frete - this.desconto;
};

orderSchema.statics.buscarPorUsuario = function(usuarioId) {
  return this.find({ usuario: usuarioId })
    .populate('itens.perfume')
    .sort({ dataPedido: -1 });
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
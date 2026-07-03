const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  perfume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Perfume',
    required: true
  },
  quantidade: {
    type: Number,
    required: true,
    min: [1, 'Quantidade mínima é 1'],
    default: 1
  },
  preco: {
    type: Number,
    required: true
  },
  adicionadoEm: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Um carrinho por usuário
  },
  itens: [cartItemSchema],
  ultimaAtualizacao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ===== MÉTODOS =====

// Calcular subtotal
cartSchema.virtual('subtotal').get(function() {
  return this.itens.reduce((total, item) => {
    return total + (item.preco * item.quantidade);
  }, 0);
});

// Calcular quantidade total de itens
cartSchema.virtual('quantidadeTotal').get(function() {
  return this.itens.reduce((total, item) => {
    return total + item.quantidade;
  }, 0);
});

// Verificar se carrinho está vazio
cartSchema.virtual('estaVazio').get(function() {
  return this.itens.length === 0;
});

// ===== MIDDLEWARES =====

cartSchema.pre('save', function(next) {
  this.ultimaAtualizacao = new Date();
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
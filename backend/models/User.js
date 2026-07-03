const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome e obrigatorio'],
    trim: true,
    minlength: [3, 'Nome deve ter no minimo 3 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email e obrigatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  senha: {
    type: String,
    required: [true, 'Senha e obrigatoria'],
    minlength: [6, 'Senha deve ter no minimo 6 caracteres']
  },
  telefone: {
    type: String,
    default: ''
  },
  cpf: {
    type: String,
    default: ''
  },
  dataNascimento: {
    type: Date,
    default: null
  },
  role: {
    type: String,
    enum: ['cliente', 'admin'],
    default: 'cliente'
  },
  ativo: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    default: ''
  },
  enderecos: [{
    rua: { type: String, default: '' },
    numero: { type: String, default: '' },
    complemento: { type: String, default: '' },
    bairro: { type: String, default: '' },
    cidade: { type: String, default: '' },
    estado: { type: String, default: '' },
    cep: { type: String, default: '' },
    principal: { type: Boolean, default: false }
  }],
  resetToken: String,
  resetTokenExpira: Date,
  ultimoLogin: Date
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.compararSenha = async function(senhaDigitada) {
  return await bcrypt.compare(senhaDigitada, this.senha);
};

userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    nome: this.nome,
    email: this.email,
    telefone: this.telefone,
    role: this.role,
    ativo: this.ativo,
    createdAt: this.createdAt
  };
};

userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

const User = mongoose.model('User', userSchema);

module.exports = User;
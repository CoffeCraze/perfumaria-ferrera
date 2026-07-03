const mongoose = require('mongoose');

const perfumeSchema = new mongoose.Schema({
  // Informações Básicas
  nome: {
    type: String,
    required: [true, 'Nome do perfume é obrigatório'],
    trim: true,
    minlength: [3, 'Nome deve ter no mínimo 3 caracteres'],
    maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
  },
  
  marca: {
    type: String,
    required: [true, 'Marca é obrigatória'],
    trim: true,
    index: true // Para buscas mais rápidas
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  
  // Classificação
  tipo: {
    type: String,
    required: [true, 'Tipo de perfume é obrigatório'],
    enum: {
      values: [
        'Eau de Parfum',
        'Eau de Toilette',
        'Eau de Cologne',
        'Parfum',
        'Eau Fraiche',
        'Perfume Oil'
      ],
      message: '{VALUE} não é um tipo válido'
    }
  },
  
  genero: {
    type: String,
    required: true,
    enum: {
      values: ['Masculino', 'Feminino', 'Unissex', 'Infantil'],
      message: '{VALUE} não é um gênero válido'
    }
  },
  
  categoria: {
    type: String,
    required: true,
    enum: {
      values: ['Importado', 'Nacional', 'Nicho', 'Designer', 'Celebridade'],
      message: '{VALUE} não é uma categoria válida'
    }
  },
  
  // Composição Olfativa
  familiaOlfativa: {
    type: String,
    enum: [
      'Floral', 'Oriental', 'Amadeirado', 'Fresco',
      'Cítrico', 'Aromático', 'Chipre', 'Couro',
      'Fougère', 'Gourmand', 'Aquático', 'Verde'
    ]
  },
  
  notas: {
    topo: [{
      type: String,
      trim: true
    }],
    coracao: [{
      type: String,
      trim: true
    }],
    base: [{
      type: String,
      trim: true
    }]
  },
  
  intensidade: {
    type: String,
    enum: ['Suave', 'Moderada', 'Intensa', 'Muito Intensa'],
    default: 'Moderada'
  },
  
  // Informações Comerciais
  descricao: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    minlength: [20, 'Descrição deve ter no mínimo 20 caracteres'],
    maxlength: [2000, 'Descrição deve ter no máximo 2000 caracteres']
  },
  
  descricaoCurta: {
    type: String,
    maxlength: [150, 'Descrição curta deve ter no máximo 150 caracteres']
  },
  
  preco: {
    type: Number,
    required: [true, 'Preço é obrigatório'],
    min: [0, 'Preço não pode ser negativo']
  },
  
  precoPromocional: {
    type: Number,
    min: [0, 'Preço promocional não pode ser negativo'],
    validate: {
      validator: function(value) {
        return !value || value < this.preco;
      },
      message: 'Preço promocional deve ser menor que o preço original'
    }
  },
  
  volume: {
    type: Number,
    required: true,
    enum: [30, 50, 75, 100, 125, 150, 200]
  },
  
  unidadeMedida: {
    type: String,
    default: 'ml',
    enum: ['ml', 'g']
  },
  
  // Estoque e Disponibilidade
  estoque: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Estoque não pode ser negativo']
  },
  
  disponivel: {
    type: Boolean,
    default: true
  },
  
  // Imagens
  imagens: [{
    url: {
      type: String,
      required: true
    },
    alt: String,
    principal: {
      type: Boolean,
      default: false
    }
  }],
  
  // Avaliações
  avaliacoes: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    nota: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comentario: {
      type: String,
      maxlength: 500
    },
    data: {
      type: Date,
      default: Date.now
    }
  }],
  
  mediaAvaliacoes: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  quantidadeAvaliacoes: {
    type: Number,
    default: 0
  },
  
  // SEO e Marketing
  tags: [String],
  
  palavrasChave: [String],
  
  destaque: {
    type: Boolean,
    default: false
  },
  
  lancamento: {
    type: Boolean,
    default: false
  },
  
  // Datas
  dataLancamento: Date,
  
  dataCadastro: {
    type: Date,
    default: Date.now
  },
  
  ultimaAtualizacao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Cria createdAt e updatedAt automaticamente
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===== ÍNDICES =====
perfumeSchema.index({ nome: 'text', descricao: 'text', marca: 'text', tags: 'text' });
perfumeSchema.index({ preco: 1 });
perfumeSchema.index({ categoria: 1, tipo: 1 });
perfumeSchema.index({ 'notas.base': 1 });
perfumeSchema.index({ disponivel: 1, estoque: 1 });

// ===== VIRTUAIS =====
perfumeSchema.virtual('precoAtual').get(function() {
  return this.precoPromocional || this.preco;
});

perfumeSchema.virtual('desconto').get(function() {
  if (!this.precoPromocional) return 0;
  return Math.round(((this.preco - this.precoPromocional) / this.preco) * 100);
});

perfumeSchema.virtual('emEstoque').get(function() {
  return this.estoque > 0;
});

// ===== MIDDLEWARES =====
perfumeSchema.pre('save', function(next) {
  // Criar slug automaticamente
  this.slug = this.nome
    .toLowerCase()
    .replace(/[áàãâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòõôö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Atualizar data de modificação
  this.ultimaAtualizacao = new Date();
  
  // Atualizar disponibilidade baseado no estoque
  this.disponivel = this.estoque > 0;
  
  // Calcular média de avaliações
  if (this.avaliacoes && this.avaliacoes.length > 0) {
    const soma = this.avaliacoes.reduce((acc, aval) => acc + aval.nota, 0);
    this.mediaAvaliacoes = (soma / this.avaliacoes.length).toFixed(1);
    this.quantidadeAvaliacoes = this.avaliacoes.length;
  }
  
  next();
});

// ===== MÉTODOS ESTÁTICOS =====
perfumeSchema.statics.buscarPorFamilia = function(familia) {
  return this.find({ familiaOlfativa: familia, disponivel: true });
};

perfumeSchema.statics.lancamentos = function() {
  return this.find({ 
    lancamento: true,
    disponivel: true,
    estoque: { $gt: 0 }
  }).sort({ dataLancamento: -1 });
};

perfumeSchema.statics.emPromocao = function() {
  return this.find({
    precoPromocional: { $exists: true, $ne: null },
    disponivel: true
  });
};

// ===== EXPORTAÇÃO =====
const Perfume = mongoose.model('Perfume', perfumeSchema);

module.exports = Perfume;
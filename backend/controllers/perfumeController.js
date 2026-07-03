const Perfume = require('../models/Perfume');

// @desc    Listar todos os perfumes
// @route   GET /api/perfumes
// @access  Public
exports.listarPerfumes = async (req, res) => {
  try {
    console.log('📋 Listando perfumes...');
    
    // Parâmetros de paginação
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 12;
    const pular = (pagina - 1) * limite;
    
    // Construir filtro
    const filtro = { disponivel: true };
    
    // Filtros opcionais
    if (req.query.marca) filtro.marca = req.query.marca;
    if (req.query.genero) filtro.genero = req.query.genero;
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    if (req.query.categoria) filtro.categoria = req.query.categoria;
    
    // Filtro de preço
    if (req.query.precoMin || req.query.precoMax) {
      filtro.preco = {};
      if (req.query.precoMin) filtro.preco.$gte = parseFloat(req.query.precoMin);
      if (req.query.precoMax) filtro.preco.$lte = parseFloat(req.query.precoMax);
    }
    
    // Busca por texto
    if (req.query.busca) {
      filtro.$text = { $search: req.query.busca };
    }
    
    // Ordenação
    let ordenacao = {};
    switch (req.query.ordenar) {
      case 'preco_asc':
        ordenacao = { preco: 1 };
        break;
      case 'preco_desc':
        ordenacao = { preco: -1 };
        break;
      case 'nome':
        ordenacao = { nome: 1 };
        break;
      case 'avaliacao':
        ordenacao = { mediaAvaliacoes: -1 };
        break;
      case 'lancamento':
        ordenacao = { dataCadastro: -1 };
        break;
      default:
        ordenacao = { destaque: -1, dataCadastro: -1 };
    }
    
    // Executar consulta
    const [perfumes, total] = await Promise.all([
      Perfume.find(filtro)
        .sort(ordenacao)
        .skip(pular)
        .limit(limite)
        .select('-avaliacoes')
        .lean(),
      Perfume.countDocuments(filtro)
    ]);
    
    console.log(`✅ ${perfumes.length} perfumes encontrados de ${total} total`);
    
    // Calcular preços atuais
    const perfumesComPreco = perfumes.map(perfume => ({
      ...perfume,
      precoAtual: perfume.precoPromocional || perfume.preco,
      desconto: perfume.precoPromocional 
        ? Math.round(((perfume.preco - perfume.precoPromocional) / perfume.preco) * 100)
        : 0
    }));
    
    res.json({
      success: true,
      quantidade: perfumes.length,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite),
      data: perfumesComPreco
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar perfumes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar perfumes',
      error: error.message
    });
  }
};

// @desc    Buscar perfume por ID
// @route   GET /api/perfumes/:id
// @access  Public
exports.buscarPerfume = async (req, res) => {
  try {
    console.log(`🔍 Buscando perfume ID: ${req.params.id}`);
    
    const perfume = await Perfume.findById(req.params.id)
      .populate('avaliacoes.usuario', 'nome avatar');
    
    if (!perfume) {
      return res.status(404).json({
        success: false,
        message: 'Perfume não encontrado'
      });
    }
    
    // Incrementar visualizações (se tiver esse campo)
    // perfume.visualizacoes += 1;
    // await perfume.save();
    
    // Buscar perfumes relacionados
    const relacionados = await Perfume.find({
      _id: { $ne: perfume._id },
      $or: [
        { marca: perfume.marca },
        { familiaOlfativa: perfume.familiaOlfativa },
        { genero: perfume.genero }
      ],
      disponivel: true
    })
    .limit(4)
    .select('nome marca preco precoPromocional imagens')
    .lean();
    
    console.log('✅ Perfume encontrado:', perfume.nome);
    
    res.json({
      success: true,
      data: perfume,
      relacionados
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar perfume:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perfume',
      error: error.message
    });
  }
};

// @desc    Criar perfume (Admin)
// @route   POST /api/perfumes
// @access  Private/Admin
exports.criarPerfume = async (req, res) => {
  try {
    console.log('➕ Criando novo perfume...');
    
    const perfume = await Perfume.create(req.body);
    
    console.log('✅ Perfume criado:', perfume.nome);
    
    res.status(201).json({
      success: true,
      data: perfume
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar perfume:', error);
    
    if (error.name === 'ValidationError') {
      const mensagens = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: mensagens
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao criar perfume',
      error: error.message
    });
  }
};

// @desc    Atualizar perfume
// @route   PUT /api/perfumes/:id
// @access  Private/Admin
exports.atualizarPerfume = async (req, res) => {
  try {
    console.log(`✏️ Atualizando perfume ID: ${req.params.id}`);
    
    const perfume = await Perfume.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // Retorna o documento atualizado
        runValidators: true // Executa as validações do schema
      }
    );
    
    if (!perfume) {
      return res.status(404).json({
        success: false,
        message: 'Perfume não encontrado'
      });
    }
    
    console.log('✅ Perfume atualizado:', perfume.nome);
    
    res.json({
      success: true,
      data: perfume
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar perfume:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar perfume',
      error: error.message
    });
  }
};

// @desc    Deletar perfume
// @route   DELETE /api/perfumes/:id
// @access  Private/Admin
exports.deletarPerfume = async (req, res) => {
  try {
    console.log(`🗑️ Deletando perfume ID: ${req.params.id}`);
    
    const perfume = await Perfume.findByIdAndDelete(req.params.id);
    
    if (!perfume) {
      return res.status(404).json({
        success: false,
        message: 'Perfume não encontrado'
      });
    }
    
    console.log('✅ Perfume deletado:', perfume.nome);
    
    res.json({
      success: true,
      message: 'Perfume removido com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar perfume:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar perfume',
      error: error.message
    });
  }
};

// @desc    Avaliar perfume
// @route   POST /api/perfumes/:id/avaliar
// @access  Private
exports.avaliarPerfume = async (req, res) => {
  try {
    console.log(`⭐ Avaliando perfume ID: ${req.params.id}`);
    
    const { nota, comentario } = req.body;
    
    const perfume = await Perfume.findById(req.params.id);
    
    if (!perfume) {
      return res.status(404).json({
        success: false,
        message: 'Perfume não encontrado'
      });
    }
    
    // Verificar se usuário já avaliou
    const avaliacaoExistente = perfume.avaliacoes.find(
      aval => aval.usuario.toString() === req.usuario.id
    );
    
    if (avaliacaoExistente) {
      return res.status(400).json({
        success: false,
        message: 'Você já avaliou este perfume'
      });
    }
    
    // Adicionar avaliação
    perfume.avaliacoes.push({
      usuario: req.usuario.id,
      nota,
      comentario
    });
    
    await perfume.save();
    
    console.log('✅ Perfume avaliado com sucesso');
    
    res.json({
      success: true,
      message: 'Avaliação registrada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao avaliar perfume:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao avaliar perfume',
      error: error.message
    });
  }
};

// @desc    Buscar perfumes por filtros específicos
// @route   GET /api/perfumes/filtros
// @access  Public
exports.buscarFiltros = async (req, res) => {
  try {
    console.log('🔍 Buscando filtros disponíveis...');
    
    const [marcas, categorias, tipos, generos] = await Promise.all([
      Perfume.distinct('marca'),
      Perfume.distinct('categoria'),
      Perfume.distinct('tipo'),
      Perfume.distinct('genero')
    ]);
    
    const precoMaximo = await Perfume.findOne({}, { preco: 1 })
      .sort({ preco: -1 })
      .limit(1);
    
    res.json({
      success: true,
      data: {
        marcas: marcas.sort(),
        categorias,
        tipos,
        generos,
        precoMaximo: precoMaximo?.preco || 1000
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar filtros:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar filtros',
      error: error.message
    });
  }
};
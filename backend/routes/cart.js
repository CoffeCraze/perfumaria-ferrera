const express = require('express');
const router = express.Router();
const { proteger } = require('../middleware/auth');
const Cart = require('../models/Cart');
const Perfume = require('../models/Perfume');

// @desc    Buscar carrinho do usuário
// @route   GET /api/cart
// @access  Private
router.get('/', proteger, async (req, res) => {
  try {
    console.log('🛒 Buscando carrinho...');
    
    let cart = await Cart.findOne({ usuario: req.usuario.id })
      .populate('itens.perfume', 'nome preco precoPromocional imagens estoque');
    
    // Se não existe carrinho, cria um vazio
    if (!cart) {
      cart = await Cart.create({
        usuario: req.usuario.id,
        itens: []
      });
      console.log('📦 Novo carrinho criado');
    }
    
    // Atualizar preços e verificar disponibilidade
    let precisaAtualizar = false;
    
    for (let item of cart.itens) {
      if (item.perfume) {
        const precoAtual = item.perfume.precoPromocional || item.perfume.preco;
        
        // Verificar se preço mudou
        if (item.preco !== precoAtual) {
          item.preco = precoAtual;
          precisaAtualizar = true;
        }
        
        // Verificar se estoque mudou
        if (item.quantidade > item.perfume.estoque) {
          if (item.perfume.estoque > 0) {
            item.quantidade = item.perfume.estoque;
          } else {
            // Remove item sem estoque
            cart.itens = cart.itens.filter(i => i.perfume._id.toString() !== item.perfume._id.toString());
          }
          precisaAtualizar = true;
        }
      }
    }
    
    if (precisaAtualizar) {
      await cart.save();
      console.log('🔄 Carrinho atualizado com novos preços/estoque');
    }
    
    // Calcular totais
    const subtotal = cart.itens.reduce((sum, item) => {
      return sum + (item.preco * item.quantidade);
    }, 0);
    
    const quantidadeItens = cart.itens.reduce((sum, item) => sum + item.quantidade, 0);
    
    console.log(`✅ Carrinho encontrado: ${cart.itens.length} itens`);
    
    res.json({
      success: true,
      data: {
        ...cart.toObject(),
        subtotal,
        quantidadeItens
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar carrinho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar carrinho',
      error: error.message
    });
  }
});

// @desc    Adicionar item ao carrinho
// @route   POST /api/cart/adicionar
// @access  Private
router.post('/adicionar', proteger, async (req, res) => {
  try {
    console.log('➕ Adicionando item ao carrinho...');
    
    const { perfumeId, quantidade = 1 } = req.body;
    
    if (!perfumeId) {
      return res.status(400).json({
        success: false,
        message: 'ID do perfume é obrigatório'
      });
    }
    
    // Verificar se perfume existe e tem estoque
    const perfume = await Perfume.findById(perfumeId);
    
    if (!perfume) {
      return res.status(404).json({
        success: false,
        message: 'Perfume não encontrado'
      });
    }
    
    if (perfume.estoque < quantidade) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade indisponível em estoque',
        estoqueDisponivel: perfume.estoque
      });
    }
    
    // Buscar ou criar carrinho
    let cart = await Cart.findOne({ usuario: req.usuario.id });
    
    if (!cart) {
      cart = await Cart.create({
        usuario: req.usuario.id,
        itens: []
      });
    }
    
    // Verificar se item já existe no carrinho
    const itemExistente = cart.itens.find(
      item => item.perfume.toString() === perfumeId
    );
    
    if (itemExistente) {
      // Atualizar quantidade
      const novaQuantidade = itemExistente.quantidade + quantidade;
      
      if (novaQuantidade > perfume.estoque) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade total excede o estoque disponível',
          estoqueDisponivel: perfume.estoque,
          quantidadeAtual: itemExistente.quantidade
        });
      }
      
      itemExistente.quantidade = novaQuantidade;
      itemExistente.preco = perfume.precoPromocional || perfume.preco;
      
      console.log(`📊 Quantidade atualizada: ${novaQuantidade}`);
    } else {
      // Adicionar novo item
      cart.itens.push({
        perfume: perfumeId,
        quantidade,
        preco: perfume.precoPromocional || perfume.preco
      });
      
      console.log('🆕 Novo item adicionado ao carrinho');
    }
    
    await cart.save();
    
    // Populate para retornar dados completos
    await cart.populate('itens.perfume', 'nome preco precoPromocional imagens estoque');
    
    res.json({
      success: true,
      data: cart
    });
    
  } catch (error) {
    console.error('❌ Erro ao adicionar ao carrinho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar item ao carrinho',
      error: error.message
    });
  }
});

// @desc    Atualizar quantidade do item
// @route   PUT /api/cart/atualizar/:itemId
// @access  Private
router.put('/atualizar/:itemId', proteger, async (req, res) => {
  try {
    console.log('🔄 Atualizando quantidade...');
    
    const { quantidade } = req.body;
    const { itemId } = req.params;
    
    if (!quantidade || quantidade < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade inválida'
      });
    }
    
    let cart = await Cart.findOne({ usuario: req.usuario.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrinho não encontrado'
      });
    }
    
    const item = cart.itens.id(itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado no carrinho'
      });
    }
    
    // Verificar estoque
    const perfume = await Perfume.findById(item.perfume);
    
    if (quantidade > perfume.estoque) {
      return res.status(400).json({
        success: false,
        message: 'Quantidade indisponível em estoque',
        estoqueDisponivel: perfume.estoque
      });
    }
    
    item.quantidade = quantidade;
    await cart.save();
    
    console.log(`✅ Quantidade atualizada para ${quantidade}`);
    
    res.json({
      success: true,
      data: cart
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar quantidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar item',
      error: error.message
    });
  }
});

// @desc    Remover item do carrinho
// @route   DELETE /api/cart/remover/:itemId
// @access  Private
router.delete('/remover/:itemId', proteger, async (req, res) => {
  try {
    console.log('🗑️ Removendo item do carrinho...');
    
    let cart = await Cart.findOne({ usuario: req.usuario.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrinho não encontrado'
      });
    }
    
    // Remover item
    cart.itens = cart.itens.filter(
      item => item._id.toString() !== req.params.itemId
    );
    
    await cart.save();
    
    console.log('✅ Item removido do carrinho');
    
    res.json({
      success: true,
      data: cart
    });
    
  } catch (error) {
    console.error('❌ Erro ao remover item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover item',
      error: error.message
    });
  }
});

// @desc    Limpar carrinho
// @route   DELETE /api/cart/limpar
// @access  Private
router.delete('/limpar', proteger, async (req, res) => {
  try {
    console.log('🧹 Limpando carrinho...');
    
    let cart = await Cart.findOne({ usuario: req.usuario.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrinho não encontrado'
      });
    }
    
    cart.itens = [];
    await cart.save();
    
    console.log('✅ Carrinho limpo com sucesso');
    
    res.json({
      success: true,
      message: 'Carrinho limpo com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao limpar carrinho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar carrinho',
      error: error.message
    });
  }
});

// @desc    Aplicar cupom de desconto
// @route   POST /api/cart/cupom
// @access  Private
router.post('/cupom', proteger, async (req, res) => {
  try {
    console.log('🏷️ Aplicando cupom...');
    
    const { codigo } = req.body;
    
    if (!codigo) {
      return res.status(400).json({
        success: false,
        message: 'Código do cupom é obrigatório'
      });
    }
    
    // Aqui você implementaria a lógica de validação do cupom
    // Exemplo de cupons válidos (em produção, viria do banco)
    const cuponsValidos = {
      'FERREIRA10': { tipo: 'percentual', valor: 10 },
      'PERFUME20': { tipo: 'percentual', valor: 20 },
      'FRETE50': { tipo: 'fixo', valor: 50 }
    };
    
    const cupom = cuponsValidos[codigo.toUpperCase()];
    
    if (!cupom) {
      return res.status(400).json({
        success: false,
        message: 'Cupom inválido ou expirado'
      });
    }
    
    // Buscar carrinho
    const cart = await Cart.findOne({ usuario: req.usuario.id });
    
    if (!cart || cart.itens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Carrinho vazio'
      });
    }
    
    // Calcular desconto
    const subtotal = cart.itens.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    
    let desconto;
    if (cupom.tipo === 'percentual') {
      desconto = (subtotal * cupom.valor) / 100;
    } else {
      desconto = cupom.valor;
    }
    
    console.log(`✅ Cupom aplicado: ${codigo} - Desconto: R$ ${desconto.toFixed(2)}`);
    
    res.json({
      success: true,
      data: {
        codigo: codigo.toUpperCase(),
        tipo: cupom.tipo,
        valorOriginal: cupom.valor,
        descontoCalculado: desconto,
        subtotal,
        totalComDesconto: subtotal - desconto
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao aplicar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aplicar cupom',
      error: error.message
    });
  }
});

module.exports = router;
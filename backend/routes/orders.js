const express = require('express');
const router = express.Router();
const { proteger } = require('../middleware/auth');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Perfume = require('../models/Perfume');
const { createPixPayment, checkPaymentStatus } = require('../config/mercadopago');

// @desc    Criar pedido
// @route   POST /api/orders
// @access  Private
router.post('/', proteger, async (req, res) => {
  try {
    console.log('🛍️ Criando novo pedido...');
    
    const { enderecoId, cupom } = req.body;
    
    // Buscar carrinho do usuário
    const cart = await Cart.findOne({ usuario: req.usuario.id })
      .populate('itens.perfume');
    
    if (!cart || cart.itens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Carrinho está vazio'
      });
    }
    
    // Buscar usuário para pegar endereço
    const User = require('../models/User');
    const usuario = await User.findById(req.usuario.id);
    
    // Encontrar endereço selecionado
    const endereco = enderecoId 
      ? usuario.enderecos.id(enderecoId)
      : usuario.enderecos.find(end => end.principal);
    
    if (!endereco) {
      return res.status(400).json({
        success: false,
        message: 'Endereço de entrega não encontrado'
      });
    }
    
    // Verificar estoque de todos os itens
    for (let item of cart.itens) {
      if (item.quantidade > item.perfume.estoque) {
        return res.status(400).json({
          success: false,
          message: `Estoque insuficiente para ${item.perfume.nome}`,
          estoqueDisponivel: item.perfume.estoque
        });
      }
    }
    
    // Criar itens do pedido
    const itensPedido = cart.itens.map(item => ({
      perfume: item.perfume._id,
      nome: item.perfume.nome,
      preco: item.perfume.precoPromocional || item.perfume.preco,
      quantidade: item.quantidade,
      subtotal: (item.perfume.precoPromocional || item.perfume.preco) * item.quantidade,
      imagem: item.perfume.imagens[0]?.url
    }));
    
    // Calcular totais
    const subtotal = itensPedido.reduce((sum, item) => sum + item.subtotal, 0);
    const frete = 0; // Você pode implementar cálculo de frete depois
    const desconto = 0; // Você pode implementar cupons depois
    
    // Criar pedido
    const pedido = await Order.create({
      usuario: req.usuario.id,
      itens: itensPedido,
      pagamento: {
        metodo: 'pix',
        status: 'pendente'
      },
      entrega: {
        endereco: {
          cep: endereco.cep,
          rua: endereco.rua,
          numero: endereco.numero,
          complemento: endereco.complemento,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          estado: endereco.estado
        }
      },
      subtotal,
      frete,
      desconto,
      total: subtotal + frete - desconto
    });
    
    console.log('✅ Pedido criado:', pedido.numeroPedido);
    
    // Gerar pagamento PIX
    console.log('💰 Gerando pagamento PIX...');
    
    const paymentData = {
      transactionAmount: pedido.total,
      description: `Pedido ${pedido.numeroPedido} - Perfumaria Ferrera`,
      email: usuario.email,
      firstName: usuario.nome.split(' ')[0],
      lastName: usuario.nome.split(' ').slice(1).join(' ') || '',
      cpf: usuario.cpf?.replace(/\D/g, '') || '12345678909', // CPF padrão para testes
      items: itensPedido.map(item => ({
        id: item.perfume.toString(),
        title: item.nome,
        description: `Perfume ${item.nome}`,
        quantity: item.quantidade,
        unit_price: item.preco
      }))
    };
    
    try {
      const pixResult = await createPixPayment(paymentData);
      
      // Atualizar pedido com informações do PIX
      pedido.pagamento.idExterno = pixResult.paymentId;
      pedido.pagamento.qrCode = pixResult.qrCode;
      pedido.pagamento.qrCodeBase64 = pixResult.qrCodeBase64;
      pedido.pagamento.copiaCola = pixResult.copyPaste;
      pedido.pagamento.dataExpiracao = pixResult.expirationDate;
      await pedido.save();
      
      console.log('✅ Pagamento PIX gerado com sucesso');
      
      // Limpar carrinho após criar pedido
      cart.itens = [];
      await cart.save();
      
      // Atualizar estoque (reserva)
      for (let item of cart.itens) {
        await Perfume.findByIdAndUpdate(item.perfume._id, {
          $inc: { estoque: -item.quantidade }
        });
      }
      
      res.status(201).json({
        success: true,
        data: {
          pedido: {
            numeroPedido: pedido.numeroPedido,
            total: pedido.total,
            status: pedido.statusPedido
          },
          pagamento: {
            qrCode: pixResult.qrCode,
            qrCodeBase64: pixResult.qrCodeBase64,
            copiaCola: pixResult.copyPaste,
            dataExpiracao: pixResult.expirationDate
          }
        }
      });
      
    } catch (pixError) {
      console.error('❌ Erro ao gerar PIX:', pixError);
      
      // Se falhar o PIX, cancela o pedido
      pedido.statusPedido = 'pedido_cancelado';
      pedido.pagamento.status = 'cancelado';
      await pedido.save();
      
      return res.status(500).json({
        success: false,
        message: 'Erro ao gerar pagamento PIX. Tente novamente.',
        error: pixError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar pedido',
      error: error.message
    });
  }
});

// @desc    Listar pedidos do usuário
// @route   GET /api/orders
// @access  Private
router.get('/', proteger, async (req, res) => {
  try {
    console.log('📋 Listando pedidos...');
    
    const pedidos = await Order.find({ usuario: req.usuario.id })
      .sort({ dataPedido: -1 })
      .populate('itens.perfume', 'nome imagens');
    
    console.log(`✅ ${pedidos.length} pedidos encontrados`);
    
    res.json({
      success: true,
      quantidade: pedidos.length,
      data: pedidos
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar pedidos',
      error: error.message
    });
  }
});

// @desc    Buscar pedido específico
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', proteger, async (req, res) => {
  try {
    console.log(`🔍 Buscando pedido: ${req.params.id}`);
    
    const pedido = await Order.findOne({
      _id: req.params.id,
      usuario: req.usuario.id
    }).populate('itens.perfume');
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }
    
    // Se o pedido tem pagamento pendente, verificar status
    if (pedido.pagamento.status === 'pendente' && pedido.pagamento.idExterno) {
      try {
        const statusPagamento = await checkPaymentStatus(pedido.pagamento.idExterno);
        
        // Atualizar status do pedido se necessário
        if (statusPagamento.status !== pedido.pagamento.status) {
          pedido.pagamento.status = statusPagamento.status;
          
          if (statusPagamento.status === 'approved') {
            pedido.statusPedido = 'pagamento_confirmado';
            pedido.pagamento.dataPagamento = new Date();
            pedido.pagamento.valorPago = statusPagamento.amount;
          }
          
          await pedido.save();
          console.log(`📊 Status do pagamento atualizado: ${statusPagamento.status}`);
        }
      } catch (error) {
        console.error('⚠️ Erro ao verificar status do pagamento:', error);
        // Não bloqueia a resposta por causa do erro na verificação
      }
    }
    
    console.log('✅ Pedido encontrado:', pedido.numeroPedido);
    
    res.json({
      success: true,
      data: pedido
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar pedido',
      error: error.message
    });
  }
});

// @desc    Verificar status do pagamento
// @route   GET /api/orders/:id/status-pagamento
// @access  Private
router.get('/:id/status-pagamento', proteger, async (req, res) => {
  try {
    console.log(`🔍 Verificando pagamento do pedido: ${req.params.id}`);
    
    const pedido = await Order.findOne({
      _id: req.params.id,
      usuario: req.usuario.id
    });
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }
    
    if (!pedido.pagamento.idExterno) {
      return res.status(400).json({
        success: false,
        message: 'Pagamento não encontrado para este pedido'
      });
    }
    
    const statusPagamento = await checkPaymentStatus(pedido.pagamento.idExterno);
    
    // Atualizar pedido se status mudou
    if (statusPagamento.status !== pedido.pagamento.status) {
      pedido.pagamento.status = statusPagamento.status;
      
      if (statusPagamento.status === 'approved') {
        pedido.statusPedido = 'pagamento_confirmado';
        pedido.pagamento.dataPagamento = new Date();
        pedido.pagamento.valorPago = statusPagamento.amount;
      }
      
      await pedido.save();
    }
    
    console.log(`📊 Status: ${statusPagamento.status}`);
    
    res.json({
      success: true,
      data: {
        status: statusPagamento.status,
        statusDetail: statusPagamento.statusDetail,
        pedidoStatus: pedido.statusPedido
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status do pagamento',
      error: error.message
    });
  }
});

// @desc    Webhook do Mercado Pago
// @route   POST /api/orders/webhook
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    console.log('📡 Webhook recebido do Mercado Pago');
    console.log('Dados:', JSON.stringify(req.body, null, 2));
    
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const paymentId = data.id;
      
      // Verificar status do pagamento
      const statusPagamento = await checkPaymentStatus(paymentId);
      
      // Encontrar pedido pelo ID externo
      const pedido = await Order.findOne({
        'pagamento.idExterno': paymentId
      });
      
      if (pedido) {
        // Atualizar status do pedido
        pedido.pagamento.status = statusPagamento.status;
        
        if (statusPagamento.status === 'approved') {
          pedido.statusPedido = 'pagamento_confirmado';
          pedido.pagamento.dataPagamento = new Date();
          pedido.pagamento.valorPago = statusPagamento.amount;
          
          console.log('✅ Pagamento confirmado para pedido:', pedido.numeroPedido);
        } else if (statusPagamento.status === 'rejected' || statusPagamento.status === 'cancelled') {
          pedido.statusPedido = 'pedido_cancelado';
          
          // Devolver itens ao estoque
          for (let item of pedido.itens) {
            await Perfume.findByIdAndUpdate(item.perfume, {
              $inc: { estoque: item.quantidade }
            });
          }
          
          console.log('❌ Pedido cancelado:', pedido.numeroPedido);
        }
        
        await pedido.save();
      }
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
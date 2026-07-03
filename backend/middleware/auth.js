const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware de proteção de rotas
 * Verifica se o usuário está autenticado
 */
exports.proteger = async (req, res, next) => {
  try {
    console.log('🔒 Verificando autenticação...');
    
    let token;
    
    // Verificar se o token está no header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extrair token do header
      token = req.headers.authorization.split(' ')[1];
      console.log('📝 Token encontrado no header');
    }
    
    // Verificar se token existe
    if (!token) {
      console.log('❌ Token não fornecido');
      return res.status(401).json({
        success: false,
        message: 'Acesso não autorizado. Faça login para continuar.'
      });
    }
    
    try {
      // Verificar e decodificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token válido para usuário:', decoded.id);
      
      // Buscar usuário no banco
      const usuario = await User.findById(decoded.id).select('-senha');
      
      if (!usuario) {
        console.log('❌ Usuário não encontrado');
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado. Token inválido.'
        });
      }
      
      // Verificar se usuário está ativo
      if (!usuario.ativo) {
        console.log('❌ Usuário desativado');
        return res.status(401).json({
          success: false,
          message: 'Conta desativada. Entre em contato com o suporte.'
        });
      }
      
      // Adicionar usuário ao objeto request
      req.usuario = {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      };
      
      console.log('🔓 Autenticação confirmada para:', usuario.email);
      next();
      
    } catch (jwtError) {
      console.error('❌ Erro no token JWT:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado. Faça login novamente.'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token inválido. Faça login novamente.'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno de autenticação',
      error: error.message
    });
  }
};

/**
 * Middleware de autorização para admin
 * Verifica se o usuário é administrador
 */
exports.admin = (req, res, next) => {
  console.log('👑 Verificando permissão de admin...');
  console.log('Role do usuário:', req.usuario.role);
  
  if (req.usuario && req.usuario.role === 'admin') {
    console.log('✅ Acesso de admin autorizado');
    next();
  } else {
    console.log('❌ Acesso negado: usuário não é admin');
    res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas administradores podem realizar esta ação.'
    });
  }
};

/**
 * Middleware opcional de autenticação
 * Não bloqueia a requisição, mas adiciona usuário se token existir
 */
exports.opcional = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await User.findById(decoded.id).select('-senha');
      
      if (usuario && usuario.ativo) {
        req.usuario = {
          id: usuario._id,
          nome: usuario.nome,
          email: usuario.email,
          role: usuario.role
        };
      }
    }
    
    next();
    
  } catch (error) {
    // Não bloqueia, apenas ignora token inválido
    next();
  }
};
/**
 * Middleware de tratamento de erros global
 */
const errorHandler = (err, req, res, next) => {
  console.error('🚨 ERRO GLOBAL:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code
  });

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const mensagens = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: mensagens
    });
  }

  // Erro de ID inválido do Mongoose
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Recurso não encontrado. ID inválido.'
    });
  }

  // Erro de duplicidade
  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Já existe um registro com este ${campo}`
    });
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  // Erro padrão
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
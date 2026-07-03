const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares basicos
app.use(cors());
app.use(express.json());

// Pegar URI do .env
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/perfumaria_ferrera';

console.log('URI:', MONGODB_URI);

// Conectar ao MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado!');
    
    // Iniciar servidor so depois de conectar
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log('🚀 Servidor rodando na porta ' + PORT);
      console.log('🌐 http://localhost:' + PORT);
    });
  })
  .catch(err => {
    console.error('❌ Erro MongoDB:', err.message);
  });

// Rotas
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

// Importar rotas (com try-catch para nao quebrar)
try {
  app.use('/api/perfumes', require('./routes/perfumes'));
  console.log('✅ Rotas de perfumes carregadas');
} catch(e) {
  console.log('⚠️ Rotas de perfumes nao carregadas:', e.message);
}

try {
  app.use('/api/auth', require('./routes/auth'));
  console.log('✅ Rotas de auth carregadas');
} catch(e) {
  console.log('⚠️ Rotas de auth nao carregadas:', e.message);
}

try {
  app.use('/api/cart', require('./routes/cart'));
  console.log('✅ Rotas de cart carregadas');
} catch(e) {
  console.log('⚠️ Rotas de cart nao carregadas:', e.message);
}

try {
  app.use('/api/orders', require('./routes/orders'));
  console.log('✅ Rotas de orders carregadas');
} catch(e) {
  console.log('⚠️ Rotas de orders nao carregadas:', e.message);
}

module.exports = app;
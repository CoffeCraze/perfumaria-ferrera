const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/perfumaria_ferrera';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB conectado!');
})
.catch(err => {
  console.error('❌ Erro MongoDB:', err.message);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('🚀 Servidor rodando na porta ' + PORT);
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

app.use('/api/auth', require('./routes/auth'));

app.get('/api/perfumes', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const perfumes = await db.collection('perfumes').find({}).toArray();
    res.json({ success: true, data: perfumes });
  } catch(e) {
    res.json({ success: true, data: [] });
  }
});

module.exports = app;
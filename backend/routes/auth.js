const express = require('express');
const router = express.Router();

// Rota de login normal
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    console.log('Tentativa de login:', email);

    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const db = mongoose.connection.db;

    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
    }

    if (!user.senha) {
      return res.status(401).json({ success: false, message: 'Use o login do Google para esta conta' });
    }

    const senhaCorreta = await bcrypt.compare(senha, user.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET || 'ferrera_secret',
      { expiresIn: '30d' }
    );

    console.log('Login bem sucedido:', email);

    res.json({
      success: true,
      data: {
        token,
        usuario: {
          id: user._id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          avatar: user.avatar || ''
        }
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Rota de registro
router.post('/registro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    console.log('Tentativa de registro:', email);

    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const db = mongoose.connection.db;

    const existe = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(400).json({ success: false, message: 'Email ja cadastrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const result = await db.collection('users').insertOne({
      nome,
      email: email.toLowerCase(),
      senha: senhaHash,
      role: 'cliente',
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const token = jwt.sign(
      { id: result.insertedId.toString() },
      process.env.JWT_SECRET || 'ferrera_secret',
      { expiresIn: '30d' }
    );

    console.log('Registro bem sucedido:', email);

    res.status(201).json({
      success: true,
      data: {
        token,
        usuario: {
          id: result.insertedId,
          nome,
          email,
          role: 'cliente'
        }
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Rota de login com Google
router.post('/google', async (req, res) => {
  try {
    const { nome, email, googleId, avatar } = req.body;
    console.log('Login Google:', email);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email é obrigatório' });
    }

    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    const db = mongoose.connection.db;

    // Verificar se usuário já existe
    let user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      // Criar novo usuário
      const result = await db.collection('users').insertOne({
        nome: nome || email.split('@')[0],
        email: email.toLowerCase(),
        googleId: googleId || '',
        avatar: avatar || '',
        role: 'cliente',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      user = await db.collection('users').findOne({ _id: result.insertedId });
      console.log('Novo usuário Google criado:', email);
    } else {
      // Atualizar dados do Google se necessário
      if (googleId && !user.googleId) {
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { googleId, avatar: avatar || user.avatar } }
        );
      }
    }

    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET || 'ferrera_secret',
      { expiresIn: '30d' }
    );

    console.log('Login Google bem sucedido:', email);

    res.json({
      success: true,
      data: {
        token,
        usuario: {
          id: user._id,
          nome: user.nome,
          email: user.email,
          role: user.role,
          avatar: user.avatar || ''
        }
      }
    });

  } catch (error) {
    console.error('Erro login Google:', error);
    res.status(500).json({ success: false, message: 'Erro ao fazer login com Google' });
  }
});

// Rota de perfil
router.get('/perfil', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Nao autorizado' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ferrera_secret');
    
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(decoded.id) 
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario nao encontrado' });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        telefone: user.telefone || '',
        avatar: user.avatar || ''
      }
    });

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(401).json({ success: false, message: 'Token invalido' });
  }
});

module.exports = router;
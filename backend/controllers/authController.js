const User = require('../models/User');
const jwt = require('jsonwebtoken');

const gerarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ success: false, message: 'Email e senha obrigatorios' });
    }

    // Buscar usuario - usando a colecao diretamente
    const db = require('mongoose').connection.db;
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
    }

    // Verificar senha
    const bcrypt = require('bcryptjs');
    const senhaCorreta = await bcrypt.compare(senha, user.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
    }

    // Gerar token
    const token = gerarToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        usuario: {
          id: user._id,
          nome: user.nome,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro ao fazer login' });
  }
};

exports.registrar = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const bcrypt = require('bcryptjs');
    const db = require('mongoose').connection.db;

    // Verificar se ja existe
    const existe = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(400).json({ success: false, message: 'Email ja cadastrado' });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // Criar usuario
    const result = await db.collection('users').insertOne({
      nome,
      email: email.toLowerCase(),
      senha: senhaHash,
      role: 'cliente',
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const user = await db.collection('users').findOne({ _id: result.insertedId });
    const token = gerarToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        usuario: {
          id: user._id,
          nome: user.nome,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ success: false, message: 'Erro ao registrar' });
  }
};

exports.perfil = async (req, res) => {
  try {
    const db = require('mongoose').connection.db;
    const user = await db.collection('users').findOne({ _id: new require('mongoose').Types.ObjectId(req.usuario.id) });
    
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
        telefone: user.telefone
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar perfil' });
  }
};
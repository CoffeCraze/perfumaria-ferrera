const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/perfumaria_ferrera';

async function criarAdmin() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado!\n');

    // Acessar a coleção diretamente
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Verificar se admin já existe
    const adminExiste = await usersCollection.findOne({ email: 'admin@ferrera.com' });
    
    if (adminExiste) {
      console.log('⚠️ Admin já existe!');
      console.log('   Email: admin@ferrera.com');
      console.log('   Senha: admin123');
      await mongoose.connection.close();
      return;
    }

    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash('admin123', salt);

    // Inserir admin diretamente
    const resultado = await usersCollection.insertOne({
      nome: 'Ferrera Admin',
      email: 'admin@ferrera.com',
      senha: senhaHash,
      role: 'admin',
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ ADMIN CRIADO COM SUCESSO!');
    console.log('   ID:', resultado.insertedId);
    console.log('   Nome: Ferrera Admin');
    console.log('   Email: admin@ferrera.com');
    console.log('   Senha: admin123');
    console.log('   Role: admin');
    console.log('');
    console.log('🌐 Acesse: http://localhost:3000/login');

    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

criarAdmin();
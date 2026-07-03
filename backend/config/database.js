const mogoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 Iniciando conexão com MongoDB...');

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Configurações adicionais
      maxPoolSize: 10, // Máximo de conexões simultâneas
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
      socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
    });

    console.log('✅ Conexão com o MongoDB estabelecida com sucesso!');
    console.log('📊 Database:', conn.connection.db.databaseName);

    // Lista todas as coleções do banco de dados
    const collections = await conn.connection.db.listCollections().toArray();
     console.log('📚 Coleções existentes:', collections.map(c => c.name).join(', ') || 'Nenhuma');

     return conn;
  } catch (err) {
    console.error('❌ Erro fatal ao conectar MongoDB:', {
      message: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack
    });
    process.exit(1);
  }
};

module.exports = connectDB;
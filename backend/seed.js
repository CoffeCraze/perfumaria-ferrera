const mongoose = require('mongoose');
require('dotenv').config();

// Conectar ao MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/perfumaria_ferrera';

console.log('🔄 Conectando ao MongoDB...');
console.log('URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado!');
    executarSeed();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  });

async function executarSeed() {
  try {
    console.log('\n🌱 INICIANDO SEED DO BANCO DE DADOS...\n');

    // Importar modelos
    const User = require('./models/User');
    const Perfume = require('./models/Perfume');

    // 1. LIMPAR DADOS ANTIGOS
    console.log('1️⃣ Limpando dados antigos...');
    await User.deleteMany({});
    await Perfume.deleteMany({});
    console.log('✅ Dados antigos removidos\n');

    // 2. CRIAR ADMIN
    console.log('2️⃣ Criando usuário ADMIN...');
    
    const adminUser = new User({
      nome: 'Ferrera Admin',
      email: 'admin@ferrera.com',
      senha: 'admin123',
      role: 'admin',
      telefone: '(11) 99999-9999',
      ativo: true
    });

    const adminSalvo = await adminUser.save();
    
    console.log('✅ Admin criado com sucesso!');
    console.log('   Nome:', adminSalvo.nome);
    console.log('   Email:', adminSalvo.email);
    console.log('   Senha: admin123');
    console.log('   Role:', adminSalvo.role);
    console.log('   ID:', adminSalvo._id);
    console.log('');

    // 3. CRIAR PERFUMES
    console.log('3️⃣ Criando perfumes...');

    const perfumes = [
      {
        nome: "212 VIP Black",
        marca: "Carolina Herrera",
        tipo: "Eau de Parfum",
        genero: "Masculino",
        categoria: "Importado",
        familiaOlfativa: "Oriental",
        intensidade: "Intensa",
        descricao: "212 VIP Black é uma fragrância masculina sofisticada e noturna. Perfeito para ocasiões especiais, este perfume combina notas orientais com um toque moderno e sedutor. Ideal para homens confiantes que buscam deixar uma marca inesquecível.",
        descricaoCurta: "Perfume masculino sofisticado e noturno para homens confiantes.",
        preco: 499.90,
        precoPromocional: 399.90,
        volume: 100,
        estoque: 15,
        destaque: true,
        lancamento: true,
        imagens: [
          {
            url: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400",
            alt: "212 VIP Black",
            principal: true
          }
        ],
        tags: ["vip", "noturno", "balada", "sofisticado"],
        notas: {
          topo: ["Absinto", "Anis"],
          coracao: ["Lavanda", "Sálvia"],
          base: ["Couro", "Patchouli", "Baunilha"]
        }
      },
      {
        nome: "La Vie Est Belle",
        marca: "Lancôme",
        tipo: "Eau de Parfum",
        genero: "Feminino",
        categoria: "Importado",
        familiaOlfativa: "Floral",
        intensidade: "Moderada",
        descricao: "La Vie Est Belle é uma declaração de felicidade e liberdade. Esta fragrância feminina icônica combina a doçura da pêra com a elegância do iris, criando um perfume que celebra a beleza da vida.",
        descricaoCurta: "Perfume feminino elegante que celebra a beleza da vida.",
        preco: 599.90,
        volume: 50,
        estoque: 20,
        destaque: true,
        lancamento: false,
        imagens: [
          {
            url: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400",
            alt: "La Vie Est Belle",
            principal: true
          }
        ],
        tags: ["elegante", "floral", "feminino"],
        notas: {
          topo: ["Pêra", "Groselha Preta"],
          coracao: ["Iris", "Jasmim", "Flor de Laranjeira"],
          base: ["Patchouli", "Baunilha", "Pralinê"]
        }
      },
      {
        nome: "Sauvage",
        marca: "Dior",
        tipo: "Eau de Toilette",
        genero: "Masculino",
        categoria: "Importado",
        familiaOlfativa: "Fresco",
        intensidade: "Muito Intensa",
        descricao: "Sauvage é uma fragrância masculina inspirada em paisagens selvagens. Com notas frescas de bergamota e um toque picante, este perfume captura a essência da natureza indomável.",
        descricaoCurta: "Fragrância masculina selvagem e autêntica da Dior.",
        preco: 649.90,
        precoPromocional: 549.90,
        volume: 100,
        estoque: 10,
        destaque: true,
        lancamento: false,
        imagens: [
          {
            url: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400",
            alt: "Sauvage Dior",
            principal: true
          }
        ],
        tags: ["selvagem", "fresco", "masculino"],
        notas: {
          topo: ["Bergamota", "Pimenta"],
          coracao: ["Lavanda", "Gerânio"],
          base: ["Cedro", "Âmbar"]
        }
      },
      {
        nome: "Good Girl",
        marca: "Carolina Herrera",
        tipo: "Eau de Parfum",
        genero: "Feminino",
        categoria: "Importado",
        familiaOlfativa: "Oriental",
        intensidade: "Intensa",
        descricao: "Good Girl é uma fragrância que celebra a dualidade da mulher moderna. O frasco icônico em forma de sapato revela um perfume que combina o doce com o sensual.",
        descricaoCurta: "Perfume feminino que celebra a dualidade da mulher moderna.",
        preco: 529.90,
        precoPromocional: 429.90,
        volume: 80,
        estoque: 12,
        destaque: false,
        lancamento: true,
        imagens: [
          {
            url: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400",
            alt: "Good Girl",
            principal: true
          }
        ],
        tags: ["feminino", "sensual", "moderno"],
        notas: {
          topo: ["Amêndoa", "Café"],
          coracao: ["Jasmim", "Tuberosa"],
          base: ["Cacau", "Fava Tonka"]
        }
      },
      {
        nome: "Acqua di Giò",
        marca: "Giorgio Armani",
        tipo: "Eau de Toilette",
        genero: "Masculino",
        categoria: "Importado",
        familiaOlfativa: "Aquático",
        intensidade: "Moderada",
        descricao: "Acqua di Giò é uma fragrância masculina clássica inspirada no mar Mediterrâneo. Com notas aquáticas e cítricas, este perfume transmite frescor e liberdade.",
        descricaoCurta: "Clássico masculino inspirado no frescor do mar Mediterrâneo.",
        preco: 449.90,
        volume: 125,
        estoque: 18,
        destaque: false,
        lancamento: false,
        imagens: [
          {
            url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400",
            alt: "Acqua di Giò",
            principal: true
          }
        ],
        tags: ["aquático", "fresco", "clássico"],
        notas: {
          topo: ["Limão", "Tangerina", "Bergamota"],
          coracao: ["Jasmim", "Alecrim"],
          base: ["Cedro", "Patchouli", "Musgo"]
        }
      },
      {
        nome: "J'adore",
        marca: "Dior",
        tipo: "Eau de Parfum",
        genero: "Feminino",
        categoria: "Importado",
        familiaOlfativa: "Floral",
        intensidade: "Moderada",
        descricao: "J'adore é uma fragrância feminina que celebra a feminilidade absoluta. Com um buquê floral exuberante, este perfume é um hino à beleza e à elegância.",
        descricaoCurta: "Hino à feminilidade com buquê floral exuberante.",
        preco: 699.90,
        precoPromocional: 599.90,
        volume: 100,
        estoque: 8,
        destaque: true,
        lancamento: false,
        imagens: [
          {
            url: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400",
            alt: "J'adore Dior",
            principal: true
          }
        ],
        tags: ["floral", "feminino", "elegante"],
        notas: {
          topo: ["Bergamota", "Melão"],
          coracao: ["Jasmim", "Rosa", "Lírio"],
          base: ["Cedro", "Baunilha", "Almíscar"]
        }
      }
    ];

    const perfumesSalvos = await Perfume.insertMany(perfumes);
    
    console.log(`✅ ${perfumesSalvos.length} perfumes criados:\n`);
    perfumesSalvos.forEach(p => {
      console.log(`   💐 ${p.nome} - ${p.marca}`);
      console.log(`      Preço: R$ ${p.preco.toFixed(2)} | Estoque: ${p.estoque}`);
      console.log(`      Tipo: ${p.tipo} | Gênero: ${p.genero}\n`);
    });

    console.log('==========================================');
    console.log('🎉 SEED CONCLUÍDO COM SUCESSO!');
    console.log('==========================================');
    console.log('');
    console.log('📧 DADOS DE ACESSO:');
    console.log('   Email: admin@ferrera.com');
    console.log('   Senha: admin123');
    console.log('');
    console.log('🌐 Acesse: http://localhost:3000/login');
    console.log('==========================================');

    // Fechar conexão
    await mongoose.connection.close();
    console.log('🔌 Conexão fechada');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRO NO SEED:');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    
    await mongoose.connection.close();
    process.exit(1);
  }
}
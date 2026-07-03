const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/perfumaria_ferrera';

async function adicionarPerfumes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');
    
    const db = mongoose.connection.db;
    const perfumesCollection = db.collection('perfumes');

    const novosPerfumes = [
      {
        nome: "Bleu de Chanel",
        marca: "Chanel",
        tipo: "Eau de Parfum",
        genero: "Masculino",
        categoria: "Importado",
        familiaOlfativa: "Amadeirado",
        intensidade: "Intensa",
        descricao: "Bleu de Chanel é uma fragrância masculina que representa a liberdade. Com notas amadeiradas e cítricas, é perfeito para o homem moderno e elegante.",
        descricaoCurta: "Fragrância masculina elegante da Chanel",
        preco: 799.90,
        precoPromocional: 699.90,
        volume: 100,
        estoque: 10,
        destaque: true,
        lancamento: false,
        imagens: [{ url: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400", alt: "Bleu de Chanel", principal: true }],
        tags: ["elegante", "amadeirado", "classico"],
        notas: { topo: ["Toranja", "Limão", "Hortelã"], coracao: ["Gengibre", "Noz-moscada", "Jasmim"], base: ["Cedro", "Sândalo", "Incenso"] }
      },
      {
        nome: "Flowerbomb",
        marca: "Viktor & Rolf",
        tipo: "Eau de Parfum",
        genero: "Feminino",
        categoria: "Importado",
        familiaOlfativa: "Oriental",
        intensidade: "Intensa",
        descricao: "Flowerbomb é uma explosão floral. Uma fragrância feminina que combina notas doces e florais, criando um perfume viciante e marcante.",
        descricaoCurta: "Explosão floral feminina de Viktor & Rolf",
        preco: 689.90,
        precoPromocional: null,
        volume: 50,
        estoque: 8,
        destaque: true,
        lancamento: true,
        imagens: [{ url: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400", alt: "Flowerbomb", principal: true }],
        tags: ["floral", "doce", "feminino", "marcante"],
        notas: { topo: ["Bergamota", "Chá"], coracao: ["Jasmim", "Rosa", "Orquídea"], base: ["Baunilha", "Patchouli"] }
      },
      {
        nome: "Invictus",
        marca: "Paco Rabanne",
        tipo: "Eau de Toilette",
        genero: "Masculino",
        categoria: "Importado",
        familiaOlfativa: "Fresco",
        intensidade: "Moderada",
        descricao: "Invictus é uma fragrância masculina esportiva e vitoriosa. Com notas frescas e amadeiradas, representa força e dinamismo.",
        descricaoCurta: "Fragrância masculina esportiva da Paco Rabanne",
        preco: 479.90,
        precoPromocional: 399.90,
        volume: 100,
        estoque: 15,
        destaque: false,
        lancamento: false,
        imagens: [{ url: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400", alt: "Invictus", principal: true }],
        tags: ["esportivo", "fresco", "masculino"],
        notas: { topo: ["Toranja", "Pimenta"], coracao: ["Louro", "Jasmim"], base: ["Âmbar", "Patchouli"] }
      },
      {
        nome: "Coco Mademoiselle",
        marca: "Chanel",
        tipo: "Eau de Parfum",
        genero: "Feminino",
        categoria: "Importado",
        familiaOlfativa: "Oriental",
        intensidade: "Intensa",
        descricao: "Coco Mademoiselle é uma fragrância feminina sofisticada e sensual. Com notas orientais frescas, é ideal para a mulher moderna.",
        descricaoCurta: "Fragrância feminina sofisticada da Chanel",
        preco: 899.90,
        precoPromocional: 799.90,
        volume: 100,
        estoque: 5,
        destaque: true,
        lancamento: false,
        imagens: [{ url: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400", alt: "Coco Mademoiselle", principal: true }],
        tags: ["sofisticado", "sensual", "feminino", "chanel"],
        notas: { topo: ["Laranja", "Bergamota"], coracao: ["Rosa", "Jasmim"], base: ["Patchouli", "Baunilha", "Vetiver"] }
      },
      {
        nome: "One Million",
        marca: "Paco Rabanne",
        tipo: "Eau de Toilette",
        genero: "Masculino",
        categoria: "Importado",
        familiaOlfativa: "Oriental",
        intensidade: "Muito Intensa",
        descricao: "One Million é uma fragrância masculina luxuosa e ousada. Com notas de couro e especiarias, é perfeito para noites especiais.",
        descricaoCurta: "Fragrância masculina luxuosa da Paco Rabanne",
        preco: 549.90,
        volume: 100,
        estoque: 12,
        destaque: false,
        lancamento: false,
        imagens: [{ url: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400", alt: "One Million", principal: true }],
        tags: ["luxuoso", "noturno", "masculino"],
        notas: { topo: ["Toranja", "Hortelã"], coracao: ["Canela", "Rosa"], base: ["Couro", "Âmbar", "Patchouli"] }
      }
    ];

    const resultado = await perfumesCollection.insertMany(novosPerfumes);
    console.log('✅ ' + resultado.insertedCount + ' perfumes adicionados!\n');
    
    resultado.insertedIds.forEach((id, index) => {
      console.log('   💐 ' + novosPerfumes[index].nome + ' - ' + novosPerfumes[index].marca);
    });

    await mongoose.connection.close();
    console.log('\n🔌 Conexao fechada.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

adicionarPerfumes();
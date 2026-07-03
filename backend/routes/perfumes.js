const express = require("express");
const router = express.Router();
const {
  listarPerfumes,
  buscarPerfume,
  criarPerfume,
  atualizarPerfume,
  deletarPerfume,
  avaliarPerfume,
  buscarFiltros,
} = require("../controllers/perfumeController");

const Perfume = require("../models/Perfume");
const { proteger, admin } = require("../middleware/auth");

// ===== ROTAS PÚBLICAS =====

// Rota para listar todos os perfumes com filtros
router.get("/", listarPerfumes);

// Rota para buscar filtros disponíveis (marcas, categorias, etc)
router.get("/filtros", buscarFiltros);

// Rota para buscar perfume específico por ID
router.get("/:id", buscarPerfume);

// ===== ROTAS PROTEGIDAS (precisa estar logado) =====

// Rota para avaliar um perfume
router.post("/:id/avaliar", proteger, avaliarPerfume);

// ===== ROTAS DE ADMIN =====

// Rota para criar novo perfume
router.post("/", proteger, admin, criarPerfume);

// Rota para atualizar perfume
router.put("/:id", proteger, admin, atualizarPerfume);

// Rota para deletar perfume
router.delete("/:id", proteger, admin, deletarPerfume);

// Rota para buscar perfume por slug (URL amigável)
router.get("/slug/:slug", async (req, res) => {
  try {
    console.log(`🔍 Buscando perfume por slug: ${req.params.slug}`);

    const perfume = await Perfume.findOne({ slug: req.params.slug }).populate(
      "avaliacoes.usuario",
      "nome avatar",
    );

    if (!perfume) {
      return res.status(404).json({
        success: false,
        message: "Perfume não encontrado",
      });
    }

    console.log("✅ Perfume encontrado por slug:", perfume.nome);

    res.json({
      success: true,
      data: perfume,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar por slug:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar perfume",
      error: error.message,
    });
  }
});

module.exports = router;

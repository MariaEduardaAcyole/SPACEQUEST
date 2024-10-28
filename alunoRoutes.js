const express = require('express');
const router = express.Router();
const db = require('./supabaseClient'); // Conexão com o banco de dados PostgreSQL

// Rota para listar todas as atividades
router.get('/materia-atividades', async (req, res) => {
   const sql = 'SELECT * FROM Atividade';
   try {
       const results = await db.query(sql);
       res.render('pages/aluno/materia-atividades', { atividades: results.rows });
   } catch (err) {
       console.error('Erro ao buscar as atividades:', err);
       res.status(500).send('Erro ao buscar as atividades.');
   }
});

const entregaController = require('./public/js/entrega-atividade');
router.post('/entrega-atividade/:id', entregaController.upload.single('file'), entregaController.atvEntrega);

// Rota para exibir os detalhes da atividade e o formulário de entrega
router.get('/entrega-atividade/:id', async (req, res) => {
   const atividadeId = req.params.id; // Pega o ID da atividade da URL
   const sucesso = req.query.sucesso; // Captura a mensagem de sucesso, se houver

   // Consulta para buscar os dados da atividade no banco de dados
   const sql = `SELECT * FROM Atividade WHERE ID_Atividade = $1`;
   try {
       const result = await db.query(sql, [atividadeId]);
       if (result.rows.length === 0) {
           return res.status(404).send('Atividade não encontrada.');
       }
       // Renderiza o template passando o objeto atividade e a mensagem de sucesso
       res.render('pages/aluno/entrega-atividade', { atividade: result.rows[0], sucesso });
   } catch (err) {
       console.error('Erro ao buscar detalhes da atividade:', err);
       res.status(500).send('Erro ao buscar detalhes da atividade.');
   }
});

// Rota para outras páginas do aluno
router.get('/home-aluno', (req, res) => {
    res.render('pages/aluno/home');
});

router.get('/pendencias', (req, res) => {
   res.render('pages/aluno/pendencias');
});

router.get('/perfil', (req, res) => {
   res.render('pages/aluno/perfil');
});

router.get('/materias', (req, res) => {
   res.render('pages/aluno/materias');
});

router.get('/materia-mural', (req, res) => {
   res.render('pages/aluno/materia-mural');
});

router.get('/materia-downloads', (req, res) => {
   res.render('pages/aluno/materia-downloads');
});

router.get('/desempenho-individual', (req, res) => {
   res.render('pages/aluno/desempenho-individual');
});

router.get('/desempenho-classe', (req, res) => {
   res.render('pages/aluno/desempenho-classe');
});

router.get('/desempenho-geral', (req, res) => {
   res.render('pages/aluno/desempenho-geral');
});

router.get('/calendario', (req, res) => {
   res.render('pages/aluno/calendario');
});

// Rota para minigame do professor
router.get('/minigame-kart', (req, res) => {
   res.render('pages/prof/minigame-kart');
});

module.exports = router;

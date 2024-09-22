const express = require('express');
const router = express.Router();
const db = require('./db'); // Importa a conexão com o banco de dados

// Importa o controlador de entrega de atividades
const entregaController = require('./public/js/entrega-atividade');

// Rota para listar todas as atividades
router.get('/materia-atividades', (req, res) => {
   const sql = 'SELECT * FROM Atividade';
   db.query(sql, (err, results) => {
       if (err) {
           return res.status(500).send('Erro ao buscar as atividades.');
       }
       res.render('pages/aluno/materia-atividades', { atividades: results });
   });
});

// Rota para submissão de entrega
router.post('/entrega-atividade/:id', entregaController.upload.single('file'), entregaController.atvEntrega);

// Rota para exibir os detalhes da atividade e o formulário de entrega
router.get('/entrega-atividade/:id', (req, res) => {
   const atividadeId = req.params.id; // Pega o ID da atividade da URL
   const sucesso = req.query.sucesso; // Captura a mensagem de sucesso, se houver

   // Consulta para buscar os dados da atividade no banco de dados
   const sql = `SELECT * FROM Atividade WHERE ID_Atividade = ?`;
   db.query(sql, [atividadeId], (err, result) => {
       if (err || result.length === 0) {
           return res.status(404).send('Atividade não encontrada.');
       }

       // Renderiza o template passando o objeto atividade e a mensagem de sucesso
       res.render('pages/aluno/entrega-atividade', { atividade: result[0], sucesso });
   });
});


// Rota para outras páginas do aluno
router.get('/home-aluno', (req, res) => {
    res.render('pages/aluno/home');
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

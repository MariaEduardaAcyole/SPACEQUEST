const express = require('express');
const router = express.Router();
const db = require('./db'); // Importa a conexão com o banco de dados

// Rota para listar todos os professores
router.get('/aluno', (req, res) => {
    const sql = 'SELECT * FROM Atividade';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send('Erro ao buscar professores');
        }
        res.render('pages/aluno/bancoaluno', { atividade: results });
    });
});


/* ROTAS GERAIS*/
router.get('/home-aluno',function(req,res){
    res.render('pages/aluno/home')
});



router.get('/perfil', (req, res) => {
   res.render('pages/aluno/perfil')
});

router.get('/atividade',function(req,res){
   res.render('pages/aluno/atividade')
})

router.get('/materias',function(req,res){
   res.render('pages/aluno/materias')
})

router.get('/materia-mural',function(req,res){
   res.render('pages/aluno/materia-mural')
})

router.get('/materia-downloads',function(req,res){
   res.render('pages/aluno/materia-downloads')
})

router.get('/materia-atividades',function(req,res){
   res.render('pages/aluno/materia-atividades')
})

router.get('/desempenho-individual',function(req,res){
   res.render('pages/aluno/desempenho-individual')
})

router.get('/desempenho-classe',function(req,res){
   res.render('pages/aluno/desempenho-classe')
})

router.get('/desempenho-geral',function(req,res){
   res.render('pages/aluno/desempenho-geral')
})

router.get('/calendario',function(req,res){
   res.render('pages/aluno/calendario')
})

module.exports = router;

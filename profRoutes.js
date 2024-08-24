const express = require('express');
const router = express.Router();
const db = require('./db'); // Importa a conexão com o banco de dados

router.get('/materia-atividades-prof', (req, res) => {
    const sql = 'SELECT * FROM Atividade';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send('Erro ao buscar atividades');
        }
       
        res.render('pages/prof/materia-atividades-prof', { secoes: results });
    });
});


/* ROTAS GERAIS*/
router.get('/home-prof', function (req, res) {
    res.render('pages/prof/home-prof')
})

router.get('/inicio-game-prof', function (req, res) {
    res.render('pages/prof/inicio-game-prof')
})


router.get('/perfil-prof', function (req, res) {
    res.render('pages/prof/perfil-prof')
})

router.get('/addpessoas', function (req, res) {
    res.render('pages/prof/addpessoas')
})

router.get('/novamateria', function (req, res) {
    res.render('pages/prof/novamateria')
})

router.get('/novaturma', function (req, res) {
    res.render('pages/prof/novaturma')
})

router.get('/criar-atividade', function (req, res) {
    res.render('pages/prof/criar-atividade')
})

router.get('/desempenho-geral-prof', function (req, res) {
    res.render('pages/prof/desempenho-geral-prof')
})
router.get('/desempenho-classe-prof', function (req, res) {
    res.render('pages/prof/desempenho-classe-prof')
})

router.get('/materia-mural-prof', function (req, res) {
    res.render('pages/prof/materia-mural-prof')
})

router.get('/materia-downloads-prof', function (req, res) {
    res.render('pages/prof/materia-downloads-prof')
})
router.get('/materia-atividades-prof', function (req, res) {
    res.render('pages/prof/materia-atividades-prof')
})

router.get('/quiz', function (req, res) {
    res.render('pages/prof/quiz')
})

router.get('/minigame-kart', function (req, res) {
    res.render('pages/prof/minigame-kart')
})

router.get('/calendario-prof', function (req, res) {
    res.render('pages/prof/calendario-prof')
})


module.exports = router;

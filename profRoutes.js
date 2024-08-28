const express = require('express');
const router = express.Router();
const db = require('./db'); // Conexão com o banco de dados


router.get('/addatividade', (req, res) => {
    res.render('pages/prof/addatividade', { message: null });
});

router.get('/addmateria', (req, res) => {
    res.render('pages/prof/addmateria', { message: null });
});

router.get('/addpessoas', (req, res) => {
    res.render('pages/prof/addpessoas', { message: null });
});

router.get('/addturma', (req, res) => {
    res.render('pages/prof/addturma', { message: null });
});

router.get('/calendario-prof', (req, res) => {
    res.render('pages/prof/calendario-prof', { message: null });
});

router.get('/desempenho-classe-prof', (req, res) => {
    res.render('pages/prof/desempenho-classe-prof', { message: null });
});
router.get('/desempenho-geral-prof', (req, res) => {
    res.render('pages/prof/desempenho-geral-prof', { message: null });
});

router.get('/home-prof', (req, res) => {
    res.render('pages/prof/home-prof', { message: null });
});


router.get('/inicio-game-prof', (req, res) => {
    res.render('pages/prof/inicio-game-prof', { message: null });
});

router.get('/materia-atividades-prof', (req, res) => {
    res.render('pages/prof/materia-atividades-prof', { message: null });
});

router.get('/materia-downloads-prof', (req, res) => {
    res.render('pages/prof/materia-downloads-prof', { message: null });
});

router.get('/materia-mural-prof', (req, res) => {
    res.render('pages/prof/materia-mural-prof', { message: null });
});

router.get('/minigame-kart-prof', (req, res) => {
    res.render('pages/prof/minigame-kart-prof', { message: null });
});


router.get('/perfil-prof', (req, res) => {
    res.render('pages/prof/perfil-prof', { message: null });
});
router.get('/professores', (req, res) => {
    res.render('pages/prof/professores', { message: null });
});
router.get('/quiz', (req, res) => {
    res.render('pages/prof/quiz', { message: null });
});



module.exports = router; // Exporta o router para uso em outros arquivos

const express = require('express');
const router = express.Router();
const db = require('./db'); 
router.use(express.urlencoded({ extended: true }));


const { getAlunosEMaterias, addTurma } = require('./public/js/addTurma');
const { upload, addAtividade } = require('./public/js/addAtividade'); 
const addMateriasRouter = require('./public/js/addMaterias'); 


// Importa a função de addMinigame.js
const addMinigameRouter = require('./public/js/addMinigame');

// Rota para exibir o formulário de criação de mini-game
router.get('/inicio-game-prof', (req, res) => {
    res.render('pages/prof/inicio-game-prof', { successMessage: null });
});

// Rota para processar a criação de mini-game, redirecionando para addMinigame.js
router.post('/criar-minigame', addMinigameRouter);

// Rota GET para exibir o formulário de criar mini-game

router.get('/inicio-game-prof', (req, res) => {
    res.render('pages/prof/inicio-game-prof', { successMessage: null });
});

// Rota POST para processar a criação de mini-game
router.post('/criar-minigame', (req, res) => {
    sqlInsertGame(req, res);
});


// Função utilitária para lidar com erros
function funcaoErroDb(err, res, errorMsg = 'Erro ao executar a consulta') {
    console.error(errorMsg, err);
    return res.status(500).send(errorMsg);
}

// Rota para exibir o formulário de criar atividade
router.get('/addAtividade', (req, res) => {
    res.render('pages/prof/addAtividade', { successMessage: null });
});

// Rota para processar a criação de atividade
router.post('/addAtividade', upload.single('arquivo'), addAtividade);

// Rota para exibir a página de cadastro de pessoas
router.get('/addpessoas', (req, res) => {
    const sql = 'SELECT * FROM Usuario';
    db.query(sql, (err, results) => {
        if (err) return funcaoErroDb(err, res, 'Erro ao buscar os usuários');
        res.render('pages/prof/addpessoas', { usuarios: results });
    });
});

// Rota GET para exibir a página de cadastro de turmas
router.get('/addTurma', (req, res) => {
    getAlunosEMaterias((err, data) => {
        if (err) return funcaoErroDb(err, res, 'Erro ao buscar dados para a turma');
        const { alunos, materias } = data;
        res.render('pages/prof/addTurma', { alunos, materias });
    });
});

// Rota POST para processar o cadastro de turmas
router.post('/addTurma', (req, res) => {
    addTurma(req, res);
});


// Rota para exibir a página de cadastro de matérias
router.use('/addmateria', addMateriasRouter);

// Rota para exibir atividades de uma matéria com base no ID da matéria
router.get('/materia-atividades-prof/:materiaId', (req, res) => {
    const materiaId = req.params.materiaId;  // Captura o ID da matéria da URL
    console.log('Materia ID:', materiaId);

    db.query('SELECT * FROM atividade WHERE ID_Materia = ?', [materiaId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar atividades:', err);
            res.status(500).send('Erro ao buscar atividades.');
        } else {
            res.render('pages/prof/materia-atividades-prof', { atividades: results });
        }
    });
});

// Rota para páginas simples
function renderSimplePage(page) {
    return (req, res) => res.render(`pages/prof/${page}`, { message: null });
}

// Rotas para páginas simples
router.get('/calendario-prof', renderSimplePage('calendario-prof'));
router.get('/addatividade', renderSimplePage('addatividade'));
router.get('/desempenho-classe-prof', renderSimplePage('desempenho-classe-prof'));
router.get('/desempenho-geral-prof', renderSimplePage('desempenho-geral-prof'));
router.get('/home-prof', renderSimplePage('home-prof'));
router.get('/inicio-game-prof', renderSimplePage('inicio-game-prof'));
router.get('/materia-downloads-prof', renderSimplePage('materia-downloads-prof'));
router.get('/materia-mural-prof', renderSimplePage('materia-mural-prof'));
router.get('/minigame-kart-prof', renderSimplePage('minigame-kart-prof'));
router.get('/perfil-prof', renderSimplePage('perfil-prof'));
router.get('/professores', renderSimplePage('professores'));
router.get('/quiz', renderSimplePage('quiz'));

// Exportando o roteador
module.exports = router;

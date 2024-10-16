const express = require('express');
const router = express.Router();
const db = require('./db');
router.use(express.urlencoded({ extended: true }));

const { verificarToken } = require('./middlewares'); // Importa o middleware

router.use((req, res, next) => {
    console.log('Sessão atual:', req.session);
    next();
});

const { getAlunosEMaterias, addTurma } = require('./public/js/addTurma');
const { upload, addAtividade } = require('./public/js/addAtividade');
const addMateriasRouter = require('./public/js/addMaterias');

// Função utilitária para lidar com erros
function funcaoErroDb(err, res, errorMsg = 'Erro ao executar a consulta') {
    console.error(errorMsg, err);
    return res.status(500).send(errorMsg);
}

// Rota para exibir a tela de criação de mini-game
router.get('/inicio-game-prof', (req, res) => {
    if (!req.session.ID_Professor) {
        return res.redirect('/login'); // Redireciona para o login se não tiver sessão
    }
    res.render('pages/prof/inicio-game-prof'); // Renderiza o arquivo EJS
});

// Lógica de criação de minigame ajustada
router.post('/criar-minigame', (req, res) => {
    // Verifique se o professor está logado (verificação da sessão)
    if (!req.session.ID_Professor) {
        return res.redirect('/login'); // Se não estiver logado, redirecione para o login
    }

    // Capturando os dados enviados pelo formulário
    const { Nome_Minigame, turma, perguntas } = req.body;

    // Verificando se todos os campos obrigatórios estão presentes
    if (!Nome_Minigame || !turma || !perguntas || perguntas.length === 0) {
        console.log('Campos incompletos:', { Nome_Minigame, turma, perguntas });
        return res.status(400).send('Dados incompletos');
    }

    // Capturando o ID do professor da sessão
    const ID_Professor = req.session.ID_Professor;

    // Inserindo o minigame no banco de dados
    const queryMinigame = `
        INSERT INTO Minigame (Nome_Minigame, ID_Professor, Turma)
        VALUES (?, ?, ?)
    `;

    db.query(queryMinigame, [Nome_Minigame, ID_Professor, turma], (err, result) => {
        if (err) {
            console.error('Erro ao criar minigame:', err);
            return res.status(500).send('Erro ao criar minigame');
        }

        const minigameId = result.insertId;
        console.log('Minigame criado com ID:', minigameId);

        // Inserindo perguntas e alternativas no banco de dados
        const queryPergunta = `
            INSERT INTO Pergunta (ID_MiniGame, Texto)
            VALUES (?, ?)
        `;

        perguntas.forEach((pergunta, indexPergunta) => {
            console.log(`Inserindo pergunta ${indexPergunta + 1}:`, pergunta.texto);

            db.query(queryPergunta, [minigameId, pergunta.texto], (err, result) => {
                if (err) {
                    console.error('Erro ao criar pergunta:', err);
                    return res.status(500).send('Erro ao criar pergunta');
                }

                const perguntaId = result.insertId;
                console.log('Pergunta criada com ID:', perguntaId);

                // Inserindo alternativas
                const queryAlternativa = `
                    INSERT INTO Alternativa (ID_Pergunta, Texto, Correta)
                    VALUES (?, ?, ?)
                `;

                pergunta.alternativas.forEach((alternativa, indexAlternativa) => {
                    const correta = pergunta.correta === String(indexAlternativa + 1); // Verificar se é a alternativa correta

                    console.log(`Inserindo alternativa ${indexAlternativa + 1} para a pergunta ${indexPergunta + 1}:`, alternativa, correta);

                    db.query(queryAlternativa, [perguntaId, alternativa, correta], (err) => {
                        if (err) {
                            console.error('Erro ao criar alternativa:', err);
                            return res.status(500).send('Erro ao criar alternativa');
                        }
                        console.log('Alternativa inserida com sucesso!');
                    });
                });
            });
        });

        // Redireciona para a página de sucesso
        res.redirect('/inicio-game-prof');
    });
});

// Rota para exibir o a tela de criar atividade
router.get('/addAtividade', (req, res) => {
    res.render('pages/prof/addAtividade', { successMessage: null });
});

// Rota para processar o formulário de criação de atividade
router.post('/addAtividade', upload.single('arquivo'), addAtividade);

// Rota para exibir a tela de cadastro de pessoas
router.get('/addpessoas', (req, res) => {
    const sql = 'SELECT * FROM Usuario';
    db.query(sql, (err, results) => {
        if (err) return funcaoErroDb(err, res, 'Erro ao buscar os usuários');
        res.render('pages/prof/addpessoas', { usuarios: results });
    });
});

// Rota GET para exibir a tela de cadastro de turmas
router.get('/addTurma', (req, res) => {
    getAlunosEMaterias((err, data) => {
        if (err) return funcaoErroDb(err, res, 'Erro ao buscar dados para a turma');
        const { alunos, materias } = data;
        res.render('pages/prof/addTurma', { alunos, materias });
    });
});

// Rota POST para processar o formulário de cadastro de turmas
router.post('/addTurma', (req, res) => {
    addTurma(req, res);
});

// Rota para exibir a página de cadastro de matérias
router.use('/addmateria', addMateriasRouter);

// Rota para exibir atividades de uma matéria com base no ID da matéria
router.get('/materia-atividades-prof/:materiaId', (req, res) => {
    const materiaId = req.params.materiaId; // Captura o ID da matéria da URL
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
router.get('/criar-minigame', renderSimplePage('criar-minigame'));
router.get('/calendario-prof', renderSimplePage('calendario-prof'));
router.get('/addatividade', renderSimplePage('addatividade'));
router.get('/desempenho-classe-prof', renderSimplePage('desempenho-classe-prof'));
router.get('/desempenho-geral-prof', renderSimplePage('desempenho-geral-prof'));
router.get('/home-prof', renderSimplePage('home-prof'));
router.get('/materia-downloads-prof', renderSimplePage('materia-downloads-prof'));
router.get('/materia-mural-prof', renderSimplePage('materia-mural-prof'));
router.get('/minigame-kart-prof', renderSimplePage('minigame-kart-prof'));
router.get('/perfil-prof', renderSimplePage('perfil-prof'));
router.get('/professores', renderSimplePage('professores'));
router.get('/quiz', renderSimplePage('quiz'));

// Exportando o roteador
module.exports = router;

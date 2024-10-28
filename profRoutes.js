const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');
const { verificarToken } = require('./middlewares'); // Importa o middleware
const { getAlunosEMaterias, addTurma } = require('./public/js/addTurma');
const { upload, addAtividade } = require('./public/js/addAtividade');
const addMateriasRouter = require('./public/js/addMaterias');

router.use(express.urlencoded({ extended: true }));

// Função utilitária para lidar com erros
function funcaoErroDb(err, res, errorMsg = 'Erro ao executar a consulta') {
    console.error(errorMsg, err);
    return res.status(500).send(errorMsg);
}

// Middleware para verificar se o professor está logado
const verificarProfessorLogado = (req, res, next) => {
    if (!req.session.ID_Professor) {
        return res.redirect('/login');
    }
    next();
};

// Rota para exibir a tela de criação de mini-game
router.get('/inicio-game-prof', verificarProfessorLogado, (req, res) => {
    res.render('pages/prof/inicio-game-prof');
});

// Lógica de criação de minigame
router.post('/criar-minigame', verificarProfessorLogado, async (req, res) => {
    const { Nome_Minigame, turma, perguntas } = req.body;

    if (!Nome_Minigame || !turma || !perguntas || perguntas.length === 0) {
        return res.status(400).send('Dados incompletos');
    }

    const ID_Professor = req.session.ID_Professor;

    try {
        // Inserindo o minigame no banco de dados
        const { data: minigame, error: minigameError } = await supabase
            .from('Minigame')
            .insert([{ Nome_Minigame, ID_Professor, Turma: turma }])
            .single();

        if (minigameError) throw minigameError;

        const minigameId = minigame.id;

        // Inserindo perguntas e alternativas
        for (const pergunta of perguntas) {
            const { data: perguntaData, error: perguntaError } = await supabase
                .from('Pergunta')
                .insert([{ ID_MiniGame: minigameId, Texto: pergunta.texto }])
                .single();

            if (perguntaError) throw perguntaError;

            const perguntaId = perguntaData.id;

            const alternativasInsert = pergunta.alternativas.map(async (alternativa, index) => {
                const correta = pergunta.correta === String(index + 1);
                const { error: alternativaError } = await supabase
                    .from('Alternativa')
                    .insert([{ ID_Pergunta: perguntaId, Texto: alternativa, Correta: correta }]);

                if (alternativaError) throw alternativaError;
            });

            await Promise.all(alternativasInsert);
        }

        // Redireciona para a página de sucesso
        res.redirect('/inicio-game-prof');
    } catch (err) {
        console.error('Erro ao criar minigame:', err);
        res.status(500).send('Erro ao criar minigame');
    }
});

// Rota para exibir a tela de cadastro de turmas
router.get('/addTurma', verificarProfessorLogado, async (req, res) => {
    try {
        const data = await getAlunosEMaterias();
        const { alunos, materias } = data;
        res.render('pages/prof/addTurma', { alunos, materias });
    } catch (err) {
        funcaoErroDb(err, res, 'Erro ao buscar dados para a turma');
    }
});


// Rota para exibir o a tela de criar atividade
router.get('/addAtividade', (req, res) => {
    res.render('pages/prof/addAtividade', { successMessage: null });
});

// Rota para processar o formulário de criação de atividade
router.post('/addAtividade', upload.single('arquivo'), addAtividade);

// Rota para exibir a página de cadastro de matérias
router.use('/addmateria', addMateriasRouter);

router.get('/materia-atividades-prof/:materiaId', async (req, res) => {
    const materiaId = req.params.materiaId;

    try {
        const { data: atividades, error } = await supabase
            .from('atividade')
            .select('*')
            .eq('id_materia', materiaId);

        if (error) throw error;

        res.render('pages/prof/materia-atividades-prof', { atividades });
    } catch (err) {
        console.error('Erro ao buscar atividades:', err);
        res.status(500).send('Erro ao buscar atividades.');
    }
});

// Rota para exibir a tela de cadastro de pessoas
router.get('/addpessoas', async (req, res) => {
    try {
        const { data: usuarios, error } = await supabase.from('usuario').select('*'); // Verifique se o nome da tabela é 'Usuario'
        
        if (error) throw error; // Lança erro se houver um problema ao buscar os dados
        
        res.render('pages/prof/addpessoas', { usuarios }); // Passa a variável 'usuarios' para a view
    } catch (err) {
        console.error('Erro ao buscar os usuários:', err);
        res.status(500).send('Erro ao buscar os usuários');
    }
});

module.exports = router;

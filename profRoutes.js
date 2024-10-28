const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');
const { verificarToken } = require('./middlewares');
const { getAlunosEMaterias, addTurma } = require('./public/js/addTurma'); // Ajuste o caminho conforme necessário
const { upload, addAtividade } = require('./public/js/addAtividade');
const addMateriasRouter = require('./public/js/addMaterias');

router.use(express.urlencoded({ extended: true }));

// Middleware para verificar se o usuário logado é um professor
const verificarProfessorLogado = (req, res, next) => {
    if (!req.session.usuario || req.session.usuario.tipo_usuario !== 'Professor') {
        return res.redirect('/login');
    }
    next();
};

// Rota: Página inicial do professor
router.get('/home-prof', verificarProfessorLogado, (req, res) => {
    res.render('pages/prof/home-prof');
});

// Rota: Exibir tela de criação de mini-game
router.get('/inicio-game-prof', verificarProfessorLogado, (req, res) => {
    res.render('pages/prof/inicio-game-prof');
});

// Rota: Processar criação de mini-game
router.post('/criar-minigame', verificarProfessorLogado, async (req, res) => {
    const { Nome_Minigame, turma, perguntas } = req.body;
    const ID_Professor = req.session.ID_Professor;

    if (!Nome_Minigame || !turma || !perguntas || perguntas.length === 0) {
        return res.status(400).send('Dados incompletos');
    }

    try {
        const { data: minigame, error: minigameError } = await supabase
            .from('Minigame')
            .insert([{ Nome_Minigame, ID_Professor, Turma: turma }])
            .single();
        
        if (minigameError) throw minigameError;

        const minigameId = minigame.id;

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

        res.redirect('/inicio-game-prof');
    } catch (err) {
        console.error('Erro ao criar minigame:', err);
        res.status(500).send('Erro ao criar minigame');
    }
});

// Rota: Exibir tela de cadastro de turmas
router.get('/addTurma', verificarProfessorLogado, async (req, res) => {
    try {
        const data = await getAlunosEMaterias();
        const { alunos, materias } = data;

        // Recupera e limpa a mensagem de sucesso da sessão
        const successMessage = req.session.successMessage;
        req.session.successMessage = null;

        res.render('pages/prof/addturma', {
            alunos,
            materias,
            successMessage: successMessage || ''
        });
    } catch (err) {
        console.error('Erro ao buscar dados para adicionar turma:', err);
        return res.status(500).send('Erro ao buscar dados para adicionar turma');
    }
});


// Rota: Processar adição de turma
router.post('/addTurma', addTurma);

// Rota: Exibir tela de criar atividade
router.get('/addAtividade', verificarProfessorLogado, (req, res) => {
    res.render('pages/prof/addAtividade', { successMessage: null });
});

// Rota: Processar criação de atividade
router.post('/addAtividade', upload.single('arquivo'), addAtividade);

// Rota: Mural de uma matéria específica
router.get('/materia-mural-prof', (req, res) => {
    res.render('pages/prof/materia-mural-prof', { successMessage: null });
});

// Rota: Downloads de uma matéria específica
router.get('/materia-downloads-prof', (req, res) => {
    res.render('pages/prof/materia-downloads-prof', { successMessage: null });
});

// Rota para exibir as matérias do professor logado
router.get('/materias-prof', verificarProfessorLogado, async (req, res) => {
    const idProfessor = req.session.usuario.id_usuario; // Obtém o ID do professor logado

    try {
        // Busca as matérias associadas ao professor logado
        const { data: materias, error } = await supabase
            .from('materia')
            .select('*')
            .eq('id_professor', idProfessor);

        if (error) throw error;

        // Renderiza a página de matérias, passando as matérias do professor
        res.render('pages/prof/materias-prof', { materias });
    } catch (err) {
        console.error('Erro ao buscar matérias:', err);
        res.status(500).send('Erro ao buscar matérias.');
    }
});

// Rota: Cadastro de matérias
router.use('/addmateria', addMateriasRouter);

// Rota: Exibir atividades da matéria especificada
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

// Rota: Exibir tela de cadastro de pessoas
router.get('/addpessoas', verificarProfessorLogado, async (req, res) => {
    try {
        const { data: usuarios, error } = await supabase.from('usuario').select('*');
        
        if (error) throw error;

        res.render('pages/prof/addpessoas', { usuarios });
    } catch (err) {
        console.error('Erro ao buscar os usuários:', err);
        res.status(500).send('Erro ao buscar os usuários');
    }
});

module.exports = router;

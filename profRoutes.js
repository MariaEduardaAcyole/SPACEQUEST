const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');
const bcrypt = require('bcrypt');
const { verificarToken } = require('./middlewares');
const { getAlunosEMaterias, addTurma } = require('./public/js/addTurma');
const { upload, addAtividade } = require('./public/js/addAtividade');
const addMateriasRouter = require('./public/js/addMaterias');
router.use('/addmateria', addMateriasRouter);
const session = require('express-session');

router.use(express.urlencoded({ extended: true }));

// Middleware para verificar se o usuário logado é um professor
const verificarProfessorLogado = (req, res, next) => {
    if (!req.session.usuario || req.session.usuario.tipo_usuario !== 'Professor') {
        return res.redirect('/login');
    }
    next();
};

router.use('/addmateria', addMateriasRouter);

router.get('/addmateria', async (req, res) => {
    try {
        // Busca todos os professores para exibir no formulário
        const { data: professores, error } = await supabase
            .from('professor')
            .select('*');

        if (error) {
            console.error('Erro ao buscar professores:', error);
            return res.status(500).send('Erro ao buscar professores');
        }

        // Renderiza a página com a lista de professores
        res.render('pages/prof/addmateria', { professores });
    } catch (err) {
        console.error('Erro ao buscar professores:', err);
        res.status(500).send('Erro ao buscar professores');
    }
});

module.exports = router;



// Rota: Página inicial do professor
router.get('/home-prof', (req, res) => {
    res.render('pages/prof/home-prof');
});

router.get('/quiz', (req, res) => {
    res.render('pages/prof/quiz');
});

router.get('/minigame-kart', (req, res) => {
    res.render('pages/prof/minigame-kart');
});

// Rota: Exibir tela de criação de mini-game
router.get('/inicio-game-prof', (req, res) => {
    res.render('pages/prof/inicio-game-prof');
});

// Rota: Processar criação de mini-game
router.post('/criar-minigame', verificarProfessorLogado, async (req, res) => {
    const { Nome_Minigame, turma, perguntas } = req.body;
    const ID_Professor = req.session.usuario.id_usuario;

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
router.get('/addAtividade/:id', verificarProfessorLogado, (req, res) => {
    res.render('pages/prof/addAtividade', { successMessage: null });
});

// Rota: Processar criação de atividade
router.post('/addAtividade', upload.single('arquivo'), addAtividade);

// Rota: Mural de uma matéria específica
router.get('/materia-mural-prof/:id', (req, res) => {
    res.render('pages/prof/materia-mural-prof', { successMessage: null });
});

// Rota: Downloads de uma matéria específica
router.get('/materia-downloads-prof/:id', (req, res) => {
    res.render('pages/prof/materia-downloads-prof', { successMessage: null });
});

// Rota para obter as atividades de uma matéria específica
router.get('/materia-atividades-prof/:id', verificarProfessorLogado, async (req, res) => {
    try {
        const idProfessor = req.session.usuario.id_usuario; // Pega o ID do professor logado
        const idMateria = req.params.id; // Pega o ID da matéria da URL

        // Buscar as atividades da matéria específica
        const { data: atividades, error } = await supabase
            .from('atividade') // Consulta à tabela de atividades
            .select('*')
            .eq('id_materia', idMateria); // Filtra pela ID da matéria

        if (error) {
            console.error('Erro ao buscar atividades:', error);
            return res.status(500).send('Erro ao buscar atividades');
        }

        // Buscar a matéria específica para mostrar seu nome
        const { data: materia, error: materiaError } = await supabase
            .from('materia') // Consulta à tabela de matéria
            .select('*')
            .eq('id_materia', idMateria)
            .single(); // Pega uma única matéria (por ID)

        if (materiaError) {
            console.error('Erro ao buscar matéria:', materiaError);
            return res.status(500).send('Erro ao buscar matéria');
        }

        // Renderiza a página com as atividades, nome da matéria e idMateria
        res.render('pages/prof/materia-atividades-prof', {
            atividades, // Passa as atividades para a view
            nome_materia: materia.nome_materia, // Passa o nome da matéria para a view
            idMateria: idMateria // Passa a idMateria para o EJS
        });
        
    } catch (error) {
        console.error('Erro ao obter atividades:', error);
        res.status(500).send('Erro ao obter atividades');
    }
});

// Rota: Exibir matérias do professor
router.get('/materias-prof', verificarProfessorLogado, async (req, res) => {
    const idUsuario = req.session.usuario.id_usuario; // ID do usuário logado

    try {
        const { data: professorData, error: professorError } = await supabase
            .from('professor')
            .select('id_professor')
            .eq('id_usuario', idUsuario)
            .single();

        if (professorError || !professorData) {
            console.error('Erro ao buscar ID do professor:', professorError);
            return res.status(500).json({ error: 'Erro ao identificar o professor' });
        }

        const idProfessor = professorData.id_professor;

        const { data: materias, error: materiasError } = await supabase
            .from('materia')
            .select('*') // Inclua cor_materia
            .eq('id_professor', idProfessor);

        if (materiasError) {
            console.error('Erro ao buscar matérias do professor:', materiasError);
            return res.status(500).json({ error: 'Erro ao buscar matérias' });
        }

        res.render('pages/prof/materias-prof', { materias });
    } catch (err) {
        console.error('Erro ao buscar matérias:', err);
        res.status(500).json({ error: 'Erro ao buscar matérias' });
    }
});




router.post('/addpessoas', async (req, res) => {
    const { ID_Usuario, senha, nome, Tipo_Usuario } = req.body;

    if (!ID_Usuario || !senha || !nome || !Tipo_Usuario) {
        return res.status(400).send('Todos os campos são necessários.');
    }

    try {
        // Criptografar a senha antes de armazená-la
        const hashedPassword = await bcrypt.hash(senha, 10); // O número 10 é o "salting rounds"

        // Inserir o usuário na tabela usuario
        const { data: novoUsuario, error: usuarioError } = await supabase
            .from('usuario')
            .insert([{ id_usuario: ID_Usuario, senha: hashedPassword, nome, tipo_usuario: Tipo_Usuario }])
            .select()
            .single();

        if (usuarioError) {
            console.error('Erro ao inserir usuário na tabela usuario:', usuarioError);
            return res.status(500).send(`Erro ao cadastrar usuário: ${usuarioError.message}`);
        }

        console.log('Usuário cadastrado na tabela usuario:', novoUsuario);

        // Inserir na tabela correspondente com base no tipo de usuário
        if (Tipo_Usuario === 'Aluno') {
            const { error: alunoError } = await supabase
                .from('aluno')
                .insert([{ id_usuario: ID_Usuario }]);
            if (alunoError) {
                console.error('Erro ao inserir aluno:', alunoError);
                return res.status(500).send(`Erro ao cadastrar aluno: ${alunoError.message}`);
            }
        } else if (Tipo_Usuario === 'Professor') {
            const { error: professorError } = await supabase
                .from('professor')
                .insert([{ id_usuario: ID_Usuario }]);
            if (professorError) {
                console.error('Erro ao inserir professor:', professorError);
                return res.status(500).send(`Erro ao cadastrar professor: ${professorError.message}`);
            }
        }

        req.session.successMessage = 'Usuário cadastrado com sucesso!';
        res.redirect('/addpessoas');
    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err);
        res.status(500).send('Erro ao cadastrar usuário');
    }
});


router.get('/desempenho-geral-prof',  (req, res) => {
    res.render('pages/prof/desempenho-geral-prof', { successMessage: null });
});

router.get('/desempenho-classe-prof',  (req, res) => {
    res.render('pages/prof/desempenho-classe-prof', { successMessage: null });
});
module.exports = router;

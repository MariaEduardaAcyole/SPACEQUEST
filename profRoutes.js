const express = require('express');
const router = express.Router();

// Middleware para log de requisições
router.use((req, res, next) => {
    console.log(`Recebida requisição ${req.method} em ${req.url} com body:`, req.body);
    next();
});

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
    console.log("Sessão na verificação:", req.session);
    if (!req.session.usuario || req.session.usuario.tipo_usuario !== 'Professor') {
        console.log("Usuário não autenticado como professor");
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



router.get('/minigame-kart', (req, res) => {
    res.render('pages/prof/minigame-kart');
});

// Rota: Exibir tela de criação de mini-game
// Rota: Exibir tela de criação de mini-game
router.get('/inicio-game-prof', async (req, res) => {
    try {
        // Supondo que você tenha uma consulta para buscar as turmas no banco de dados
        const { data: turma, error } = await supabase
            .from('turma') // Tabela onde você está armazenando as turmas
            .select('*');

        if (error) {
            console.error("Erro ao buscar as turmas:", error);
            return res.status(500).send('Erro ao buscar as turmas');
        }

        // Renderiza a página com a variável turma
        res.render('pages/prof/inicio-game-prof', { turma });
    } catch (err) {
        console.error("Erro na rota GET /inicio-game-prof:", err);
        res.status(500).send('Erro ao carregar a página de criação de minigame');
    }
});

// Rota: Processar criação de mini-game
router.post('/criar-minigame', verificarProfessorLogado, async (req, res) => {
    const { nome_minigame, turma, perguntas } = req.body;
    const id_professor = req.session.usuario.id_usuario;

    if (!nome_minigame || !turma || !perguntas || perguntas.length === 0) {
        return res.status(400).send('Dados incompletos');
    }

    try {
        // Inserir o mini-game no banco
        const { data: minigame, error: minigameError } = await supabase
            .from('minigame')
            .insert([{ nome_minigame, id_professor, turma, data_criacao: new Date() }])
            .select('id_minigame')
            .single();

        if (minigameError || !minigame) {
            console.error('Erro ao inserir minigame:', minigameError);
            throw new Error('Falha ao criar mini-game no banco');
        }

        console.log("Mini-game criado com ID:", minigame.id_minigame);

        // Iterar sobre cada pergunta para inserir no banco
        for (const pergunta of perguntas) {
            const { texto, alternativas, correta } = pergunta;

            // Inserir a pergunta vinculada ao minigame recém-criado
            const { data: perguntaData, error: perguntaError } = await supabase
                .from('pergunta')
                .insert([{ id_minigame: minigame.id_minigame, texto }])
                .select('id_pergunta') // Supondo que a coluna seja id_pergunta
                .single();

            if (perguntaError || !perguntaData) {
                console.error('Erro ao inserir pergunta:', perguntaError);
                throw new Error('Falha ao inserir pergunta');
            }

            const perguntaId = perguntaData.id_pergunta; // Atribui o ID da pergunta

            // Mapear alternativas com o ID da pergunta
            const alternativasInsert = alternativas.map((alternativa, index) => {
                const corretaAlternativa = correta === String(index + 1); // Verifica se é a alternativa correta
                return {
                    id_pergunta: perguntaId,
                    texto: alternativa,
                    correta: corretaAlternativa,
                    nome_materia: "Biologia", // Defina o nome da matéria conforme necessário
                    pontos: corretaAlternativa ? 10 : 0 // Atribui pontos apenas para a resposta correta
                };
            });

            // Inserir as alternativas no banco de dados
            const { error: alternativaError } = await supabase
                .from('alternativa')
                .insert(alternativasInsert);

            if (alternativaError) {
                console.error('Erro ao inserir alternativas:', alternativaError);
                throw new Error('Falha ao inserir alternativas');
            }

            console.log(`Alternativas criadas para a pergunta com ID: ${perguntaId}`);
        }

        console.log("Mini-game criado com sucesso e todas as perguntas e alternativas inseridas!");
        res.status(200).send('Minigame criado com sucesso!');

    } catch (err) {
        console.error('Erro ao criar minigame:', err.message);
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

router.get('/desempenho-geral-prof', (req, res) => {
    res.render('pages/prof/desempenho-geral-prof', { successMessage: null });
});

router.get('/desempenho-classe-prof', (req, res) => {
    res.render('pages/prof/desempenho-classe-prof', { successMessage: null });
});
module.exports = router;

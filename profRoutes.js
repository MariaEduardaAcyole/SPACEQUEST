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

router.use((req, res, next) => {
    console.log(`Recebida requisição ${req.method} em ${req.url} com body:`, req.body);
    console.log('Sessão atual:', req.session);
    next();
});

// Middleware para verificar se o usuário logado é um professor

function verificarProfessorLogado(req, res, next) {
    if (!req.session || !req.session.usuario) {
        console.log('Usuário não logado. Redirecionando para login.');
        return res.redirect('/login'); // Redireciona se não estiver logado
    }

    if (req.session.usuario.tipo_usuario !== 'Professor') {
        console.log('Usuário não é professor. Redirecionando para login.');
        return res.redirect('/login'); // Redireciona se não for professor
    }

    // Se tudo estiver certo, segue para a próxima função
    next();
}

router.use('/materia-atividades-prof', verificarProfessorLogado);
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
router.get('/home-prof', verificarProfessorLogado, async (req, res) => {  
    const idUsuario = req.session.usuario.id_usuario; // ID do usuário logado

    try {
        // 1. Buscar as turmas do professor
        const { data: turmasData, error: turmasError } = await supabase
            .from('turma') // A tabela onde as turmas estão armazenadas
            .select('id_turma, nome_turma');

        if (turmasError || !turmasData) {
            console.error('Erro ao buscar turmas:', turmasError);
            return res.status(500).send('Erro ao buscar turmas.');
        }

        // 2. Buscar os dados de desempenho (pontuação) de cada turma
        const turmasComDesempenho = await Promise.all(turmasData.map(async (turma) => {
            // 2.1. Buscar os alunos da turma
            const { data: turmaAlunos, error: turmaAlunosError } = await supabase
                .from('aluno_turma') // Relaciona alunos e turmas
                .select('id_aluno')
                .eq('id_turma', turma.id_turma);

            if (turmaAlunosError) {
                console.error(`Erro ao buscar alunos da turma ${turma.id_turma}:`, turmaAlunosError);
                return null; // Caso haja erro, ignora essa turma
            }

            // 2.2. Buscar o desempenho dos alunos (pontuação) nas matérias da turma
            const { data: desempenhoTurma, error: desempenhoError } = await supabase
                .from('aluno_materia') // Relaciona alunos e matérias
                .select('id_aluno, pontos')
                .in('id_aluno', turmaAlunos.map(t => t.id_aluno));

            if (desempenhoError) {
                console.error(`Erro ao buscar desempenho da turma ${turma.id_turma}:`, desempenhoError);
                return null;
            }

            // 2.3. Somar os pontos dos alunos da turma
            const totalPontos = desempenhoTurma.reduce((acc, { pontos }) => acc + pontos, 0);

            // 2.4. Retornar a turma com o total de pontos
            return {
                id_turma: turma.id_turma,
                nome_turma: turma.nome_turma, // Nome da turma
                pontos: totalPontos          // Soma total de pontos dos alunos da turma
            };
        }));

        // Filtrando turmas que retornaram dados válidos (não null)
        const turmasValidas = turmasComDesempenho.filter(turma => turma !== null);

        // 3. Preparar os dados para o gráfico
        const labels = turmasValidas.map(turma => turma.nome_turma);  // Nomes das turmas
        const pontos = turmasValidas.map(turma => turma.pontos);  // Pontuação total das turmas

        // 4. Buscar as informações do usuário (professor)
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuario')
            .select('*')
            .eq('id_usuario', idUsuario)
            .single();

        if (usuarioError || !usuarioData) {
            console.error('Erro ao buscar dados do usuário:', usuarioError);
            return res.status(500).send('Erro ao buscar dados do usuário.');
        }

        // 5. Passar os dados para a view
        res.render('pages/prof/home-prof', {
            usuario: usuarioData,
            turmas: turmasValidas,  // Turmas com desempenho total
            labels: labels,  // Nomes das turmas
            pontos: pontos   // Pontuação total das turmas
        });

    } catch (err) {
        console.error('Erro ao exibir home prof:', err);
        res.status(500).send('Erro ao exibir home prof.');
    }
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

        const { data: materia, errorMateria } = await supabase
            .from('materia') // Tabela onde você está armazenando as turmas
            .select('*');

        if (error) {
            console.error("Erro ao buscar as turmas:", error);
            return res.status(500).send('Erro ao buscar as turmas');
        }

        // Renderiza a página com a variável turma
        res.render('pages/prof/inicio-game-prof', { turma, materia });
    } catch (err) {
        console.error("Erro na rota GET /inicio-game-prof:", err);
        res.status(500).send('Erro ao carregar a página de criação de minigame');
    }
});

// Rota: Processar criação de mini-game
router.post('/criar-minigame', verificarProfessorLogado, async (req, res) => {
    const { nome_minigame, turma, materia, perguntas } = req.body;
    const id_professor = req.session.usuario.id_usuario;

    if (!nome_minigame || !turma || !perguntas || !materia || perguntas.length === 0) {
        return res.status(400).send('Dados incompletos');
    }

    try {
        // Inserir o mini-game no banco
        const { data: minigame, error: minigameError } = await supabase
            .from('minigame')
            .insert([{ nome_minigame, id_professor, turma, id_materia: materia, data_criacao: new Date() }])
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
router.get('/addturma', verificarProfessorLogado, async (req, res) => {
    try {
        const data = await getAlunosEMaterias();
        console.log('Dados para a página de adicionar turma:', JSON.stringify(data, null, 2)); // Debug
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
        res.status(500).send('Erro ao buscar dados para adicionar turma');
    }
});

// Rota: Processar adição de turma
router.post('/addTurma', addTurma);

// Rota: Exibir tela de criar atividade
router.get('/addatividade/:id', verificarProfessorLogado, (req, res) => {
    res.render('pages/prof/addAtividade', { successMessage: null });
});

// Rota: Processar criação de atividade
router.post('/addAtividade', upload.single('arquivo'), addAtividade);

router.get('/materia-mural-prof/:id', verificarProfessorLogado, async (req, res) => {
    const { id } = req.params; // Ajustado para usar "id"

    // Validar o ID da matéria
    if (!id || isNaN(Number(id))) {
        console.error("ID inválido fornecido:", id);
        return res.status(400).send('ID da matéria inválido.');
    }

    try {
        // Busca os dados da matéria
        const { data: materia, error: materiaError } = await supabase
            .from('materia')
            .select('*')
            .eq('id_materia', id)
            .single(); // Retorna um único registro

        if (materiaError) {
            console.error("Erro ao buscar matéria:", materiaError);
            return res.status(500).send('Erro ao buscar dados da matéria.');
        }

        // Buscar os minigames associados à matéria no banco
        const { data: minigames, error: minigamesError } = await supabase
            .from('minigame')
            .select('id_minigame, nome_minigame')
            .eq('id_materia', id); // Filtrar pelo ID da matéria

        if (minigamesError) {
            console.error("Erro ao buscar minigames:", minigamesError);
            return res.status(500).send('Erro ao buscar minigames.');
        }

        // Renderizar a página passando os minigames e a matéria
        res.render('pages/prof/materia-mural-prof', { minigames, materia, id });
    } catch (err) {
        console.error("Erro inesperado:", err);
        res.status(500).send('Erro inesperado.');
    }
});


// Rota: Downloads de uma matéria específica
router.get('/materia-downloads-prof/:id', (req, res) => {
    res.render('pages/prof/materia-downloads-prof', { successMessage: null });
});

// Rota para obter as atividades de uma matéria específica
router.get('/materia-atividades-prof/:id', async (req, res) => {
    try {
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
            materia, idMateria: idMateria // Passa a idMateria para o EJS
        });

    } catch (error) {
        console.error('Erro ao obter atividades:', error);
        res.status(500).send('Erro ao obter atividades');
    }
});

// Rota: Exibir matérias do professor
router.get('/materias-prof', async (req, res) => {
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
        console.log('ID do Professor:', idProfessor);
        console.log('Matérias:', materias);

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

router.get('/desempenho-classe-prof', verificarProfessorLogado, async (req, res) => {
    const idUsuario = req.session.usuario.id_usuario; // ID do usuário logado

    try {
        // 1. Buscar todas as matérias do professor logado
        const { data: materiasData, error: materiasError } = await supabase
            .from('materia') // Tabela de matérias
            .select('id_materia')
            .eq('id_professor', idUsuario); // Buscar matérias do professor logado

        if (materiasError || !materiasData) {
            console.error('Erro ao buscar matérias do professor:', materiasError);
            return res.status(500).send('Erro ao identificar as matérias do professor');
        }

        // 2. Buscar as turmas associadas a essas matérias
        const { data: turmasData, error: turmasError } = await supabase
            .from('turma_materia') // Relaciona turmas e matérias
            .select('id_turma')
            .in('id_materia', materiasData.map(materia => materia.id_materia)); // Filtra turmas com base nas matérias

        if (turmasError || !turmasData) {
            console.error('Erro ao buscar turmas associadas às matérias:', turmasError);
            return res.status(500).send('Erro ao identificar turmas');
        }

        // 3. Para cada turma, buscar os alunos e desempenho
        const turmasComDesempenho = await Promise.all(turmasData.map(async (turma) => {
            // Buscar os alunos da turma
            const { data: turmaAlunos, error: turmaAlunosError } = await supabase
                .from('aluno_turma') // Relaciona alunos e turmas
                .select('id_aluno')
                .eq('id_turma', turma.id_turma);

            if (turmaAlunosError) {
                console.error(`Erro ao buscar alunos da turma ${turma.id_turma}:`, turmaAlunosError);
                return null; // Caso haja erro, ignora essa turma
            }

            // 4. Buscar o desempenho dos alunos da turma
            const { data: desempenhoTurma, error: desempenhoError } = await supabase
                .from('aluno_materia') // Relaciona alunos e matérias
                .select('id_aluno, pontos')
                .in('id_aluno', turmaAlunos.map(t => t.id_aluno));

            if (desempenhoError) {
                console.error(`Erro ao buscar desempenho da turma ${turma.id_turma}:`, desempenhoError);
                return null;
            }

            // 5. Somar os pontos de cada aluno
            const totalPontos = desempenhoTurma.reduce((acc, { pontos }) => acc + pontos, 0);

            // Retornar a turma com o desempenho total
            return {
                id_turma: turma.id_turma,
                pontos: totalPontos          // Total de pontos da turma
            };
        }));

        // Filtrando turmas com erro (caso tenha ocorrido algum erro de busca)
        const turmasValidas = turmasComDesempenho.filter(turma => turma !== null);

        // 6. Ordenar as turmas pela pontuação total (decrescente)
        turmasValidas.sort((a, b) => b.pontos - a.pontos);

        // 7. Renderizar a página com as turmas e pontuação
        res.render('pages/prof/desempenho-classe-prof', { turmas: turmasValidas });

    } catch (err) {
        console.error('Erro ao obter ranking de turmas:', err);
        res.status(500).send('Erro ao obter ranking de turmas');
    }
});


router.get('/desempenho-geral-prof', verificarProfessorLogado, async (req, res) => {
    const idUsuario = req.session.usuario.id_usuario; // ID do usuário logado

    try {
        // 1. Buscar o ID do professor logado
        const { data: professorData, error: professorError } = await supabase
            .from('professor') // Tabela de professores
            .select('id_professor')
            .eq('id_professor', idUsuario);
            

        if (professorError || !professorData) {
            console.error('Erro ao buscar ID do professor:', professorError);
            return res.status(500).send('Erro ao identificar o professor');
        }

        // 2. Buscar o desempenho de todos os alunos do sistema
        const { data: desempenhoGeral, error: desempenhoError } = await supabase
            .from('aluno_materia') // Desempenho de todos os alunos
            .select('id_aluno, pontos');

        if (desempenhoError) {
            console.error('Erro ao buscar desempenho geral:', desempenhoError);
            return res.status(500).send('Erro ao buscar desempenho geral');
        }

        // 3. Somar os pontos de cada aluno para o ranking geral
        const rankingGeral = {};
        desempenhoGeral.forEach(({ id_aluno, pontos }) => {
            rankingGeral[id_aluno] = (rankingGeral[id_aluno] || 0) + pontos;
        });

        // 4. Transformar ranking em array e ordenar por pontos (decrescente)
        const rankingArray = Object.entries(rankingGeral).map(([id_aluno, pontos]) => ({ id_aluno, pontos }));
        rankingArray.sort((a, b) => b.pontos - a.pontos);

        // 5. Buscar nomes dos alunos para exibir no ranking
        const alunosInfo = await Promise.all(rankingArray.map(async aluno => {
            const { data, error } = await supabase
                .from('aluno')
                .select('nome_aluno')
                .eq('id_aluno', aluno.id_aluno)
                .single();

            return error ? null : { nome: data.nome, pontos: aluno.pontos };
        }));

        // Filtra para remover alunos não encontrados (caso de erro em algum `select`)
        const rankingFinal = alunosInfo.filter(a => a !== null);

        // 6. Renderiza a página com o ranking geral
        res.render('pages/prof/desempenho-geral-prof', {
            ranking: rankingFinal
        });

    } catch (err) {
        console.error('Erro ao obter ranking geral dos alunos:', err);
        res.status(500).send('Erro ao obter ranking geral dos alunos');
    }
});
router.get('/calendario-prof', (req, res) => {
    res.render('pages/prof/calendario-prof');
});

module.exports = router;

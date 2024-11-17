const express = require('express');
const router = express.Router();
const supabase = require('./supabaseClient');
const { verificarToken } = require('./middlewares'); // Verifique se este middleware está correto
const session = require('express-session');


router.use(express.urlencoded({ extended: true }));

// Middleware para verificar se o usuário logado é um aluno
const verificarAlunoLogado = (req, res, next) => {
    if (!req.session.usuario || req.session.usuario.tipo_usuario !== 'Aluno') {
        return res.redirect('/login');
    }
    next();
};

router.get('/home-aluno', verificarAlunoLogado, (req, res) => {
    res.render('pages/aluno/home');
});

// Rota para listar atividades de uma matéria específica
router.get('/materia-atividades/:id', verificarAlunoLogado, async (req, res) => {
    const idMateria = req.params.id;

    try {
        // Busca as atividades dessa matéria
        const { data: atividades, error: atividadesError } = await supabase
            .from('atividade')
            .select('*')
            .eq('id_materia', idMateria);

        if (atividadesError) {
            console.error('Erro ao buscar atividades da matéria:', atividadesError);
            return res.status(500).json({ error: 'Erro ao buscar atividades da matéria' });
        }

        // Renderiza a página com as atividades e id da matéria
        res.render('pages/aluno/materia-atividades', { atividades, idMateria });
    } catch (err) {
        console.error('Erro ao renderizar atividades:', err);
        res.status(500).json({ error: 'Erro ao carregar atividades da matéria' });
    }
});


// router.get('/materias', verificarAlunoLogado, async (req, res) => {
//     const idUsuario = req.session.usuario.id_usuario; // ID do usuário logado

//     try {
//         // Buscar o id_aluno associado ao id_usuario
//         const { data: alunoData, error: alunoError } = await supabase
//             .from('aluno')
//             .select('id_aluno, nome, pontos') // Pega id_aluno, nome e pontos
//             .eq('id_usuario', idUsuario)
//             .single(); // Espera um único resultado

//         if (alunoError) {
//             console.error('Erro ao buscar dados do aluno:', alunoError);
//             return res.status(500).json({ error: 'Erro ao buscar dados do aluno' });
//         }

//         if (!alunoData) {
//             console.error('Aluno não encontrado');
//             return res.status(404).json({ error: 'Aluno não encontrado' });
//         }

//         const { id_aluno, nome, pontos } = alunoData;

//         // Buscar o id_turma através da tabela aluno_turma
//         const { data: turmaData, error: turmaError } = await supabase
//             .from('aluno_turma')
//             .select('id_turma')
//             .eq('id_aluno', id_aluno)
//             .single(); // Espera um único resultado

//         if (turmaError) {
//             console.error('Erro ao buscar ID da turma:', turmaError);
//             return res.status(500).json({ error: 'Erro ao identificar a turma' });
//         }

//         if (!turmaData) {
//             console.error('Aluno não está associado a nenhuma turma');
//             return res.status(404).json({ error: 'Aluno não está associado a nenhuma turma' });
//         }

//         const idTurma = turmaData.id_turma;

//         // Buscar as matérias relacionadas à turma
//         const { data: materias, error: materiasError } = await supabase
//             .from('turma_materia')
//             .select('*') // Seleciona todas as informações das matérias
//             .eq('id_turma', idTurma);

//         if (materiasError) {
//             console.error('Erro ao buscar matérias do aluno:', materiasError);
//             return res.status(500).json({ error: 'Erro ao buscar matérias' });
//         }

//         // Renderiza a página com as matérias do aluno e dados do aluno
//         res.render('pages/aluno/materias', {
//             materias,
//             aluno: { id_aluno, nome, pontos } // Passa as informações do aluno
//         });
//     } catch (err) {
//         console.error('Erro ao buscar matérias:', err);
//         res.status(500).json({ error: 'Erro ao buscar matérias' });
//     }
// });


const entregaController = require('./public/js/entrega-atividade');
router.post('/entrega-atividade/:id', entregaController.upload.single('file'), entregaController.atvEntrega);

router.post('/entrega-atividade/:id', async (req, res) => {
    const idAluno = req.session.usuario.id_aluno; // ID do aluno logado
    const idMateria = req.body.id_materia; // ID da matéria da atividade
    const pontosAtividade = req.body.pontos; // Pontos obtidos na atividade

    try {
        const resultado = await somarPontosAtividade(idAluno, idMateria, pontosAtividade);

        if (resultado.error) {
            return res.status(500).json({ error: resultado.error });
        }

        res.status(200).json({ success: resultado.success });
    } catch (error) {
        console.error('Erro ao processar entrega de atividade:', error);
        res.status(500).json({ error: 'Erro ao processar entrega de atividade' });
    }
});

// Rota para exibir os detalhes da atividade e o formulário de entrega
router.get('/entrega-atividade/:id', async (req, res) => {
    const atividadeId = req.params.id;
    const sucesso = req.query.sucesso;

    try {
        // Realiza a consulta no Supabase para buscar os dados da atividade
        const { data: atividade, error } = await supabase
            .from('atividade') // Nome da tabela no Supabase
            .select('*')
            .eq('id_atividade', atividadeId) // Condição para buscar a atividade específica
            .single(); // Espera apenas um único resultado

        // Verifica se houve erro ou se a atividade não foi encontrada
        if (error || !atividade) {
            return res.status(404).send('Atividade não encontrada.');
        }

        // Renderiza o template passando a atividade e a mensagem de sucesso
        res.render('pages/aluno/entrega-atividade', { atividade, sucesso });
    } catch (err) {
        console.error('Erro ao buscar detalhes da atividade:', err);
        res.status(500).send('Erro ao buscar detalhes da atividade.');
    }
});
// Rota para outras páginas do aluno
router.get('/pendencias', verificarAlunoLogado, (req, res) => {
    res.render('pages/aluno/pendencias');
});

router.get('/perfil', verificarAlunoLogado, (req, res) => {
    res.render('pages/aluno/perfil');
});

// Rota para aluno ver suas matérias e atividades
router.get('/materias', verificarAlunoLogado, async (req, res) => {
    const idUsuario = req.session.usuario.id_usuario;

    try {
        const { data: alunoData, error: alunoError } = await supabase
            .from('aluno')
            .select('id_aluno')
            .eq('id_usuario', idUsuario)
            .single();

        if (alunoError || !alunoData) {
            console.error('Erro ao buscar ID do aluno:', alunoError);
            return res.status(500).json({ error: 'Erro ao identificar o aluno' });
        }

        const idAluno = alunoData.id_aluno;

        const { data: turmaData, error: turmaError } = await supabase
            .from('aluno_turma')
            .select('id_turma')
            .eq('id_aluno', idAluno)
            .single();

        if (turmaError || !turmaData) {
            console.error('Erro ao buscar turma do aluno:', turmaError);
            return res.status(500).json({ error: 'Erro ao buscar turma do aluno' });
        }

        const idTurma = turmaData.id_turma;

        const { data: materias, error: materiasError } = await supabase
            .from('turma_materia')
            .select('id_materia')
            .eq('id_turma', idTurma);


        if (materiasError) {
            console.error('Erro ao buscar matérias da turma:', materiasError);
            return res.status(500).json({ error: 'Erro ao buscar matérias da turma' });
        }

        // 3. Buscar as atividades associadas às matérias
        const { data: atividades, error: atividadesError } = await supabase
            .from('atividade')
            .select('*')
            .in('id_materia', materias.map(m => m.id_materia));

        if (atividadesError) {
            console.error('Erro ao buscar atividades:', atividadesError);
            return res.status(500).json({ error: 'Erro ao buscar atividades' });
        }

        // Associar atividades às respectivas matérias
        const materiasComAtividades = materias.map(materia => ({
            ...materia,
            atividades: atividades.filter(atividade => atividade.id_materia === materia.id_materia) || []
        }));


        // Renderizar a página com as matérias e atividades
        res.render('pages/aluno/materias', { materias: materiasComAtividades });
    } catch (err) {
        console.error('Erro ao buscar matérias:', err);
        res.status(500).json({ error: 'Erro ao buscar matérias' });
    }
});

router.get('/materia-mural', verificarAlunoLogado, (req, res) => {
    res.render('pages/aluno/materia-mural');
});

router.get('/materia-downloads', verificarAlunoLogado, (req, res) => {
    res.render('pages/aluno/materia-downloads');
});

router.get('/desempenho-individual', verificarAlunoLogado, async (req, res) => {
    try {
        const idUsuario = req.session.usuario.id_usuario;

        const { data: alunoData, error: alunoError } = await supabase
            .from('aluno')
            .select('id_aluno')
            .eq('id_usuario', idUsuario)
            .single();

        if (alunoError || !alunoData) {
            console.error('Erro ao buscar ID do aluno:', alunoError);
            return res.status(500).send('Erro ao identificar o aluno');
        }

        const idAluno = alunoData.id_aluno;
        console.log(idAluno);

        const { data: desempenhoAluno, error } = await supabase
            .from('aluno_materia')
            .select('id_materia, pontos')
            .eq('id_aluno', idAluno);

        if (error) {
            console.error('Erro ao buscar desempenho do aluno:', error);
            return res.status(500).send('Erro ao buscar desempenho');
        }

        // Verifica se o desempenhoAluno contém dados antes de tentar usar forEach
        if (!desempenhoAluno || desempenhoAluno.length === 0) {
            console.log('Nenhum desempenho encontrado para o aluno:', idAluno);
            return res.status(404).send('Nenhum desempenho encontrado para este aluno.');
        }

        // Log para verificar cada campo individual do desempenhoAluno
        desempenhoAluno.forEach(({ id_materia, pontos, nome_materia }) => {
            console.log(id_materia, pontos, nome_materia);
        });

        const { data: rankingAlunos, error: rankingError } = await supabase
            .from('aluno_materia')
            .select('id_aluno, pontos')
            .order('pontos', { ascending: false });

        if (rankingError) {
            console.error('Erro ao buscar ranking de alunos:', rankingError);
            return res.status(500).send('Erro ao buscar ranking');
        }

        const alunosInfo = await Promise.all(rankingAlunos.map(async aluno => {
            const alunoData = await supabase
                .from('aluno')
                .select('nome')
                .eq('id_aluno', aluno.id_aluno)
                .single();
            return {
                nome_aluno: alunoData.data.nome,
                pontos: aluno.pontos
            };
        }));

        // Renderiza a página com o desempenho do aluno e o ranking dos alunos
        res.render('pages/aluno/desempenho-individual', {
            desempenhoAluno: desempenhoAluno[0],
            rankingAlunos: alunosInfo
        });

    } catch (error) {
        console.error('Erro ao obter desempenho individual:', error);
        res.status(500).send('Erro ao obter desempenho');
    }
});

router.get('/desempenho-classe', verificarAlunoLogado, async (req, res) => {
    const idUsuario = req.session.usuario.id_usuario; // ID do usuário logado

    try {
        // 1. Buscar o ID do aluno logado
        const { data: alunoData, error: alunoError } = await supabase
            .from('aluno')
            .select('id_aluno')
            .eq('id_usuario', idUsuario)
            .single();

        if (alunoError || !alunoData) {
            console.error('Erro ao buscar ID do aluno:', alunoError);
            return res.status(500).send('Erro ao identificar o aluno');
        }

        const idAluno = alunoData.id_aluno;

        // 2. Buscar o ID da turma do aluno
        const { data: turmaData, error: turmaError } = await supabase
            .from('aluno_turma')
            .select('id_turma')
            .eq('id_aluno', idAluno)
            .single();

        if (turmaError || !turmaData) {
            console.error('Erro ao buscar turma do aluno:', turmaError);
            return res.status(500).send('Erro ao identificar a turma do aluno');
        }

        const idTurma = turmaData.id_turma;

        // 3. Buscar o desempenho de todos os alunos na turma
        const { data: desempenhoTurma, error: desempenhoError } = await supabase
            .from('aluno_materia')
            .select('id_aluno, pontos')
            .in('id_aluno', 
                (await supabase
                    .from('aluno_turma')
                    .select('id_aluno')
                    .eq('id_turma', idTurma)
                ).data.map(t => t.id_aluno) // Filtrar apenas os IDs dos alunos na turma
            );

        if (desempenhoError) {
            console.error('Erro ao buscar desempenho da turma:', desempenhoError);
            return res.status(500).send('Erro ao buscar desempenho da turma');
        }

        // 4. Somar os pontos de cada aluno para o ranking
        const ranking = {};
        desempenhoTurma.forEach(({ id_aluno, pontos }) => {
            ranking[id_aluno] = (ranking[id_aluno] || 0) + pontos;
        });

        // 5. Transformar ranking em array e ordenar por pontos (decrescente)
        const rankingArray = Object.entries(ranking).map(([id_aluno, pontos]) => ({ id_aluno, pontos }));
        rankingArray.sort((a, b) => b.pontos - a.pontos);

        // 6. Buscar nomes dos alunos para exibir no ranking
        const alunosInfo = await Promise.all(rankingArray.map(async aluno => {
            const { data, error } = await supabase
                .from('aluno')
                .select('nome')
                .eq('id_aluno', aluno.id_aluno)
                .single();
                
            return error ? null : { nome: data.nome, pontos: aluno.pontos };
        }));

        // Filtra para remover alunos não encontrados (caso de erro em algum `select`)
        const rankingFinal = alunosInfo.filter(a => a !== null);

        // Renderizar a página com o ranking
        res.render('pages/aluno/desempenho-classe', {
            ranking: rankingFinal
        });

    } catch (err) {
        console.error('Erro ao obter ranking de desempenho da turma:', err);
        res.status(500).send('Erro ao obter ranking de desempenho da turma');
    }
});

router.get('/desempenho-geral', verificarAlunoLogado, async (req, res) => {
    const idUsuario = req.session.usuario.id_usuario; // ID do usuário logado

    try {
        // 1. Buscar o ID do aluno logado
        const { data: alunoData, error: alunoError } = await supabase
            .from('aluno')
            .select('id_aluno')
            .eq('id_usuario', idUsuario)
            .single();

        if (alunoError || !alunoData) {
            console.error('Erro ao buscar ID do aluno:', alunoError);
            return res.status(500).send('Erro ao identificar o aluno');
        }

        const idAluno = alunoData.id_aluno;

        // 2. Buscar o desempenho de todos os alunos no sistema
        const { data: desempenhoGeral, error: desempenhoError } = await supabase
            .from('aluno_materia')
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
                .select('nome')
                .eq('id_aluno', aluno.id_aluno)
                .single();
                
            return error ? null : { nome: data.nome, pontos: aluno.pontos };
        }));

        // Filtra para remover alunos não encontrados (caso de erro em algum `select`)
        const rankingFinal = alunosInfo.filter(a => a !== null);

        // 6. Renderiza a página com o ranking geral
        res.render('pages/aluno/desempenho-geral', {
            ranking: rankingFinal
        });

    } catch (err) {
        console.error('Erro ao obter ranking geral dos alunos:', err);
        res.status(500).send('Erro ao obter ranking geral dos alunos');
    }
});


router.get('/calendario', verificarAlunoLogado, (req, res) => {
    res.render('pages/aluno/calendario');
});

// Rota para minigame do professor
router.get('/minigame-kart', verificarAlunoLogado, (req, res) => {
    res.render('pages/prof/minigame-kart');
});

router.get('/quiz-perguntas/:id_minigame', async (req, res) => {
    const { id_minigame } = req.params;

    // Validar o ID do minigame
    if (!id_minigame) {
        console.error("ID do minigame não fornecido.");
        return res.status(400).json({ error: 'ID do minigame é obrigatório.' });
    }

    console.log("ID recebido:", id_minigame);

    try {
        // Buscar perguntas relacionadas ao minigame
        const { data: perguntas, error: perguntasError } = await supabase
            .from('pergunta')
            .select('id_pergunta, texto')
            .eq('id_minigame', id_minigame);

        console.log("Buscando perguntas para o minigame ID:", id_minigame);
        console.log("Resultado da consulta:", perguntas);

        // Tratar erros de consulta
        if (perguntasError) {
            console.error("Erro na consulta ao Supabase:", perguntasError);
            return res.status(500).json({ error: 'Erro ao buscar perguntas do minigame.' });
        }

        // Caso nenhuma pergunta seja encontrada
        if (!perguntas || perguntas.length === 0) {
            console.warn("Nenhuma pergunta encontrada para o minigame ID:", id_minigame);
            return res.status(404).json({ error: 'Nenhuma pergunta encontrada para este minigame.' });
        }

        // Retornar perguntas encontradas
        res.status(200).json({ perguntas });
    } catch (err) {
        console.error("Erro inesperado:", err);
        res.status(500).json({ error: 'Erro inesperado ao buscar perguntas.' });
    }
});



module.exports = router;

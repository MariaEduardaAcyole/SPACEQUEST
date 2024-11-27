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

// Rota para /home-aluno
router.get('/home-aluno', verificarAlunoLogado, async (req, res) => {  // Adicionado "async" para suportar o uso de await
    const idUsuario = req.session.usuario.id_usuario; // ID do usuário logado

    try {
        // 1. Buscar as informações do usuário
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuario')
            .select('*')
            .eq('id_usuario', idUsuario)
            .single();

        if (usuarioError || !usuarioData) {
            console.error('Erro ao buscar dados do usuário:', usuarioError);
            return res.status(500).send('Erro ao buscar dados do usuário.');
        }

        // 2. Verificar se o id_aluno está na tabela 'aluno'
        const { data: alunoData, error: alunoError } = await supabase
            .from('aluno')
            .select('*')
            .eq('id_usuario', idUsuario)
            .single();

        if (alunoError || !alunoData) {
            console.error('Erro ao buscar dados do aluno:', alunoError);
            return res.status(500).send('Erro ao buscar dados do aluno.');
        }

        const idAluno = alunoData.id_aluno;

        // 3. Buscar as matérias e as pontuações do aluno
        const { data: materiasData, error: materiasError } = await supabase
            .from('aluno_materia')
            .select('id_materia, pontos')
            .eq('id_aluno', idAluno);

        if (materiasError || !materiasData) {
            console.error('Erro ao buscar matérias do aluno:', materiasError);
            return res.status(500).send('Erro ao buscar matérias.');
        }

        // 4. Buscar os nomes das matérias a partir da tabela 'materia'
        const { data: materiasNomes, error: materiasNomesError } = await supabase
            .from('materia')
            .select('id_materia, nome_materia')
            .in('id_materia', materiasData.map(materia => materia.id_materia));

        if (materiasNomesError || !materiasNomes) {
            console.error('Erro ao buscar nomes das matérias:', materiasNomesError);
            return res.status(500).send('Erro ao buscar nomes das matérias.');
        }

        // 5. Preparar os dados para o gráfico
        const labels = materiasData.map(materia => {
            const materiaEncontrada = materiasNomes.find(m => m.id_materia === materia.id_materia);
            return materiaEncontrada ? materiaEncontrada.nome_materia : 'Desconhecido';
        });

        const pontos = materiasData.map(materia => materia.pontos);

        // 6. Passar os dados para a view
        res.render('pages/aluno/home', {
            usuario: usuarioData,
            materias: materiasData,
            labels: labels,  // Passa os nomes das matérias
            pontos: pontos   // Passa as pontuações
        });

    } catch (err) {
        console.error('Erro ao exibir perfil:', err);
        res.status(500).send('Erro ao exibir perfil.');
    }
});


// Rota para listar atividades de uma matéria 
router.get('/materia-atividades/:id', verificarAlunoLogado, async (req, res) => {
    const idMateria = req.params.id;

    try {
        // Busca os dados da matéria
        const { data: materia, error: materiaError } = await supabase
            .from('materia')
            .select('*')
            .eq('id_materia', idMateria)
            .single(); // Retorna um único registro

        if (materiaError) {
            console.error('Erro ao buscar a matéria:', materiaError);
            return res.status(500).json({ error: 'Erro ao buscar os dados da matéria' });
        }

        // Busca as atividades dessa matéria
        const { data: atividades, error: atividadesError } = await supabase
            .from('atividade')
            .select('*')
            .eq('id_materia', idMateria);

        if (atividadesError) {
            console.error('Erro ao buscar atividades da matéria:', atividadesError);
            return res.status(500).json({ error: 'Erro ao buscar atividades da matéria' });
        }

        // Renderiza a página com as informações da matéria e as atividades
        res.render('pages/aluno/materia-atividades', { materia, atividades, idMateria });
    } catch (err) {
        console.error('Erro ao carregar a página da matéria:', err);
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
    const idAluno = req.session.usuario.id_usuario; // ID do aluno logado
    const idMateria = req.body.id_materia; // ID da matéria da atividade
    const pontosAtividade = req.body.pontos; // Pontos obtidos na atividade
    console.log('Usuário logado:', req.session.usuario);

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
        // Busca os detalhes da atividade
        const { data: atividade, error: atividadeError } = await supabase
            .from('atividade')
            .select('*')
            .eq('id_atividade', atividadeId)
            .single();

        if (atividadeError || !atividade) {
            return res.status(404).send('Atividade não encontrada.');
        }

        // Busca as entregas associadas à atividade
        const { data: respostas, error: respostasError } = await supabase
            .from('respostas')
            .select('id_aluno, caminho_arquivo, data_entrega') // Certifique-se de buscar a data
            .eq('id_atividade', atividadeId);

            console.error('Entregas:', respostas);

        if (respostasError) {
            return res.status(500).send('Erro ao buscar entregas.');
        }

        res.render('pages/aluno/entrega-atividade', { atividade, respostas, sucesso });
    } catch (err) {
        console.error('Erro ao buscar detalhes da atividade:', err);
        res.status(500).send('Erro ao buscar detalhes da atividade.');
    }
});

// Rota para outras páginas do aluno
router.get('/pendencias', verificarAlunoLogado, (req, res) => {
    res.render('pages/aluno/pendencias');
});

router.get('/perfil', verificarAlunoLogado, async (req, res) => {
    const idUsuario = req.session.usuario.id_usuario; // ID do usuário logado

    try {
        // 1. Buscar as informações do usuário
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuario')
            .select('*')
            .eq('id_usuario', idUsuario)
            .single();

        if (usuarioError || !usuarioData) {
            console.error('Erro ao buscar dados do usuário:', usuarioError);
            return res.status(500).send('Erro ao buscar dados do usuário.');
        }

        // Verificar se o id_aluno está na tabela 'aluno'
        const { data: alunoData, error: alunoError } = await supabase
            .from('aluno')
            .select('*')
            .eq('id_usuario', idUsuario)
            .single();

        if (alunoError || !alunoData) {
            console.error('Erro ao buscar dados do aluno:', alunoError);
            return res.status(500).send('Erro ao buscar dados do aluno.');
        }

        const idAluno = alunoData.id_aluno;

        // 2. Buscar as matérias e as pontuações do aluno
        // 2. Buscar as matérias e as pontuações do aluno
        const { data: materiasData, error: materiasError } = await supabase
            .from('aluno_materia')
            .select('id_materia, pontos')
            .eq('id_aluno', idAluno);

        if (materiasError || !materiasData) {
            console.error('Erro ao buscar matérias do aluno:', materiasError);
            return res.status(500).send('Erro ao buscar matérias.');
        }

        // 3. Buscar os nomes das matérias a partir da tabela 'materia'
        const { data: materiasNomes, error: materiasNomesError } = await supabase
            .from('materia')  // Certifique-se de que a tabela chama 'materia' e tem os campos certos
            .select('id_materia, nome_materia')  // Se o nome da matéria for 'nome_materia'
            .in('id_materia', materiasData.map(materia => materia.id_materia));

        if (materiasNomesError || !materiasNomes) {
            console.error('Erro ao buscar nomes das matérias:', materiasNomesError);
            return res.status(500).send('Erro ao buscar nomes das matérias.');
        }

        // 4. Preparar os dados para o gráfico
        const labels = materiasData.map(materia => {
            // Encontre o nome da matéria pelo id_materia
            const materiaEncontrada = materiasNomes.find(m => m.id_materia === materia.id_materia); // Corrigido
            return materiaEncontrada ? materiaEncontrada.nome_materia : 'Desconhecido';  // Verifique se o campo correto é 'nome_materia'
        });

        const pontos = materiasData.map(materia => materia.pontos); // Pontuações

        // 5. Passar os dados para a view
        res.render('pages/aluno/perfil', {
            usuario: usuarioData,
            materias: materiasData,
            labels: labels,  // Passa os nomes das matérias
            pontos: pontos   // Passa as pontuações
        });

    } catch (err) {
        console.error('Erro ao exibir perfil:', err);
        res.status(500).send('Erro ao exibir perfil.');
    }
});

const bcrypt = require('bcrypt');  // Certifique-se de importar o bcrypt

// Rota para atualizar a senha
router.post('/alterar-senha', verificarAlunoLogado, async (req, res) => {
    const idUsuario = req.session.usuario.id_usuario; // ID do usuário logado
    const { senhaAntiga, novaSenha, confirmarNovaSenha } = req.body;

    try {
        // Validação das senhas (nova senha deve ser igual à confirmação)
        if (novaSenha !== confirmarNovaSenha) {
            return res.status(400).send('As senhas não coincidem.');
        }

        // Buscar a senha do usuário no banco de dados (a senha está criptografada)
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuario')
            .select('senha')
            .eq('id_usuario', idUsuario)
            .single();

        if (usuarioError || !usuarioData) {
            console.error('Erro ao buscar dados do usuário:', usuarioError);
            return res.status(500).send('Erro ao buscar dados do usuário.');
        }

        // Comparar a senha antiga fornecida com a senha criptografada no banco de dados
        const senhaValida = await bcrypt.compare(senhaAntiga, usuarioData.senha);

        if (!senhaValida) {
            return res.status(400).send('Senha antiga incorreta.');
        }

        // Criptografar a nova senha
        const novaSenhaCriptografada = await bcrypt.hash(novaSenha, 10);

        // Atualizar a senha no banco de dados com a nova senha criptografada
        const { error: updateError } = await supabase
            .from('usuario')
            .update({ senha: novaSenhaCriptografada })
            .eq('id_usuario', idUsuario);

        if (updateError) {
            console.error('Erro ao atualizar senha:', updateError);
            return res.status(500).send('Erro ao atualizar a senha.');
        }

        // Senha atualizada com sucesso, redirecionar para o perfil
        res.redirect('/perfil');
    } catch (err) {
        console.error('Erro ao alterar a senha:', err);
        res.status(500).send('Erro ao alterar a senha.');
    }
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
        .select('id_materia, materia(nome_materia, cor_materia)')
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

        console.log('Matérias com dados completos:', materias);

        // Renderizar a página com as matérias e atividades
        res.render('pages/aluno/materias', { materias: materiasComAtividades });
    } catch (err) {
        console.error('Erro ao buscar matérias:', err);
        res.status(500).json({ error: 'Erro ao buscar matérias' });
    }
});

router.get('/materia-mural/:id', verificarAlunoLogado, async (req, res) => {
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
        res.render('pages/aluno/materia-mural', { minigames, materia, id });
    } catch (err) {
        console.error("Erro inesperado:", err);
        res.status(500).send('Erro inesperado.');
    }
});


router.get('/materia-downloads/:id', verificarAlunoLogado, (req, res) => {
    const { id } = req.params; // Ajustado para usar "id"

    res.render('pages/aluno/materia-downloads', {id});
});

router.get('/desempenho-individual', verificarAlunoLogado, async (req, res) => {
    try {
        const idUsuario = req.session.usuario.id_usuario;

        // Busca o ID do aluno com base no ID do usuário logado
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
        console.log('ID do aluno identificado:', idAluno);

        // Busca as matérias e os pontos do aluno, incluindo o nome da matéria
        const { data: desempenhoAluno, error: desempenhoError } = await supabase
            .from('aluno_materia')
            .select('id_materia, pontos, materia(nome_materia)')  // Correção: busca o nome_materia
            .eq('id_aluno', idAluno)
            .order('pontos', { ascending: false }); // Ordena por pontos de forma decrescente

        if (desempenhoError || !desempenhoAluno) {
            console.error('Erro ao buscar desempenho do aluno:', desempenhoError);
            return res.status(500).send('Erro ao buscar desempenho');
        }

        // Verifica se o aluno tem matérias registradas
        if (desempenhoAluno.length === 0) {
            return res.status(404).send('Nenhum desempenho encontrado para este aluno.');
        }

        console.log('Desempenho:', desempenhoAluno);

        // Renderiza a página com as matérias e desempenho
        res.render('pages/aluno/desempenho-individual', {
            desempenhoAluno: desempenhoAluno
        });

    } catch (error) {
        console.error('Erro ao obter desempenho individual:', error);
        res.status(500).send('Erro ao obter desempenho');
    }

});


router.get('/desempenho-classe', verificarAlunoLogado, async (req, res) => {
    const idUsuario = req.session.usuario.id_usuario; // ID do usuário logado

    try {
        // 1. Buscar o ID do aluno logado (opcional, se você precisar verificar ou exibir algo relacionado ao aluno logado)
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

        // 2. Buscar todas as turmas
        const { data: turmasData, error: turmasError } = await supabase
            .from('turma') // Supondo que você tenha uma tabela 'turma'
            .select('id_turma, nome_turma'); // Nome da turma (caso queira exibir)

        if (turmasError || !turmasData) {
            console.error('Erro ao buscar turmas:', turmasError);
            return res.status(500).send('Erro ao identificar turmas');
        }

        // 3. Para cada turma, buscar os alunos
        const turmasComDesempenho = await Promise.all(turmasData.map(async (turma) => {
            // Buscar os alunos da turma
            const { data: turmaAlunos, error: turmaAlunosError } = await supabase
                .from('aluno_turma')
                .select('id_aluno')
                .eq('id_turma', turma.id_turma);

            if (turmaAlunosError) {
                console.error(`Erro ao buscar alunos da turma ${turma.id_turma}:`, turmaAlunosError);
                return null; // Caso haja erro, ignora essa turma
            }

            // 4. Buscar o desempenho dos alunos da turma
            const { data: desempenhoTurma, error: desempenhoError } = await supabase
                .from('aluno_materia')
                .select('id_aluno, pontos')
                .in('id_aluno', turmaAlunos.map(t => t.id_aluno));

            if (desempenhoError) {
                console.error(`Erro ao buscar desempenho da turma ${turma.id_turma}:`, desempenhoError);
                return null;
            }

            // 5. Somar os pontos de cada aluno
            const totalPontos = desempenhoTurma.reduce((acc, { pontos }) => acc + pontos, 0);

            // Retornar a turma com o desempenho total
            // 5. Retornar a turma com o desempenho total
            return {
                id_turma: turma.id_turma,
                nome_turma: turma.nome_turma, // Acesso correto à propriedade nome_turma
                pontos: totalPontos          // Total de pontos da turma
            };

        }));

        // Filtrando turmas com erro (caso tenha ocorrido algum erro de busca)
        const turmasValidas = turmasComDesempenho.filter(turma => turma !== null);

        // 6. Ordenar as turmas pela pontuação total (decrescente)
        turmasValidas.sort((a, b) => b.pontos - a.pontos);

        console.log(turmasValidas); // Verifique a estrutura dos dados antes de renderizar a página
        res.render('pages/aluno/desempenho-classe', { turmas: turmasValidas });


    } catch (err) {
        console.error('Erro ao obter ranking de turmas:', err);
        res.status(500).send('Erro ao obter ranking de turmas');
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
        console.log(desempenhoGeral); // Para verificar se há vários alunos

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

router.get('/quiz/:id_minigame', verificarAlunoLogado, async (req, res) => {
    const { id_minigame } = req.params;

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

        if (perguntasError) {
            console.error("Erro na consulta de perguntas:", perguntasError);
            return res.status(500).json({ error: 'Erro ao buscar perguntas do minigame.' });
        }

        if (!perguntas || perguntas.length === 0) {
            console.warn("Nenhuma pergunta encontrada para o minigame ID:", id_minigame);
            return res.status(404).json({ error: 'Nenhuma pergunta encontrada para este minigame.' });
        }

        // Buscar alternativas relacionadas às perguntas
        const perguntasIds = perguntas.map(p => p.id_pergunta); // IDs das perguntas
        const { data: alternativas, error: alternativasError } = await supabase
            .from('alternativa')
            .select('id_pergunta, texto, correta')
            .in('id_pergunta', perguntasIds); // Busca por ID das perguntas

        if (alternativasError) {
            console.error("Erro na consulta de alternativas:", alternativasError);
            return res.status(500).json({ error: 'Erro ao buscar alternativas.' });
        }

        // Estruturar os dados para envio
        const quiz = perguntas.map(pergunta => ({
            id_pergunta: pergunta.id_pergunta,
            texto: pergunta.texto,
            alternativas: alternativas.filter(a => a.id_pergunta === pergunta.id_pergunta),
        }));

        console.log("Quiz estruturado:", quiz);

        // Renderizar o template com os dados do quiz
        res.render('pages/aluno/quiz', { quiz });

    } catch (err) {
        console.error("Erro inesperado:", err);
        res.status(500).json({ error: 'Erro inesperado ao buscar perguntas.' });
    }
});





module.exports = router;

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


router.get('/materias', verificarAlunoLogado, async (req, res) => {
    const idUsuario = req.session.usuario.id_usuario; // ID do usuário logado

    try {
        // Buscar o id_aluno associado ao id_usuario
        const { data: alunoData, error: alunoError } = await supabase
            .from('aluno')
            .select('id_aluno, nome, pontos') // Pega id_aluno, nome e pontos
            .eq('id_usuario', idUsuario)
            .single(); // Espera um único resultado

        if (alunoError) {
            console.error('Erro ao buscar dados do aluno:', alunoError);
            return res.status(500).json({ error: 'Erro ao buscar dados do aluno' });
        }

        if (!alunoData) {
            console.error('Aluno não encontrado');
            return res.status(404).json({ error: 'Aluno não encontrado' });
        }

        const { id_aluno, nome, pontos } = alunoData;

        // Buscar o id_turma através da tabela aluno_turma
        const { data: turmaData, error: turmaError } = await supabase
            .from('aluno_turma')
            .select('id_turma')
            .eq('id_aluno', id_aluno)
            .single(); // Espera um único resultado

        if (turmaError) {
            console.error('Erro ao buscar ID da turma:', turmaError);
            return res.status(500).json({ error: 'Erro ao identificar a turma' });
        }

        if (!turmaData) {
            console.error('Aluno não está associado a nenhuma turma');
            return res.status(404).json({ error: 'Aluno não está associado a nenhuma turma' });
        }

        const idTurma = turmaData.id_turma;

        // Buscar as matérias relacionadas à turma
        const { data: materias, error: materiasError } = await supabase
            .from('turma_materia')
            .select('*') // Seleciona todas as informações das matérias
            .eq('id_turma', idTurma);

        if (materiasError) {
            console.error('Erro ao buscar matérias do aluno:', materiasError);
            return res.status(500).json({ error: 'Erro ao buscar matérias' });
        }

        // Renderiza a página com as matérias do aluno e dados do aluno
        res.render('pages/aluno/materias', { 
            materias, 
            aluno: { id_aluno, nome, pontos } // Passa as informações do aluno
        });
    } catch (err) {
        console.error('Erro ao buscar matérias:', err);
        res.status(500).json({ error: 'Erro ao buscar matérias' });
    }
});


const entregaController = require('./public/js/entrega-atividade');
router.post('/entrega-atividade/:id', entregaController.upload.single('file'), entregaController.atvEntrega);

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
        .select('id_materia, materia: nome_materia')
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

router.get('/desempenho-individual', verificarAlunoLogado, (req, res) => {
    res.render('pages/aluno/desempenho-individual');
});

router.get('/desempenho-classe', verificarAlunoLogado, (req, res) => {

    // Renderiza a página de ranking passando a lista de alunos
    res.render('pages/aluno/desempenho-classe', { alunos });

});

router.get('/desempenho-geral', verificarAlunoLogado, (req, res) => {
    res.render('pages/aluno/desempenho-geral');
});

router.get('/calendario', verificarAlunoLogado, (req, res) => {
    res.render('pages/aluno/calendario');
});

// Rota para minigame do professor
router.get('/minigame-kart', verificarAlunoLogado, (req, res) => {
    res.render('pages/prof/minigame-kart');
});

router.get('/quiz', verificarAlunoLogado, (req, res) => {
    res.render('pages/prof/quiz');
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { supabase } = require('./supabaseClient'); // Conexão com o banco de dados PostgreSQL
const { verificarToken } = require('./middlewares'); // Verifique se este middleware está correto

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

// Rota para listar todas as atividades
router.get('/materia-atividades', async (req, res) => {
    const sql = 'SELECT * FROM Atividade';
    try {
        const results = await db.query(sql);
        res.render('pages/aluno/materia-atividades', { atividades: results.rows });
    } catch (err) {
        console.error('Erro ao buscar as atividades:', err);
        res.status(500).send('Erro ao buscar as atividades.');
    }
});

const entregaController = require('./public/js/entrega-atividade');
router.post('/entrega-atividade/:id', entregaController.upload.single('file'), entregaController.atvEntrega);

// Rota para exibir os detalhes da atividade e o formulário de entrega
router.get('/entrega-atividade/:id', async (req, res) => {
    const atividadeId = req.params.id; // Pega o ID da atividade da URL
    const sucesso = req.query.sucesso; // Captura a mensagem de sucesso, se houver

    // Consulta para buscar os dados da atividade no banco de dados
    const sql = `SELECT * FROM Atividade WHERE ID_Atividade = $1`;
    try {
        const result = await db.query(sql, [atividadeId]);
        if (result.rows.length === 0) {
            return res.status(404).send('Atividade não encontrada.');
        }
        // Renderiza o template passando o objeto atividade e a mensagem de sucesso
        res.render('pages/aluno/entrega-atividade', { atividade: result.rows[0], sucesso });
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
    const idAluno = req.session.usuario.id_aluno; // Obtém o ID do aluno a partir da sessão

    try {
        // 1. Busca a turma do aluno
        const { data: aluno, error: alunoError } = await supabase
            .from('aluno') // Verifique se o nome da tabela está correto
            .select('id_turma')
            .eq('id_aluno', idAluno)
            .single();

        if (alunoError) throw alunoError;

        const idTurma = aluno.id_turma;

        // 2. Busca todas as matérias da turma do aluno
        const { data: materias, error: materiasError } = await supabase
            .from('materia') // Verifique se o nome da tabela está correto
            .select('*')
            .eq('id_turma', idTurma);

        if (materiasError) throw materiasError;

        // 3. Busca as atividades para cada matéria da turma
        const atividadesPorMateria = {};
        for (const materia of materias) {
            const { data: atividades, error: atividadesError } = await supabase
                .from('atividade') // Verifique se o nome da tabela está correto
                .select('*')
                .eq('id_materia', materia.id_materia);

            if (atividadesError) throw atividadesError;
            atividadesPorMateria[materia.id_materia] = atividades;
        }

        res.render('pages/aluno/materias', { materias, atividadesPorMateria });
    } catch (err) {
        console.error('Erro ao buscar matérias ou atividades:', err);
        res.status(500).send('Erro ao buscar matérias ou atividades');
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
    res.render('pages/aluno/desempenho-classe');
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

module.exports = router;

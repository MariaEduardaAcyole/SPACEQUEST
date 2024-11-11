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

// Rota para listar todas as atividades
// Rota para listar todas as atividades de uma matéria específica
router.get('/materia-atividades/:idMateria', async (req, res) => {
    try {
        const idAluno = req.session.usuario.id_usuario; // Pega o ID do aluno logado
        const idMateria = req.params.idMateria; // Pega o ID da matéria da URL

        const { data: atividades, error } = await supabase
            .from('atividade')
            .select('*')
            .eq('id_materia', idMateria); // Adiciona o filtro para pegar atividades da matéria específica

        if (error) {
            console.error('Erro ao buscar as atividades:', error);
            return res.status(500).send(`Erro ao buscar as atividades: ${error.message}`);
        }

        // Buscar a matéria específica para mostrar seu nome
        const { data: materia, error: materiaError } = await supabase
            .from('materia')
            .select('*')
            .eq('id_materia', idMateria)
            .single(); // Pega uma única matéria

        if (materiaError) {
            console.error('Erro ao buscar matéria:', materiaError);
            return res.status(500).send('Erro ao buscar matéria');
        }

        res.render('pages/aluno/materia-atividades', {
            atividades, // Passa a lista de atividades para a view
            nome_materia: materia.nome_materia // Passa o nome da matéria
        });
    } catch (error) {
        console.error('Erro ao obter atividades:', error);
        res.status(500).send('Erro ao obter atividades');
    }
});



const entregaController = require('./public/js/entrega-atividade');
router.post('/entrega-atividade/:id', entregaController.upload.single('file'), entregaController.atvEntrega);

// Rota para exibir os detalhes da atividade e o formulário de entrega
router.get('/entrega-atividade/:id', async (req, res) => {
    const atividadeId = req.params.id;
    const sucesso = req.query.sucesso;

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
            .select('id_materia, materia(nome_materia)')
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

        // 4. Estruturar as atividades por matéria
        const atividadesPorMateria = atividades.reduce((acc, atividade) => {
            const idMateria = atividade.id_materia;
            if (!acc[idMateria]) acc[idMateria] = [];
            acc[idMateria].push(atividade);
            return acc;
        }, {});

        // 5. Renderizar a página com as matérias e atividades
        res.render('pages/aluno/materias', { materias, atividadesPorMateria });
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

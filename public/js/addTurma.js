const supabase = require('../../supabaseClient');

// Função para obter alunos e matérias
const getAlunosEMaterias = async () => {
    const { data: alunos, error: alunosError } = await supabase
        .from('aluno')
        .select('id_aluno, usuario(nome)');

    if (alunosError) throw alunosError;

    const { data: materias, error: materiasError } = await supabase
        .from('materia')
        .select('id_materia, nome_materia');

    if (materiasError) throw materiasError;

    return {
        alunos,
        materias
    };
};

// Função para adicionar uma nova turma
async function addTurma(req, res) {
    const nomeTurma = req.body.nome_turma;
    const materiasSelecionadas = req.body.materias ? req.body.materias.split(',') : [];
    const alunosSelecionados = req.body.alunos ? req.body.alunos.split(',') : [];

    console.log('Tentando inserir a turma:', { nome_turma: nomeTurma });

    if (!nomeTurma) {
        return res.status(400).send('Nome da turma é obrigatório.');
    }

    try {
        // 1. Inserir a turma com os nomes em minúsculo
        const { data: turma, error: turmaError, status, statusText } = await supabase
            .from('turma')
            .insert([{ nome_turma: nomeTurma }])
            .select()
            .single();

        if (turmaError) {
            console.error('Erro ao inserir turma:', turmaError, 'Status:', status, 'StatusText:', statusText);
            return res.status(500).send(`Erro ao cadastrar turma: ${turmaError.message || 'Erro desconhecido'}`);
        }

        if (!turma || !turma.id_turma) {
            console.error('Erro: resposta da inserção de turma é null ou não contém id_turma.');
            return res.status(500).send('Erro ao cadastrar turma: resposta inválida');
        }

        const turmaId = turma.id_turma;
        console.log('Turma cadastrada com ID:', turmaId);

        // 2. Associar as matérias à turma
        if (materiasSelecionadas.length > 0) {
            const turmaMateriaPromises = materiasSelecionadas.map((materiaId) => {
                return supabase
                    .from('turma_materia')
                    .insert([{ id_turma: turmaId, id_materia: materiaId }]);
            });
            const turmaMateriaResults = await Promise.all(turmaMateriaPromises);

            turmaMateriaResults.forEach((result, index) => {
                if (result.error) {
                    console.error(`Erro ao inserir id_materia ${materiasSelecionadas[index]} para a turma ${turmaId}:`, result.error);
                    throw result.error;
                }
            });
        }

        // 3. Associar os alunos à turma
        if (alunosSelecionados.length > 0) {
            const alunoTurmaPromises = alunosSelecionados.map((alunoId) => {
                return supabase
                    .from('aluno_turma')
                    .insert([{ id_turma: turmaId, id_aluno: alunoId }]);
            });
            const alunoTurmaResults = await Promise.all(alunoTurmaPromises);

            alunoTurmaResults.forEach((result, index) => {
                if (result.error) {
                    console.error(`Erro ao inserir id_aluno ${alunosSelecionados[index]} para a turma ${turmaId}:`, result.error);
                    throw result.error;
                }
            });
        }
        req.session.successMessage = 'Turma cadastrada com sucesso!';
        return res.redirect('/addTurma');
    } catch (err) {
        console.error('Erro inesperado ao cadastrar turma:', err);
        return res.status(500).send('Erro inesperado ao cadastrar turma');
    }
}

module.exports = {
    addTurma,
    getAlunosEMaterias
};

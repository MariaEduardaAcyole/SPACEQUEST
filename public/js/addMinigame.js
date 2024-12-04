const criarMinigameComPerguntas = async (nome, idProfessor, turma, perguntas) => {
    try {
        // Iniciar transação
        const { data: minigame, error: minigameError } = await supabase
            .from('minigame')
            .insert([{ nome_minigame: nome, id_professor: idProfessor, turma: turma }])
            .select();

        if (minigameError) throw new Error(`Erro ao criar minigame: ${minigameError.message}`);

        const minigameId = minigame[0].id;

        for (const pergunta of perguntas) {
            const { data: perguntaData, error: perguntaError } = await supabase
                .from('pergunta')
                .insert([{ id_minigame: minigameId, texto: pergunta.texto }])
                .select();

            if (perguntaError) throw new Error(`Erro ao adicionar pergunta: ${perguntaError.message}`);

            const perguntaId = perguntaData[0].id;

            for (const alternativa of pergunta.alternativas) {
                const { error: alternativaError } = await supabase
                    .from('alternativa')
                    .insert([{id_pergunta: perguntaId, texto: alternativa.texto, correta: alternativa.correta }]);

                if (alternativaError) throw new Error(`Erro ao adicionar alternativa: ${alternativaError.message}`);
            }
        }

        return minigameId; // Retornar o ID do minigame criado
    } catch (err) {
        console.error(err.message);
        throw err;
    }
};

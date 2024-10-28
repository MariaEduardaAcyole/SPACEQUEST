const express = require('express');
const router = express.Router();
const supabase = require('../../supabaseClient'); // Conexão com o Supabase

// Função para recuperar a lista de professores
const getProfessores = async () => {
    const { data, error } = await supabase
        .from('professor')
        .select('id_professor, nome');

    if (error) {
        console.error('Erro ao buscar professores:', error);
        throw new Error('Erro ao buscar professores');
    }

    return data;
};

// Rota GET para exibir a página de cadastro de matérias
router.get('/', async (req, res) => {
    try {
        const professores = await getProfessores();
        res.render('pages/prof/addmateria', { professores });
    } catch (err) {
        return res.status(500).send('Erro ao buscar professores');
    }
});

// Rota POST para processar o cadastro de matérias
router.post('/', async (req, res) => {
    const { nomeMateria, idProfessor, corMateria } = req.body; // Capturando também a cor da matéria

    if (!nomeMateria || !idProfessor || !corMateria) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    const { error } = await supabase
        .from('materia')
        .insert([{ nome_materia: nomeMateria, id_professor: idProfessor, cor_materia: corMateria }]);

    if (error) {
        console.error('Erro ao cadastrar matéria:', error);
        return res.status(500).send('Erro ao cadastrar matéria');
    }

    // Redireciona para a página de cadastro de matérias com uma mensagem de sucesso
    res.redirect('/addmateria'); // Você pode considerar adicionar um parâmetro de sucesso aqui
});

module.exports = router;

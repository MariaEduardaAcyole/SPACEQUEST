// addMateria.js

const express = require('express');
const router = express.Router();
const supabase = require('../../supabaseClient'); // Corrija o caminho para o client do Supabase

// Função para lidar com a requisição POST de adição de matéria
router.post('/', async (req, res) => {
    const { nomeMateria, idProfessor, corMateria } = req.body;

    // Verifica se todos os campos obrigatórios foram enviados
    if (!nomeMateria || !idProfessor || !corMateria) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    try {
        // Insere a nova matéria no banco de dados
        const { error } = await supabase
            .from('materia')
            .insert([{ nome_materia: nomeMateria, id_professor: idProfessor, cor_materia: corMateria }]);

        if (error) {
            console.error('Erro ao cadastrar matéria:', error);
            return res.status(500).send('Erro ao cadastrar matéria');
        }

        // Redireciona para a página de adição de matéria após o sucesso
        res.redirect('/addmateria'); // Redireciona para uma rota GET (ajuste se necessário)
    } catch (err) {
        console.error('Erro ao processar requisição:', err);
        res.status(500).send('Erro interno ao processar requisição');
    }
});

module.exports = router;

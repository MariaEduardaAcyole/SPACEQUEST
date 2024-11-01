const express = require('express');
const router = express.Router();
const supabase = require('../../supabaseClient'); // Conexão com o Supabase

// Rota GET para exibir a página de cadastro de matérias
router.get('/', async (req, res) => {
    try {
        const idProfessor = req.session.usuario.id_usuario; // Corrigido para o nome correto
        
        // Log do ID do professor
        console.log('ID do Professor:', idProfessor);

        // Buscar as matérias do professor logado
        const { data: materias, error } = await supabase
            .from('materia')
            .select('*')
            .eq('id_professor', idProfessor); // Filtra as matérias pelo id_professor

        // Log da resposta do Supabase
        console.log('Matérias encontradas:', materias);

        if (error) {
            throw error;
        }

        res.render('pages/prof/addmaterias', { materias });
    } catch (error) {
        console.error('Erro ao obter matérias:', error);
        res.status(500).send('Erro ao obter matérias');
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

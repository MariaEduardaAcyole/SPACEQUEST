const express = require('express');
const router = express.Router();
const db = require('../../db'); // Conexão com o banco de dados

const getMaterias = (callback) => {
    // Recupera a lista de professores do banco de dados
    const getProfessoresSql = 'SELECT ID_Professor, Nome FROM Professor';
    db.query(getProfessoresSql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar professores:', err);
            return callback.status(500).send('Erro ao buscar professores');
        }
        // Renderiza a página de cadastro de matérias e passa a lista de professores para o front-end
        getMaterias(null, { professores: results });
    });
};

// Rota para processar o cadastro de matérias
router.post('/addmateria', (req, res) => {
    const { nomeMateria, idProfessor, corMateria } = req.body;  // Capturando também a cor da matéria

    // Verificar se os campos obrigatórios estão presentes
    if (!nomeMateria || !idProfessor || !corMateria) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    // SQL para inserir a nova matéria no banco de dados, incluindo a cor
    const insertMateriaSql = 'INSERT INTO Materia (Nome_Materia, ID_Professor, Cor_Materia) VALUES (?, ?, ?)';
    db.query(insertMateriaSql, [nomeMateria, idProfessor, corMateria], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar matéria:', err);
            return res.status(500).send('Erro ao cadastrar matéria');
        }
        // Redirecionar de volta para a página de cadastro de matérias
        res.redirect('/addmateria'); 
    });
});

module.exports = getMaterias;

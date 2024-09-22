const express = require('express');
const router = express.Router();
const db = require('../../db'); // Conexão com o banco de dados

// Função para recuperar a lista de professores
const getProfessores = (callback) => {
    const getProfessoresSql = 'SELECT ID_Professor, Nome FROM Professor';
    db.query(getProfessoresSql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar professores:', err);
            return callback(err, null);
        }
        callback(null, results);
    });
};

// Rota GET para exibir a página de cadastro de matérias
router.get('/', (req, res) => {
    getProfessores((err, professores) => {
        if (err) return res.status(500).send('Erro ao buscar professores');
        res.render('pages/prof/addmateria', { professores });
    });
});

// Rota POST para processar o cadastro de matérias
router.post('/', (req, res) => {
    const { nomeMateria, idProfessor, corMateria } = req.body;  // Capturando também a cor da matéria

    if (!nomeMateria || !idProfessor || !corMateria) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    const insertMateriaSql = 'INSERT INTO Materia (Nome_Materia, ID_Professor, Cor_Materia) VALUES (?, ?, ?)';
    db.query(insertMateriaSql, [nomeMateria, idProfessor, corMateria], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar matéria:', err);
            return res.status(500).send('Erro ao cadastrar matéria');
        }
        res.redirect('/addmateria'); // Redireciona para a página de cadastro de matérias
    });
});

module.exports = router;

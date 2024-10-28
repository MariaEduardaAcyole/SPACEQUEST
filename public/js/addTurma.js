const express = require('express');
const router = express.Router();
const db = require('../../supabaseClient'); // Ajuste o caminho conforme necessário

// Função para obter alunos e matérias
const getAlunosEMaterias = (callback) => {
    const getAlunosSql = 'SELECT Aluno.ID_Aluno, Usuario.Nome FROM Aluno JOIN Usuario ON Aluno.ID_Usuario = Usuario.ID_Usuario';
    const getMateriasSql = 'SELECT ID_Materia, Nome_Materia FROM Materia';

    db.query(getAlunosSql, (err, alunos) => {
        if (err) {
            console.error('Erro ao buscar alunos:', err);
            return callback(err);
        }

        db.query(getMateriasSql, (err, materias) => {
            if (err) {
                console.error('Erro ao buscar matérias:', err);
                return callback(err);
            }

            // Retorna os alunos e matérias através do callback
            callback(null, { alunos, materias });
        });
    });
};

// Função POST para inserir turma no banco de dados
const addTurma = (req, res) => {
    const { nomeTurma, idAlunosSelecionados, idMateriasSelecionadas } = req.body;

    // Verificar se os campos obrigatórios estão presentes
    if (!nomeTurma || !idAlunosSelecionados || !idMateriasSelecionadas) {
        return res.status(400).send('Todos os campos são obrigatórios.');
    }

    // Converter os IDs de alunos e matérias em arrays
    const alunosArray = idAlunosSelecionados.split(',');
    const materiasArray = idMateriasSelecionadas.split(',');

    // Inserir a nova turma no banco de dados
    const insertTurmaSql = 'INSERT INTO Turma (Nome_Turma) VALUES (?)';
    db.query(insertTurmaSql, [nomeTurma], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar turma:', err);
            return res.status(500).send('Erro ao cadastrar turma');
        }

        const turmaId = result.insertId;

        // Adicionar alunos à turma
        alunosArray.forEach(idAluno => {
            const insertAlunoTurmaSql = 'INSERT INTO Aluno_Turma (ID_Aluno, ID_Turma) VALUES (?, ?)';
            db.query(insertAlunoTurmaSql, [idAluno, turmaId], (err) => {
                if (err) {
                    console.error('Erro ao adicionar aluno à turma:', err);
                }
            });
        });

        // Adicionar matérias à turma
        materiasArray.forEach(idMateria => {
            const insertTurmaMateriaSql = 'INSERT INTO Turma_Materia (ID_Turma, ID_Materia) VALUES (?, ?)';
            db.query(insertTurmaMateriaSql, [turmaId, idMateria], (err) => {
                if (err) {
                    console.error('Erro ao adicionar matéria à turma:', err);
                }
            });
        });

        // Renderizar a página novamente com a mensagem de sucesso
        getAlunosEMaterias((err, data) => {
            if (err) {
                console.error('Erro ao buscar dados para a turma:', err);
                return res.status(500).send('Erro ao buscar dados para a turma');
            }
            const { alunos, materias } = data;
            res.render('pages/prof/addTurma', { alunos, materias, successMessage: 'Turma cadastrada com sucesso!' });
        });
    });
};

module.exports = { getAlunosEMaterias, addTurma };


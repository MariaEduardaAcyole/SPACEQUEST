const express = require('express');
const router = express.Router();
const db = require('../../db'); // Conexão com o banco de dados
const bcrypt = require('bcryptjs'); // Biblioteca para hash de senha


// Rota para processar o registro
router.post('/addpessoas', (req, res) => {
    console.log(req.body); // Log dos dados recebidos para depuração

    const { ID_Usuario, senha, nome, Tipo_Usuario } = req.body;  // Capturar todos os dados do formulário

    // Verificar se os dados obrigatórios estão presentes
    if (!ID_Usuario || !senha || !nome || !Tipo_Usuario) {
        console.error('Campos obrigatórios ausentes:', { ID_Usuario, senha, nome, Tipo_Usuario });
        return res.status(400).send('Todos os campos são necessários.');
    }

    // Verifica se o ID_Usuario já existe no banco de dados
    const checkUserSql = `SELECT * FROM Usuario WHERE ID_Usuario = ?`;
    db.query(checkUserSql, [ID_Usuario], (err, results) => {
        if (err) {
            return res.status(500).send('Erro ao verificar o usuário');
        }

        if (results.length > 0) {
            res.render('pages/prof/addpessoas', { message: 'Usuário já existe' });
        } else {
            // Criptografar a senha
            bcrypt.hash(senha, 10, (err, hash) => {
                if (err) {
                    console.error('Erro ao criptografar a senha:', err); // Adicionar log de erro
                    return res.status(500).send('Erro ao criptografar a senha');
                }

                // Inserir o novo usuário no banco de dados com os campos adicionais
                const insertUserSql = `INSERT INTO Usuario (ID_Usuario, Senha,Nome, Tipo_Usuario) VALUES (?, ?, ?, ?)`;
                db.query(insertUserSql, [ID_Usuario, hash, nome, Tipo_Usuario], (err, result) => {
                    if (err) {
                        console.error('Erro ao registrar o usuário:', err); // Adicionar log de erro
                        return res.status(500).send('Erro ao registrar o usuário');
                    }

                    // Inserir na tabela Aluno ou Professor dependendo do tipo de usuário
                    if (Tipo_Usuario === 'Aluno') {
                        const insertAlunoSql = `INSERT INTO Aluno (ID_Aluno, ID_Usuario) VALUES (?, ?)`;
                        db.query(insertAlunoSql, [ID_Usuario, ID_Usuario], (err, result) => {
                            if (err) {
                                console.error('Erro ao registrar o aluno:', err);
                                return res.status(500).send('Erro ao registrar o aluno');
                            }
                            res.redirect('/login'); // Redirecionar para a página de login após o registro
                        });
                    } else if (Tipo_Usuario === 'Professor') {
                        const insertProfessorSql = `INSERT INTO Professor (ID_Professor, ID_Usuario) VALUES (?, ?)`;
                        db.query(insertProfessorSql, [ID_Usuario, ID_Usuario], (err, result) => {
                            if (err) {
                                console.error('Erro ao registrar o professor:', err);
                                return res.status(500).send('Erro ao registrar o professor');
                            }
                            res.redirect('/login'); // Redirecionar para a página de login após o registro
                        });

                    }
                });
            });
        }
    });
});

module.exports = router;

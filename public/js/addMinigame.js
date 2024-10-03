const express = require('express');
const router = express.Router();
const db = require('../../db'); // Arquivo de conexão com o banco de dados

// Rota para criar o mini-game e salvar no banco de dados
router.post('/criar-minigame', (req, res) => {
    console.log('Dados recebidos:', req.body);  // Isso vai mostrar o que foi enviado no corpo da requisição

    const { Nome_Minigame, turma, perguntas } = req.body;

    // Verifique se todas as informações necessárias foram enviadas
    if (!Nome_Minigame || !turma || !Array.isArray(perguntas) || perguntas.length === 0) {
        return res.status(400).send('Erro: Todos os campos são obrigatórios e perguntas devem ser um array.');
    }
    // Insere o mini-game na tabela MiniGame
    const sqlInsertGame = `INSERT INTO MiniGame (Nome_Minigame, ID_Professor, Turma) VALUES (?, ?, ?)`;
    db.query(sqlInsertGame, [Nome_Minigame, ID_Professor, turma], (err, result) => {
        if (err) {
            console.error('Erro ao criar mini-game:', err);
            return res.status(500).send('Erro ao criar mini-game.');
        }

        const miniGameId = result.insertId; // Pegue o ID do MiniGame criado

        // Insere cada pergunta no banco de dados
        perguntas.forEach((pergunta, perguntaIndex) => {
            if (!pergunta.texto || !Array.isArray(pergunta.alternativas) || pergunta.alternativas.length === 0) {
                console.error(`Erro na pergunta ${perguntaIndex + 1}: texto ou alternativas inválidas.`);
                return res.status(400).send(`Erro na pergunta ${perguntaIndex + 1}: texto ou alternativas inválidas.`);
            }

            const sqlInsertPergunta = `INSERT INTO Pergunta (ID_MiniGame, Texto) VALUES (?, ?)`;
            db.query(sqlInsertPergunta, [miniGameId, pergunta.texto], (err, result) => {
                if (err) {
                    console.error('Erro ao inserir pergunta:', err);
                    return;
                }

                const perguntaId = result.insertId; // Pegue o ID da pergunta inserida

                // Insere cada alternativa relacionada à pergunta
                pergunta.alternativas.forEach((alternativa, altIndex) => {
                    const isCorrect = altIndex === parseInt(pergunta.correta); // Define se é a correta
                    const sqlInsertAlternativa = `INSERT INTO Alternativa (ID_Pergunta, Texto, Correta) VALUES (?, ?, ?)`;
                    db.query(sqlInsertAlternativa, [perguntaId, alternativa, isCorrect], (err) => {
                        if (err) {
                            console.error('Erro ao inserir alternativa:', err);
                        }
                    });
                });
            });
        });

        return res.send('Mini-game criado com sucesso!');
    });
    console.log(req.body);

});

module.exports = router;

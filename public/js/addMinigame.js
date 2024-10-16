// services/minigameService.js
const db = require('../../db'); // Conexão com o MySQL

const criarMinigame = (nome, idProfessor, turma) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO Minigame (Nome_Minigame, ID_Professor, Turma) VALUES (?, ?, ?)';
        db.query(sql, [nome, idProfessor, turma], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results.insertId); // Retorna o ID do minigame criado
        });
    });
};

const adicionarPergunta = (idMiniGame, texto) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO Pergunta (ID_MiniGame, Texto) VALUES (?, ?)';
        db.query(sql, [idMiniGame, texto], (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results.insertId); // Retorna o ID da pergunta criada
        });
    });
};

const adicionarAlternativa = (idPergunta, texto, correta) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO Alternativa (ID_Pergunta, Texto, Correta) VALUES (?, ?, ?)';
        db.query(sql, [idPergunta, texto, correta], (err) => {
            if (err) {
                return reject(err);
            }
            resolve(); // Sem retorno específico
        });
    });
};

module.exports = {
    criarMinigame,
    adicionarPergunta,
    adicionarAlternativa,
};

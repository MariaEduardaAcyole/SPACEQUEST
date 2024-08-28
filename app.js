// app.js
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const db = require('./db'); // Conexão com o banco de dados
const profRoutes = require('./profRoutes'); // Importa as rotas do professor
const alunoRoutes = require('./alunoRoutes'); // Importa as rotas do aluno

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Definir rotas de alunos e professores
app.use(profRoutes);
app.use(alunoRoutes);

// Rota para exibir a página de login
app.get('/login', (req, res) => {
    res.render('pages/login', { message: null });
});

// Importar rotas de usuários
const cadastroUsuarios = require('./public/js/cadastro-usuarios'); // Importa as rotas de usuário
app.use(cadastroUsuarios);

// Rota para processar o login
app.post('/login', (req, res) => {
    const { ID_Usuario, senha } = req.body;  // Usar 'ID_Usuario' e 'senha' para capturar o formulário

    // Consulta SQL para verificar o usuário
    const sql = `SELECT * FROM Usuario WHERE ID_Usuario = ?`;  // Consulta com 'ID_Usuario'
    db.query(sql, [ID_Usuario], (err, results) => {
        if (err) {
            return res.status(500).send('Erro ao verificar o usuário');
        }

        if (results.length > 0) {
            const user = results[0];

            // Comparar a senha digitada com a senha armazenada
            bcrypt.compare(senha, user.Senha, (err, isMatch) => {
                if (err) {
                    return res.status(500).send('Erro na verificação de senha');
                }

                if (isMatch) {
                    // Redirecionar para a página adequada com base no tipo de usuário
                    if (user.Tipo_Usuario === 'Aluno') {
                        res.redirect('/aluno/home-aluno');
                    } else if (user.Tipo_Usuario === 'Professor') {
                        res.redirect('/prof/home-prof');
                    }
                } else {
                    res.render('pages/login', { message: 'Senha incorreta' });
                }
            });
        } else {
            res.render('pages/login', { message: 'Usuário não encontrado' });
        }
    });
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

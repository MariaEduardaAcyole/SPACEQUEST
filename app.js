
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const db = require('./db'); // Conexão com o banco de dados

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Configurar body-parser antes das rotas
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());  // Adiciona o suporte a JSON, caso necessário

// Importar rotas
const profRoutes = require('./profRoutes'); // Importa as rotas do professor
const alunoRoutes = require('./alunoRoutes'); // Importa as rotas do aluno
const cadastroUsuarios = require('./public/js/cadastro-usuarios'); // Importa as rotas de cadastro de usuários
app.use(profRoutes);
app.use(alunoRoutes);
app.use(cadastroUsuarios);

// Rota para exibir a página de login
app.get('/login', (req, res) => {
    res.render('pages/login', { message: null });
});

// Rota para processar o login
app.post('/login', (req, res) => {
    const { ID_Usuario, senha } = req.body;  // Captura 'ID_Usuario' e 'senha' do formulário

    console.log('Dados do formulário:', req.body); // Log dos dados recebidos

    // Consulta SQL para verificar o usuário
    const sql = `SELECT * FROM Usuario WHERE ID_Usuario = ?`;  // Consulta com 'ID_Usuario'
    db.query(sql, [ID_Usuario], (err, results) => {
        if (err) {
            console.error('Erro ao verificar o usuário:', err);
            return res.status(500).send('Erro ao verificar o usuário');
        }

        console.log('Resultado da consulta:', results); // Log dos resultados da consulta

        if (results.length > 0) {
            const user = results[0];

            // Comparar a senha digitada com a senha armazenada
            bcrypt.compare(senha, user.Senha, (err, isMatch) => {
                if (err) {
                    console.error('Erro na verificação de senha:', err);
                    return res.status(500).send('Erro na verificação de senha');
                }

                if (isMatch) {
                    console.log('Senha correta. Tipo de usuário:', user.Tipo_Usuario);
                    if (user.Tipo_Usuario === 'Aluno') {
                        console.log('Redirecionando para /home');
                        res.redirect('/home-aluno');
                    } else if (user.Tipo_Usuario === 'Professor') {
                        console.log('Redirecionando para /home-prof');
                        res.redirect('/home-prof');
                    } else {
                        console.log('Tipo de usuário desconhecido.');
                        res.render('pages/login', { message: 'Tipo de usuário desconhecido' });
                    }
                } else {
                    console.log('Senha incorreta.');
                    res.render('pages/login', { message: 'Senha incorreta' });
                }
            });
        } else {
            console.log('Usuário não encontrado no banco de dados.');
            res.render('pages/login', { message: 'Usuário não encontrado' });
        }
    });
});

// Iniciar o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
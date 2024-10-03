const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Conexão com o banco de dados

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Adiciona o suporte a JSON, caso necessário

// Importar rotas
const profRoutes = require('./profRoutes'); // Importa as rotas do professor
const alunoRoutes = require('./alunoRoutes'); // Importa as rotas do aluno
const cadastroUsuarios = require('./public/js/cadastro-usuarios'); // Importa as rotas de cadastro de usuários
app.use(profRoutes);
app.use(alunoRoutes);
app.use(cadastroUsuarios);

// Middleware para verificar o token JWT
function verificarToken(req, res, next) {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1]; // Pega o token do cabeçalho

    if (!token) {
        return res.status(403).send('Token não fornecido.');
    }

    jwt.verify(token, 'seu_segredo_aqui', (err, decoded) => {
        if (err) {
            return res.status(401).send('Token inválido.');
        }
        req.user = decoded; // Armazena os dados decodificados do usuário
        next();
    });
}

// Rota para exibir a página de login
app.get('/login', (req, res) => {
    res.render('pages/login', { message: null });
});

// Rota para processar o login
// Rota para processar o login
app.post('/login', (req, res) => {
    const { ID_Usuario, senha } = req.body; // Captura 'ID_Usuario' e 'senha' do formulário

    console.log('Dados do formulário:', req.body); // Log dos dados recebidos

    // Consulta SQL para verificar o usuário
    const sql = `SELECT * FROM Usuario WHERE ID_Usuario = ?`; // Consulta com 'ID_Usuario'
    db.query(sql, [ID_Usuario], (err, results) => {
        if (err) {
            console.error('Erro ao verificar o usuário:', err);
            return res.status(500).json({ message: 'Erro ao verificar o usuário' }); // Retorno em JSON
        }

        console.log('Resultado da consulta:', results); // Log dos resultados da consulta

        if (results.length > 0) {
            const user = results[0];

            // Comparar a senha digitada com a senha armazenada
            bcrypt.compare(senha, user.Senha, (err, isMatch) => {
                if (err) {
                    console.error('Erro na verificação de senha:', err);
                    return res.status(500).json({ message: 'Erro na verificação de senha' }); // Retorno em JSON
                }

                console.log('Senha digitada:', senha); // Log da senha digitada
                console.log('Senha armazenada (hash):', user.Senha); // Log da senha armazenada

                if (isMatch) {
                    console.log('Senha correta. Tipo de usuário:', user.Tipo_Usuario);

                    // Gerar um token JWT para o usuário autenticado
                    const token = jwt.sign({ ID_Usuario: user.ID_Usuario, Tipo_Usuario: user.Tipo_Usuario }, 'seu_segredo_aqui', { expiresIn: '1h' });

                    // Retornar o token e o tipo de usuário
                    return res.json({ message: 'Login bem-sucedido', token, tipoUsuario: user.Tipo_Usuario });
                } else {
                    console.log('Senha incorreta.');
                    return res.status(401).json({ message: 'Senha incorreta' }); // Retorno em JSON
                }
            });
        } else {
            console.log('Usuário não encontrado no banco de dados.');
            return res.status(404).json({ message: 'Usuário não encontrado' }); // Retorno em JSON
        }
    });
});

// Uso do middleware em uma rota
app.get('/home-aluno', verificarToken, (req, res) => {
    if (req.user.Tipo_Usuario !== 'Aluno') {
        return res.status(403).send('Acesso negado.');
    }
    res.render('home-aluno'); // Renderiza a página do aluno
});

app.get('/home-prof', verificarToken, (req, res) => {
    if (req.user.Tipo_Usuario !== 'Professor') {
        return res.status(403).send('Acesso negado.');
    }
    res.render('home-prof'); // Renderiza a página do professor
});

// Iniciar o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

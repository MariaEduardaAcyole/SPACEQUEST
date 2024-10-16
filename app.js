const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Conexão com o banco de dados

const session = require('express-session');

// Configuração da sessão
app.use(session({
    secret: 'segredo', // Substitua por um segredo seguro
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false , maxAge: 3600000 } // Certifique-se de que 'secure' está configurado corretamente (false para desenvolvimento local)
}));



app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json()); // Adiciona o suporte a JSON, caso necessário
app.use(bodyParser.urlencoded({ extended: true }));


const { verificarToken } = require('./middlewares'); // Importa o middleware
// ...


app.use((req, res, next) => {
    console.log('Sessão atual:', req.session);
    next();
});


app.use((req, res, next) => {
    console.log('Sessão atual (profRoutes):', req.session);
    next();
});

// Importar rotas
const profRoutes = require('./profRoutes'); // Importa as rotas do professor
const alunoRoutes = require('./alunoRoutes'); // Importa as rotas do aluno
const cadastroUsuarios = require('./public/js/cadastro-usuarios'); // Importa as rotas de cadastro de usuários

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(profRoutes);
app.use(alunoRoutes);
app.use(cadastroUsuarios);


// Rota para exibir a tela de criação de mini-game
app.get('/login', (req, res) => {
    res.render('pages/login'); // Renderiza a página que você já criou
});

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

        if (results.length > 0) {
            const user = results[0];

            bcrypt.compare(senha, user.Senha, (err, isMatch) => {
                if (err) {
                    console.error('Erro na verificação de senha:', err);
                    return res.status(500).json({ message: 'Erro na verificação de senha' });
                }
            
                if (isMatch) {
                    console.log('Senha correta. Tipo de usuário:', user.Tipo_Usuario);
            
                    // Verifica o tipo de usuário (Professor ou Aluno)
                    if (user.Tipo_Usuario === 'Professor') {
                        req.session.ID_Professor = user.ID_Usuario;  // Armazena o ID do professor
                        console.log('ID_Professor salvo na sessão:', req.session.ID_Professor); 
                    }
            
                    const token = jwt.sign({ ID_Usuario: user.ID_Usuario, Tipo_Usuario: user.Tipo_Usuario }, 'seu_segredo', { expiresIn: '1h' });
            
                    req.session.save((err) => {
                        if (err) {
                            console.error('Erro ao salvar a sessão:', err);
                            return res.status(500).json({ message: 'Erro ao salvar a sessão' });
                        }
            
                        return res.json({ message: 'Login bem-sucedido', token, tipoUsuario: user.Tipo_Usuario });
                    });
                } else {
                    return res.status(401).json({ message: 'Senha incorreta' });
                }
            });
            
                   } else {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
    });
});
// Rota para exibir a página de aluno

app.get('/home-aluno', verificarToken, (req, res) => {
    if (req.user.Tipo_Usuario !== 'Aluno') {
        return res.status(403).send('Acesso negado.');
    }
    res.render('home-aluno');
});

// Rota para exibir a página de professor e garantir que ID_Professor está na sessão
app.get('/home-prof', verificarToken, (req, res) => {
    if (req.user.Tipo_Usuario !== 'Professor') {
        return res.status(403).send('Acesso negado.');
    }

    // Garante que o ID_Professor está na sessão
    if (!req.session.ID_Professor) {
        return res.redirect('/login');

        // req.session.ID_Professor = req.user.ID_Usuario;  // Caso não esteja na sessão, coloca o ID do usuário logado
    }
    res.render('home-prof');
});



// Iniciar o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

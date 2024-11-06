require('dotenv').config(); // Carregar variáveis de ambiente

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const supabase = require('./supabaseClient'); // Conexão com o banco de dados Supabase
const { verificarToken } = require('./middlewares'); // Corrija o caminho se necessário

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração da sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'segredo',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 3600000 }
}));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para log de sessão
app.use((req, res, next) => {
    console.log('Sessão atual:', req.session);
    next();
});

// Rota de teste para conexão com o Supabase
async function testSupabase() {
    const { data, error } = await supabase.from('professor').select('*');
    if (error) {
        console.error('Erro ao buscar dados do Supabase:', error);
    }
}
testSupabase();

// Importar rotas
const profRoutes = require('./profRoutes');
const alunoRoutes = require('./alunoRoutes');
const cadastroUsuarios = require('./public/js/cadastro-usuarios');

app.use(profRoutes);
app.use(alunoRoutes);
app.use(cadastroUsuarios);

// Rota de login
// Rota de login
app.get('/login', (req, res) => {
    res.render('pages/login'); // Renderize uma página de login
});

// Atualização do app.js - Manteremos as demais partes iguais, ajustando apenas a sessão no login

app.post('/login', async (req, res) => {
    const { ID_Usuario, senha } = req.body;

    try {
        const { data, error } = await supabase
            .from('usuario')
            .select('*')
            .eq('id_usuario', ID_Usuario)
            .single();

        if (error || !data) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const user = data;
        const isMatch = await bcrypt.compare(senha, user.senha);
        if (isMatch) {
            // Salvar o usuário completo na sessão (contendo tipo e ID)
            req.session.usuario = {
                id_usuario: user.id_usuario,
                tipo_usuario: user.tipo_usuario,
            };
            return res.json({ message: 'Login bem-sucedido', tipoUsuario: user.tipo_usuario });
        } else {
            return res.status(401).json({ message: 'Senha incorreta' });
        }
    } catch (err) {
        console.error('Erro ao verificar o usuário:', err);
        return res.status(500).json({ message: 'Erro ao verificar o usuário' });
    }
});


// Rotas de home para aluno e professor
app.get('/home-aluno', verificarToken, (req, res) => {
    if (req.user.tipo_usuario !== 'Aluno') {
        return res.status(403).send('Acesso negado.');
    }
    res.render('pages/aluno/home'); // Corrigido: removido o '/' antes do nome da view
});

app.get('/home-prof', (req, res) => {
    if (req.user.tipo_usuario !== 'Professor') {
        return res.status(403).send('Acesso negado.');
    }
    res.render('pages/prof/home-prof'); // Corrigido: removido o '/' antes do nome da view
});

// Iniciar o servidor
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
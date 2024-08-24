const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Configurações de middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Importar as rotas
const profRoutes = require('./profRoutes');
app.use(profRoutes);

// Importar as rotas
const alunoRoutes = require('./alunoRoutes');
app.use(alunoRoutes);

app.get('/login', function (req, res) {
    res.render('pages/login')
})
// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

const baseUrl = "";
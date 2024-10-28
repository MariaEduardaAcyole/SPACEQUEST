const multer = require('multer');
const path = require('path');
const db = require('../../supabaseClient'); // Conexão com o banco de dados

// Configuração do armazenamento do arquivo enviado
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Pasta onde os arquivos serão armazenados
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Middleware de upload de arquivos
const upload = multer({ storage: storage });

// Função para processar a entrega de uma atividade
const atvEntrega = (req, res) => {
    const atividadeId = req.params.id; // ID da atividade passada na URL
    const alunoId = req.body.ID_Aluno; // ID do aluno, que pode ser passado via formulário
    const arquivo = req.file ? req.file.filename : null;

    if (!arquivo) {
        return res.status(400).send('Arquivo obrigatório.');
    }

    // Inserir a entrega (resposta) na tabela de respostas
    const sql = `INSERT INTO respostas (ID_Atividade, ID_Aluno, Caminho_Arquivo)
                 VALUES (?, ?, ?)`;

    db.query(sql, [atividadeId, alunoId, arquivo], (err, result) => {
        if (err) {
            console.error('Erro ao processar entrega:', err);
            return res.status(500).send('Erro ao processar a entrega.');
        }

        // Exibir uma mensagem de sucesso ao aluno após a entrega
 // Redirecionar de volta para a página de entrega com uma mensagem de sucesso
 res.redirect(`/entrega-atividade/${atividadeId}?sucesso=1`);
    });
};

module.exports = {
    upload,         // Exportando o middleware de upload
    atvEntrega      // Exportando a função para submissão de entrega
};

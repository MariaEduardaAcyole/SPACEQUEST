const multer = require('multer');
const path = require('path');
const db = require('../../db'); // Conexão com o banco de dados

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

// Função para processar a criação de atividade
const addAtividade = (req, res) => {
    const { titulo, descricao, data_vencimento, pontos } = req.body;
    const arquivo = req.file ? req.file.filename : null;

    // Verificar se o arquivo foi enviado
    if (!arquivo) {
        return res.status(400).send('Arquivo obrigatório.');
    }

    // Inserir a atividade na tabela Atividade
    const sqlAtividade = `INSERT INTO Atividade (Titulo, Descricao, Data_Vencimento, Pontos)
                          VALUES (?, ?, ?, ?)`;

    db.query(sqlAtividade, [titulo, descricao, data_vencimento, pontos], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar atividade:', err);
            return res.status(500).send('Erro ao adicionar atividade.');
        }

        const atividadeId = result.insertId; // ID da atividade recém-criada

        const sqlArquivo = `INSERT INTO Arquivo_Atividade (Nome_Arquivo, Caminho_Arquivo, Tipo_Arquivo, ID_Atividade)
                    VALUES (?, ?, ?, ?)`;

        db.query(sqlArquivo, [req.file.originalname, arquivo, req.file.mimetype, atividadeId], (err, result) => {
            if (err) {
                console.error('Erro ao salvar o arquivo da atividade:', err);
                return res.status(500).send('Erro ao salvar o arquivo da atividade.');
            }

            // Redirecionar para a página com a mensagem de sucesso
            res.render('pages/prof/addAtividade', { successMessage: 'Atividade criada com sucesso!' });
        });


    });
};

module.exports = {
    upload,      // Exportando o middleware de upload
    addAtividade // Exportando a função para adicionar atividade
};

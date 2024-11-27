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
const atvEntrega = async (req, res) => {
    const atividadeId = req.params.id;
    const alunoId = req.body.id_aluno;
    const arquivo = req.file ? req.file.filename : null;

    if (!arquivo) {
        return res.status(400).send('Arquivo obrigatório.');
    }

    try {
        // Inserindo a entrega no banco com a data automática
        const { data, error } = await db
            .from('respostas')
            .insert([
                { id_atividade: atividadeId, id_aluno: alunoId, caminho_arquivo: arquivo }
            ]);

        if (error) {
            console.error('Erro ao salvar entrega:', error);
            return res.status(500).send('Erro ao processar a entrega.');
        }

        res.redirect(`/entrega-atividade/${atividadeId}?sucesso=1`);
    } catch (err) {
        console.error('Erro ao processar entrega:', err);
        res.status(500).send('Erro ao processar a entrega.');
    }
};


module.exports = {
    upload,         // Exportando o middleware de upload
    atvEntrega      // Exportando a função para submissão de entrega
};

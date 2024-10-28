const multer = require('multer');
const path = require('path');
const supabase = require('../../supabaseClient'); // Conexão com o Supabase

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
const addAtividade = async (req, res) => {
    const { titulo, descricao, data_vencimento, pontos } = req.body;
    const arquivo = req.file ? req.file.filename : null;

    // Verificar se o arquivo foi enviado
    if (!arquivo) {
        return res.status(400).send('Arquivo obrigatório.');
    }

    // Inserir a atividade na tabela Atividade
    const { data: atividadeData, error: atividadeError } = await supabase
        .from('atividade')
        .insert([{ titulo, descricao, data_vencimento, pontos }])
        .select(); // Isso fará com que o Supabase retorne a linha inserida

    if (atividadeError) {
        console.error('Erro ao adicionar atividade:', atividadeError.message || atividadeError);
        return res.status(500).send('Erro ao adicionar atividade.');
    }

    console.log('Dados da atividade:', atividadeData); // Mova para cá

    const atividadeId = atividadeData[0].id; // Pegando o ID da atividade recém-criada

    // Inserir o arquivo relacionado à atividade
    const { error: arquivoError } = await supabase
        .from('arquivo_atividade') // Verifique se o nome da tabela está correto
        .insert([{ nome_arquivo: req.file.originalname, caminho_arquivo: arquivo, tipo_arquivo: req.file.mimetype, id_atividade: atividadeId }]);

    if (arquivoError) {
        console.error('Erro ao salvar o arquivo da atividade:', arquivoError);
        return res.status(500).send('Erro ao salvar o arquivo da atividade.');
    }

    // Redirecionar para a página com a mensagem de sucesso
    res.render('pages/prof/addAtividade', { successMessage: 'Atividade criada com sucesso!' });
};

module.exports = {
    upload,      // Exportando o middleware de upload
    addAtividade // Exportando a função para adicionar atividade
};

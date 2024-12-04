const multer = require('multer');
const path = require('path');
const supabase = require('../../supabaseClient');

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
    const { titulo, descricao, data_vencimento, pontos, id_materia } = req.body; // Inclui id_materia
    const arquivo = req.file ? req.file.filename : null;

    // Verificar se todos os campos obrigatórios foram preenchidos
    if (!titulo || !descricao || !data_vencimento || !pontos || !arquivo || !id_materia) {
        return res.status(400).send('Todos os campos, incluindo o arquivo e a matéria, são obrigatórios.');
    }

    try {
        // Inserir a atividade no banco
        const { data: atividadeData, error: atividadeError } = await supabase
            .from('atividade')
            .insert([
                {
                    titulo,
                    descricao,
                    data_vencimento,
                    pontos,
                    id_materia // Relacionando com a matéria
                }
            ])
            .select(); // Supabase retorna o ID gerado automaticamente

        if (atividadeError) {
            console.error('Erro ao adicionar atividade:', atividadeError);
            return res.status(500).send('Erro ao adicionar atividade.');
        }

        const atividadeId = atividadeData[0].id; // Pegando o ID da atividade recém-criada

        // Inserir o arquivo relacionado à atividade
        const { error: arquivoError } = await supabase
            .from('arquivo_atividade')
            .insert([
                {
                    nome_arquivo: req.file.originalname,
                    caminho_arquivo: arquivo,
                    tipo_arquivo: req.file.mimetype,
                    id_atividade: atividadeId
                }
            ]);

        if (arquivoError) {
            console.error('Erro ao salvar o arquivo da atividade:', arquivoError);
            return res.status(500).send('Erro ao salvar o arquivo da atividade.');
        }

        // Buscar a matéria para exibição
 // Buscar a matéria para exibição
const { data: materia, error: materiaError } = await supabase
.from('materia')
.select('nome_materia, cor_materia')
.eq('id_materia', id_materia) // Use o id_materia correto vindo do formulário
.single();

if (materiaError || !materia) {
console.error('Erro ao buscar matéria:', materiaError);
return res.status(404).send('Matéria não encontrada.');
}


        // Renderizar a página com a mensagem de sucesso
        res.render('pages/prof/addAtividade', {
            successMessage: 'Atividade criada com sucesso!',
            materia
        });

    } catch (err) {
        console.error('Erro ao processar a criação de atividade:', err);
        res.status(500).send('Erro interno no servidor.');
    }
};

module.exports = {
    upload,
    addAtividade
};

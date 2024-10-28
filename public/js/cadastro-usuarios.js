const express = require('express');
const router = express.Router();
const supabase = require('../../supabaseClient'); // Conexão com Supabase
const bcrypt = require('bcryptjs');

// Função auxiliar para lidar com erros
const handleError = (error, res, message) => {
    console.error(message, error);
    return res.status(500).send(message);
};

// Rota para processar o registro
router.post('/addpessoas', async (req, res) => {
    const { ID_Usuario, senha, nome, Tipo_Usuario } = req.body;

    if (!ID_Usuario || !senha || !nome || !Tipo_Usuario) {
        return res.status(400).send('Todos os campos são necessários.');
    }

    // Verifica se o ID_Usuario já existe
    const { data: existingUser, error: userError } = await supabase
        .from('usuario')
        .select('*')
        .eq('id_usuario', ID_Usuario);

    if (userError) return handleError(userError, res, 'Erro ao verificar usuário.');

    if (existingUser && existingUser.length > 0) {
        return res.render('pages/prof/addpessoas', { usuarios: existingUser, message: 'Usuário já existe' });
    }

    // Criptografar a senha
    const hashedSenha = await bcrypt.hash(senha, 10);

    // Inserir o novo usuário
    const { error: insertError } = await supabase
        .from('usuario')
        .insert([{ id_usuario: ID_Usuario, senha: hashedSenha, nome, tipo_usuario: Tipo_Usuario }]);

    if (insertError) return handleError(insertError, res, 'Erro ao registrar o usuário');

    // Inserir na tabela Aluno ou Professor conforme o tipo
    const userRoleTable = Tipo_Usuario === 'Aluno' ? 'Aluno' : 'Professor';
    const { error: insertRoleError } = await supabase
        .from(userRoleTable)
        .insert([{ id_usuario: ID_Usuario }]);

    if (insertRoleError) return handleError(insertRoleError, res, `Erro ao registrar como ${Tipo_Usuario}`);

    res.redirect('/addpessoas');
});

// Rota para exibir usuários
router.get('/addpessoas', async (req, res) => {
    const { data: usuarios, error } = await supabase
        .from('usuario')
        .select('*');

    if (error) return handleError(error, res, 'Erro ao buscar usuários');

    res.render('pages/prof/addpessoas', { usuarios: usuarios || [] });
});

// Rota para excluir usuário
router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;

    // Excluir o usuário de Aluno ou Professor
    const { error: deleteRoleError } = await supabase
        .from('Aluno')
        .delete()
        .eq('id_usuario', id);

    if (deleteRoleError) {
        await supabase
            .from('Professor')
            .delete()
            .eq('id_usuario', id);
    }

    // Excluir o usuário da tabela 'usuario'
    const { error: deleteUserError } = await supabase
        .from('usuario')
        .delete()
        .eq('id_usuario', id);

    if (deleteUserError) return handleError(deleteUserError, res, 'Erro ao excluir usuário.');

    res.status(200).send('Usuário excluído com sucesso!');
});

module.exports = router;

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
// Rota para processar o registro do usuário
router.post('/addpessoas', async (req, res) => {
    const { ID_Usuario, senha, nome, Tipo_Usuario } = req.body;

    if (!ID_Usuario || !senha || !nome || !Tipo_Usuario) {
        return res.status(400).send('Todos os campos são necessários.');
    }

    try {
        // Inserir o usuário na tabela usuario
        const { data: novoUsuario, error: usuarioError } = await supabase
            .from('usuario')
            .insert([{ id_usuario: ID_Usuario, senha, nome, tipo_usuario: Tipo_Usuario }])
            .select()
            .single();

        if (usuarioError) {
            console.error('Erro ao inserir usuário:', usuarioError);
            return res.status(500).send('Erro ao cadastrar usuário');
        }

        console.log('Usuário cadastrado:', novoUsuario);

        // Inserir na tabela correspondente com base no tipo de usuário
        if (Tipo_Usuario === 'Aluno') {
            const { error: alunoError } = await supabase
                .from('aluno')
                .insert([{ id_usuario: novoUsuario.id_usuario, nome }]);

            if (alunoError) {
                console.error('Erro ao cadastrar aluno:', alunoError);
                return res.status(500).send('Erro ao cadastrar aluno');
            }

        } else if (Tipo_Usuario === 'Professor') {
            const { error: professorError } = await supabase
                .from('professor')
                .insert([{ id_usuario: novoUsuario.id_usuario, nome }]);

            if (professorError) {
                console.error('Erro ao cadastrar professor:', professorError);
                return res.status(500).send('Erro ao cadastrar professor');
            }
        }

        return res.redirect('/addpessoas');
    } catch (err) {
        console.error('Erro inesperado:', err);
        return res.status(500).send('Erro ao cadastrar usuário');
    }
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
        .from('aluno')
        .delete()
        .eq('id_usuario', id);

    if (deleteRoleError) {
        await supabase
            .from('professor')
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

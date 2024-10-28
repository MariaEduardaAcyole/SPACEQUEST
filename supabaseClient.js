

    // supabaseClient.js
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = 'https://btdxljoxbwvolarypmfn.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0ZHhsam94Ynd2b2xhcnlwbWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3NzY2MjMsImV4cCI6MjA0NTM1MjYyM30.PDlln-b4miJKL_4iAgnNeBA6c2QgXFsrbGudCEfABTA';
    const supabase = createClient(supabaseUrl, supabaseKey);

    module.exports = supabase;

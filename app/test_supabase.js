import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kjlaotiranijvpvbfcxu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbGFvdGlyYW5panZwdmJmY3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODE0NjYsImV4cCI6MjA4NjU1NzQ2Nn0.o820qLKaX1MhHrZiEd7OQTScRm9w0f1qJuTt_T6DXr8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_type', 'service')
    .limit(2);
    
  console.log('Data:', data);
  console.log('Error:', error);
}

test();

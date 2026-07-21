/**
 * Reads the `reviews` table schema for local debugging.
 * Uses the anon key (safe to use client-side) rather than the service_role
 * key, since this script only needs read access to check column shape.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env first.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log('Checking schema for table: reviews');
    const { data, error } = await supabase.from('reviews').select('*').limit(1);

    if (error) {
        console.error('Error fetching from reviews:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        const { error: colError } = await supabase.from('reviews').select('user_id').limit(1);
        console.log(colError ? 'Column user_id probably does NOT exist.' : 'Column exists: user_id');

        const { error: colError2 } = await supabase.from('reviews').select('author_id').limit(1);
        console.log(colError2 ? 'Column author_id probably does NOT exist.' : 'Column exists: author_id');
    }
}

checkSchema();

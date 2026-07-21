/**
 * ADMIN SCRIPT — DESTRUCTIVE. Deletes ALL reviews, payments, business_photos,
 * profiles, and every Supabase Auth user. There is no undo.
 *
 * SECURITY: this script requires a Supabase service_role key, which bypasses
 * every Row Level Security policy. NEVER hardcode this key in source. Set it
 * as an environment variable that is never committed to git:
 *
 *   SUPABASE_SERVICE_ROLE_KEY=xxx SUPABASE_URL=https://xxx.supabase.co \
 *     npx tsx scripts/admin_clear_data.ts --confirm
 *
 * The key can be found in Supabase Dashboard → Project Settings → API →
 * service_role secret. If this key was ever committed to git or shared
 * outside the core team, regenerate it there immediately before using this
 * script again — a leaked service_role key grants full admin access to
 * every table and every user account with no further authentication.
 */
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
    console.error('This script refuses to run with a hardcoded key. See the header comment for usage.');
    process.exit(1);
}

const DRY_RUN = !process.argv.includes('--confirm');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

function ask(question: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

async function clearData() {
    if (DRY_RUN) {
        console.log('DRY RUN — no data will be deleted. Re-run with --confirm to actually delete data.');
    } else {
        console.log('⚠️  DESTRUCTIVE MODE — this will permanently delete ALL data and ALL users.');
        const projectRef = supabaseUrl!.replace('https://', '').split('.')[0];
        const typed = await ask(`Type the project ref "${projectRef}" to proceed, or anything else to cancel: `);
        if (typed.trim() !== projectRef) {
            console.log('Confirmation did not match. Aborting — nothing was deleted.');
            return;
        }
    }

    const tables = ['reviews', 'payments', 'business_photos', 'profiles'];

    for (const table of tables) {
        if (DRY_RUN) {
            const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
            console.log(`[dry run] Would clear table: ${table} (${count ?? 'unknown'} rows)`);
            continue;
        }
        console.log(`Clearing table: ${table}...`);
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');

        if (error && error.code === '22P02') {
            const { error: intError } = await supabase.from(table).delete().gt('id', 0);
            if (intError) console.error(`Error clearing ${table} (int):`, intError);
            else console.log(`Cleared ${table}.`);
        } else if (error) {
            console.error(`Error clearing ${table}:`, error);
        } else {
            console.log(`Cleared ${table}.`);
        }
    }

    console.log(DRY_RUN ? 'Fetching users (dry run — will not delete)...' : 'Fetching users to delete...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    if (users && users.length > 0) {
        if (DRY_RUN) {
            console.log(`[dry run] Would delete ${users.length} users.`);
        } else {
            console.log(`Found ${users.length} users. Deleting...`);
            for (const user of users) {
                const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
                if (deleteError) console.error(`Failed to delete user ${user.id}:`, deleteError);
                else console.log(`Deleted user ${user.id}`);
            }
        }
    } else {
        console.log('No users found in auth.users.');
    }

    console.log(DRY_RUN ? 'Dry run complete. Re-run with --confirm to actually delete.' : 'Cleanup complete.');
}

clearData();

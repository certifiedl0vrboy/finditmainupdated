/**
 * Debug helper for inspecting RLS behaviour.
 *
 * IMPORTANT: this script deliberately does NOT create a Supabase client with
 * the service_role key. The service_role key bypasses RLS entirely, so it
 * cannot be used to reproduce or verify an RLS policy failure experienced by
 * a real (anon/authenticated) user — using it here would validate the wrong
 * code path and risks becoming a place where the key gets hardcoded again
 * (see the audit report section 2.1 for why that was a critical finding).
 */

async function inspectPolicies() {
    console.log('To debug an RLS policy failure, either:');
    console.log('  1. Reproduce the failing query using the anon key + a real user session, or');
    console.log('  2. Inspect policies directly in the Supabase Dashboard → Authentication → Policies, or');
    console.log('  3. Query pg_policies via the SQL editor in the Supabase Dashboard.');
}

inspectPolicies();

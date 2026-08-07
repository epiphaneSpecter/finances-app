import { createBrowserClient } from '@supabase/ssr';

/**
 * Client Supabase côté navigateur (composants clients).
 * N'utilise que la clé publique "anon" — la sécurité réelle est assurée
 * par la Row Level Security côté base de données (voir CLAUDE.md §7).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

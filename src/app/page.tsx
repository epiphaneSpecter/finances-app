import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Racine : redirige selon l'état de connexion.
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/finances');
  }
  redirect('/login');
}

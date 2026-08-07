'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AuthState = { error?: string; message?: string };

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Courriel et mot de passe requis.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Identifiants invalides. Réessaie.' };
  }
  redirect('/finances');
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('full_name') ?? '').trim();

  if (!email || !password) {
    return { error: 'Courriel et mot de passe requis.' };
  }
  if (password.length < 8) {
    return { error: 'Le mot de passe doit faire au moins 8 caractères.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || null },
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Si la confirmation par courriel est activée, aucune session n'est créée.
  if (data.user && !data.session) {
    return {
      message:
        'Compte créé ! Vérifie ta boîte courriel pour confirmer ton adresse.',
    };
  }
  redirect('/finances');
}

export async function signInWithMagicLink(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) {
    return { error: 'Entre ton courriel pour recevoir un lien magique.' };
  }

  const supabase = await createClient();
  const origin = (await headers()).get('origin') ?? siteUrl();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { error: error.message };
  }
  return { message: 'Lien magique envoyé ! Vérifie ta boîte courriel.' };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

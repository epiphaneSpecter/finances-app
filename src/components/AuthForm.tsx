'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  signIn,
  signUp,
  signInWithMagicLink,
  type AuthState,
} from '@/app/login/actions';

type Mode = 'signin' | 'signup';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn full-width" disabled={pending}>
      {pending ? 'Un instant…' : label}
    </button>
  );
}

function Messages({ state }: { state: AuthState }) {
  if (state.error) return <div className="message error">{state.error}</div>;
  if (state.message) return <div className="message info">{state.message}</div>;
  return null;
}

export function AuthForm() {
  const [mode, setMode] = useState<Mode>('signin');

  const [signInState, signInAction] = useActionState(signIn, {});
  const [signUpState, signUpAction] = useActionState(signUp, {});
  const [magicState, magicAction] = useActionState(signInWithMagicLink, {});

  return (
    <div>
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === 'signin' ? 'active' : ''}
          onClick={() => setMode('signin')}
        >
          Connexion
        </button>
        <button
          type="button"
          className={mode === 'signup' ? 'active' : ''}
          onClick={() => setMode('signup')}
        >
          Inscription
        </button>
      </div>

      {mode === 'signin' ? (
        <form action={signInAction}>
          <Messages state={signInState} />
          <div className="field">
            <label htmlFor="email">Courriel</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="toi@exemple.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>
          <SubmitButton label="Se connecter" />
        </form>
      ) : (
        <form action={signUpAction}>
          <Messages state={signUpState} />
          <div className="field">
            <label htmlFor="full_name">Nom (optionnel)</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              placeholder="Epiphane"
            />
          </div>
          <div className="field">
            <label htmlFor="email-up">Courriel</label>
            <input
              id="email-up"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="toi@exemple.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password-up">Mot de passe</label>
            <input
              id="password-up"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Au moins 8 caractères"
            />
          </div>
          <SubmitButton label="Créer mon compte" />
        </form>
      )}

      <div className="divider">ou</div>

      <form action={magicAction}>
        <Messages state={magicState} />
        <div className="field">
          <label htmlFor="magic-email">Lien magique (sans mot de passe)</label>
          <input
            id="magic-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="toi@exemple.com"
          />
        </div>
        <button type="submit" className="btn secondary full-width">
          Recevoir un lien magique
        </button>
      </form>
    </div>
  );
}

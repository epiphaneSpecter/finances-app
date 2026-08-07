import { AuthForm } from '@/components/AuthForm';

export const metadata = {
  title: 'Connexion — Finances',
};

export default function LoginPage() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Finances</h1>
        <p className="subtitle">
          Ton suivi financier, pensé pour les revenus multiples et irréguliers.
        </p>
        <AuthForm />
      </div>
    </div>
  );
}

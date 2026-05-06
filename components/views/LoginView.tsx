import React, { useState } from 'react';
import { login } from '../../services/athleteService';
import { Button } from '../ui/Button';
import { UserRole, Athlete } from '../../types';

interface LoginViewProps {
  onLogin: (role: UserRole, athlete?: Athlete) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(name, code);
      onLogin(result.role, result.user);
    } catch (err) {
      setError("Accès refusé. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-nexus-choco via-nexus-black to-black">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-nexus-red to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_40px_rgba(229,46,1,0.3)]">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-wider text-white mb-2">NEXUS <span className="text-nexus-red">OS</span></h1>
          <p className="text-nexus-gray font-light tracking-widest text-sm">HIGH PERFORMANCE HYBRID SYSTEM</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl">
          <div>
            <label className="block text-nexus-gray text-xs font-bold uppercase tracking-wider mb-2">Identifiant (Nom)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nexus-red transition-colors"
              placeholder="ex: ARTHUR ou COACH"
            />
          </div>
          <div>
            <label className="block text-nexus-gray text-xs font-bold uppercase tracking-wider mb-2">Code d'accès</label>
            <input
              type="password"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nexus-red transition-colors"
              placeholder="••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Connexion...' : 'Initialiser le Système'}
          </Button>
        </form>
      </div>
    </div>
  );
};
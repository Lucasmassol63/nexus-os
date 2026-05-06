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
    } catch {
      setError('Accès refusé. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
         style={{ background: 'radial-gradient(ellipse at top, #0D2155 0%, #0B1628 50%, #060E1C 100%)' }}>
      <div className="w-full max-w-md">

        {/* Logo + Titre */}
        <div className="text-center mb-10">
          {/* Logo CNM */}
          <div className="mx-auto mb-6 w-28 h-28 flex items-center justify-center">
            <img
              src="/icon-192x192.png"
              alt="CN Marseille"
              className="w-28 h-28 object-contain drop-shadow-[0_0_24px_rgba(232,184,0,0.35)]"
            />
          </div>

          <h1 className="font-display text-5xl font-bold tracking-wider text-white mb-1">
            CNM <span style={{ color: '#E8B800' }}>HUB</span>
          </h1>
          <p className="text-sm tracking-[0.25em] uppercase font-light mt-2"
             style={{ color: '#8B9BB4' }}>
            CN Marseille · Water-Polo
          </p>

          {/* Ligne décorative */}
          <div className="flex items-center gap-3 mt-5 mx-8">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #E8B800)' }}></div>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#E8B800' }}></div>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #E8B800)' }}></div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}
              className="space-y-5 backdrop-blur-xl p-8 rounded-2xl border shadow-2xl"
              style={{ background: 'rgba(26,58,122,0.15)', borderColor: 'rgba(232,184,0,0.2)' }}>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                   style={{ color: '#8B9BB4' }}>
              Identifiant (Prénom)
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-white focus:outline-none transition-colors"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(232,184,0,0.25)' }}
              placeholder="ex: Arthur ou COACH"
              onFocus={e => e.target.style.borderColor = '#E8B800'}
              onBlur={e => e.target.style.borderColor = 'rgba(232,184,0,0.25)'}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                   style={{ color: '#8B9BB4' }}>
              Code d'accès
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-white focus:outline-none transition-colors"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(232,184,0,0.25)' }}
              placeholder="••••"
              onFocus={e => e.target.style.borderColor = '#E8B800'}
              onBlur={e => e.target.style.borderColor = 'rgba(232,184,0,0.25)'}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm text-center"
                 style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-display font-bold uppercase tracking-widest text-base transition-all active:scale-95"
            style={{
              background: loading ? '#5a5a5a' : 'linear-gradient(135deg, #E8B800, #F5D000)',
              color: '#0B1628',
              boxShadow: loading ? 'none' : '0 0 24px rgba(232,184,0,0.35)',
            }}
          >
            {loading ? 'Connexion...' : 'Accéder au Hub'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs mt-6 tracking-widest uppercase"
           style={{ color: 'rgba(139,155,180,0.5)' }}>
          Cercle des Nageurs de Marseille
        </p>
      </div>
    </div>
  );
};
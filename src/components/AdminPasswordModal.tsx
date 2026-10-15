import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { PROCEDURE_METADATA } from '../procedureData.ts';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.authorized) {
        setPassword('');
        setError(null);
        onAuthorized();
      } else {
        setError(data.error || 'Contraseña incorrecta. Acceso denegado.');
      }
    } catch (err) {
      // Fallback local check
      if (password === PROCEDURE_METADATA.adminPassword) {
        setPassword('');
        setError(null);
        onAuthorized();
      } else {
        setError('Contraseña incorrecta. Verifique e intente nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden p-6 text-center space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Shield Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg">
          <KeyRound className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">
            Acceso a Informe de Administración
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Esta sección contiene las listas de visualización y aprobación SST de SOBOCE S.A.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Contraseña de Administrador:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese contraseña..."
              className="w-full bg-slate-800 text-white text-sm px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 font-mono"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {isLoading ? (
              <span>Verificando...</span>
            ) : (
              <>
                <span>Desbloquear Informe Admin</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

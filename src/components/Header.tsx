import React from 'react';
import { ShieldCheck, UserCheck, LogOut, Lock } from 'lucide-react';
import { UserProfile } from '../types.ts';

interface HeaderProps {
  user: UserProfile | null;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onOpenCertificate?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAdmin,
  onLogout,
  onOpenCertificate,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-lg border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-950/40 border border-emerald-400/30">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                SOBOCE S.A.
              </span>
              <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                SST • IPERO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              SPT-GSS.SI.011 Rev. 11 • Seguridad y Salud en el Trabajo
            </p>
          </div>
        </div>

        {/* User Info & Admin Button */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight uppercase">
                  {user.nombre}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  CI: <span className="text-emerald-400 font-mono font-medium">{user.carnet}</span> • {user.empresa}
                </p>
              </div>

              {user.examenAprobado && (
                <button
                  onClick={onOpenCertificate}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                  title="Ver Certificado Oficial"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Certificado
                </button>
              )}

              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                title="Cambiar de participante / Salir"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400 hidden sm:inline">
              Registro obligatorio para continuar
            </span>
          )}

          {/* Admin Report Button (Google Sheet and Excel downloads are exclusively inside here) */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-950/30 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-950" />
            <span>INFORME ADMIN</span>
          </button>
        </div>
      </div>
    </header>
  );
};

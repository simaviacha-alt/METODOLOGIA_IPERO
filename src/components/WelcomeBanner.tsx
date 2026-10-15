import React from 'react';
import { Award, AlertTriangle, ShieldCheck, CheckCircle2, Video } from 'lucide-react';
import { UserProfile } from '../types.ts';

interface WelcomeBannerProps {
  user: UserProfile;
  onOpenExam: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  user,
  onOpenExam,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 mb-8">
      {/* Decorative background glow & pattern */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            SOBOCE S.A. • Sistema de Gestión SST
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono text-slate-300 bg-slate-800/80 border border-slate-700">
            Procedimiento SPT-GSS.SI.011 (Rev. 11)
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-amber-300 bg-amber-500/15 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Obligatorio para Ingreso a Planta
          </span>
        </div>

        {/* The Exact Mandatory Welcome Message */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-snug drop-shadow-sm">
          BIENVENIDO A LA CAPACITACIÓN DE IDENTIFICACIÓN DE PELIGROS, EVALUACIÓN, CONTROL DE RIESGOS OCUPACIONALES Y OPORTUNIDADES SST (IPERO)
        </h1>

        {/* Worker Context Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
            <div>
              <span className="text-slate-400">Participante:</span>{' '}
              <strong className="text-white font-semibold">{user.nombre}</strong>
            </div>
            <div className="hidden sm:inline text-slate-600">•</div>
            <div>
              <span className="text-slate-400">C.I.:</span>{' '}
              <span className="text-emerald-400 font-mono font-bold">{user.carnet}</span>
            </div>
            <div className="hidden sm:inline text-slate-600">•</div>
            <div>
              <span className="text-slate-400">Empresa:</span>{' '}
              <span className="text-slate-200">{user.empresa}</span>
            </div>
            <div className="hidden sm:inline text-slate-600">•</div>
            <div>
              <span className="text-slate-400">Cargo:</span>{' '}
              <span className="text-slate-200">{user.cargo}</span>
            </div>
          </div>

          {/* Quick status pill / Exam shortcut if ready */}
          <div className="flex items-center gap-3">
            {user.videoProgreso >= 100 ? (
              <button
                onClick={onOpenExam}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer animate-bounce"
              >
                <Award className="w-4 h-4 text-slate-950" />
                {user.examenAprobado ? 'Ver Resultado Examen (Aprobado)' : 'Rendir Examen SST (Habilitado)'}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 text-xs text-slate-300 border border-slate-700">
                <Video className="w-3.5 h-3.5 text-amber-400" />
                <span>Video al <strong>{user.videoProgreso}%</strong> (Completa el 100% para el examen)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

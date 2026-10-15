import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, ExternalLink, CheckCircle2, RotateCw, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

interface QRFormCheckpointModalProps {
  isOpen: boolean;
  onFinishCountdown: () => void;
  formUrl: string;
}

export const QRFormCheckpointModal: React.FC<QRFormCheckpointModalProps> = ({
  isOpen,
  onFinishCountdown,
  formUrl,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isCompleted, setIsCompleted] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0); // 0 is already corrected upright

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(60);
      setIsCompleted(false);
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRotate = () => {
    setRotationDegrees((prev) => (prev + 90) % 360);
  };

  const progressPercentage = Math.round(((60 - secondsLeft) / 60) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-emerald-500/80 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight leading-snug">
                Paso Obligatorio: Registro en Formulario
              </h2>
              <p className="text-xs text-emerald-100">
                Escanea el código QR antes de habilitar el examen final
              </p>
            </div>
          </div>

          <button
            onClick={handleRotate}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs flex items-center gap-1 cursor-pointer transition-colors"
            title="Girar orientación de la imagen"
          >
            <RotateCw className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px] font-semibold">Girar</span>
          </button>
        </div>

        {/* 1-Minute Timer Status Bar */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-200">
              <Clock className={`w-4 h-4 ${isCompleted ? 'text-emerald-400' : 'text-amber-400 animate-spin'}`} />
              {isCompleted ? (
                <span className="text-emerald-400">¡Tiempo completado! Ya puedes avanzar.</span>
              ) : (
                <span>Tiempo obligatorio para llenado de formulario (1 minuto):</span>
              )}
            </span>
            <span className="font-mono text-base font-black text-amber-400">
              00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className={`h-full transition-all duration-1000 ${
                isCompleted
                  ? 'bg-emerald-400'
                  : 'bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* The Exact Poster (Oriented to the Correct Side) */}
        <div className="p-6 flex flex-col items-center justify-center space-y-5 bg-slate-950">
          <div
            className="relative bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border-4 border-slate-900 shadow-xl max-w-sm w-full text-center transition-transform duration-300 overflow-hidden"
            style={{ transform: `rotate(${rotationDegrees}deg)` }}
          >
            {/* Background Smiley watermark exactly as in physical document */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
              <div className="text-9xl font-black">: )</div>
            </div>

            {/* Poster Title - Horizontal and upright at the top */}
            <div className="relative z-10 mb-4 pb-2 border-b-2 border-slate-800">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
                Metodología de identificación y evaluación de Riesgos
              </h3>
              <p className="text-[10px] uppercase font-bold text-slate-600 mt-1 font-mono">
                SOBOCE S.A. • FORMULARIO SST
              </p>
            </div>

            {/* Crisp, Scannable QR Code */}
            <div className="relative z-10 p-3 bg-white rounded-xl inline-block shadow-md border border-slate-200 mx-auto">
              <QRCodeSVG
                value={formUrl}
                size={210}
                level="H"
                includeMargin={true}
              />
            </div>

            <p className="relative z-10 text-[11px] font-semibold text-slate-700 mt-3">
              Apunta con la cámara de tu celular para abrir el formulario
            </p>
          </div>

          {/* Direct Link button */}
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <span>¿Estás en la computadora? Abrir Formulario en otra pestaña</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Action Bottom Bar */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            {!isCompleted ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Espera que culmine el minuto para desbloquear el examen.</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-bold">¡Requisito del formulario completado!</span>
              </>
            )}
          </div>

          <button
            onClick={onFinishCountdown}
            disabled={!isCompleted}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-950/50 animate-bounce'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Continuar y Habilitar Examen SST ({secondsLeft > 0 ? `${secondsLeft}s` : 'Listo'})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

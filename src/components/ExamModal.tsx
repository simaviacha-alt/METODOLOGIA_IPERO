import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, Clock, ShieldAlert, Sparkles, ArrowRight, RotateCcw, Unlock, FileCheck } from 'lucide-react';
import { UserProfile, ExamQuestion } from '../types.ts';
import { getRandomExamQuestions, PROCEDURE_METADATA } from '../procedureData.ts';

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onExamCompleted: (updatedUser: UserProfile) => void;
  onViewCertificate: () => void;
}

export const ExamModal: React.FC<ExamModalProps> = ({
  isOpen,
  onClose,
  user,
  onExamCompleted,
  onViewCertificate,
}) => {
  // Current active 10 randomized questions for this session
  const [activeQuestions, setActiveQuestions] = useState<ExamQuestion[]>([]);
  // Answers map: questionId -> selectedOptionIndex
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);
  const [countdownString, setCountdownString] = useState<string>('');
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [showSupervisorBypass, setShowSupervisorBypass] = useState(false);
  const [bypassPin, setBypassPin] = useState('');
  const [bypassError, setBypassError] = useState('');

  // Fetch or pick 10 random questions when modal is opened
  useEffect(() => {
    if (isOpen && !examResult && !user.examenAprobado) {
      // Fetch 10 randomized questions from API or helper
      fetch('/api/exam/questions')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.questions && data.questions.length > 0) {
            setActiveQuestions(data.questions);
          } else {
            setActiveQuestions(getRandomExamQuestions(10));
          }
        })
        .catch(() => {
          setActiveQuestions(getRandomExamQuestions(10));
        });
      setAnswers({});
    }
  }, [isOpen, user.examenAprobado]);

  // Check 24-hour lockout status
  useEffect(() => {
    const checkLock = () => {
      if (user.siguienteIntentoPermitido && !user.examenAprobado) {
        const remaining = user.siguienteIntentoPermitido - Date.now();
        if (remaining > 0) {
          setIsLockedOut(true);
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          setCountdownString(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setIsLockedOut(false);
          setCountdownString('');
        }
      } else {
        setIsLockedOut(false);
      }
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [user.siguienteIntentoPermitido, user.examenAprobado]);

  if (!isOpen) return null;

  const totalQuestions = activeQuestions.length || 10;
  const answeredCount = Object.keys(answers).length;

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (examResult?.aprobado || isLockedOut) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      alert(`Por favor responde todas las preguntas antes de enviar (${answeredCount}/${totalQuestions} respondidas).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carnet: user.carnet,
          answers,
          questionIds: activeQuestions.map((q) => q.id),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la evaluación.');
      }

      setExamResult(data);
      onExamCompleted(data.user);
    } catch (err: any) {
      alert(err.message || 'Error al enviar examen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBypassUnlock = async () => {
    if (bypassPin !== 'CVCM2026!)' && bypassPin !== '1234' && bypassPin !== 'admin') {
      setBypassError('PIN incorrecto. (PIN de supervisor: CVCM2026!)');
      return;
    }

    try {
      const response = await fetch('/api/exam/bypass-lockout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carnet: user.carnet }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsLockedOut(false);
        setExamResult(null);
        setAnswers({});
        setShowSupervisorBypass(false);
        setBypassPin('');
        setActiveQuestions(getRandomExamQuestions(10));
        onExamCompleted(data.user);
      }
    } catch (e) {
      setBypassError('Error al contactar con el servidor.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                Examen de Evaluación IPERO SST
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                SPT-GSS.SI.011 Rev. 11 • Aprobación requerida: 80% (8/10 mín.)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
          >
            Cerrar ✕
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* 1. LOCKOUT BANNER (IF FAILED WITHIN 24 HOURS) */}
          {isLockedOut && !user.examenAprobado && (
            <div className="p-6 bg-rose-500/10 border-2 border-rose-500/40 rounded-3xl text-rose-200 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-black text-rose-300 uppercase tracking-tight">
                    Evaluación No Aprobada • Periodo de Espera Obligatorio
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    EN CASO DE REPROBAR SE DEBE ESPERAR 1 DÍA (24 HORAS) PARA VOLVER A INTENTAR LA EVALUACIÓN.
                    Aprovecha este tiempo para revisar el video instructivo y realizar tus consultas con el bot oficial.
                  </p>
                </div>
              </div>

              {/* Countdown Display */}
              <div className="p-4 bg-slate-900/90 rounded-2xl border border-rose-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                  <span className="text-xs text-slate-300">Tiempo restante para el siguiente intento:</span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                  {countdownString}
                </div>
              </div>

              {/* Supervisor Bypass toggle for testing */}
              <div className="pt-2 border-t border-rose-500/20 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setShowSupervisorBypass(!showSupervisorBypass)}
                  className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  {showSupervisorBypass ? 'Ocultar bypass de supervisión' : '¿Eres supervisor de SST? Desbloquear para reintento'}
                </button>

                {showSupervisorBypass && (
                  <div className="flex items-center gap-2 mt-2 w-full sm:w-auto">
                    <input
                      type="password"
                      value={bypassPin}
                      onChange={(e) => setBypassPin(e.target.value)}
                      placeholder="PIN Supervisor (1234)"
                      className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700"
                    />
                    <button
                      onClick={handleBypassUnlock}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Desbloquear
                    </button>
                    {bypassError && <span className="text-[10px] text-rose-400">{bypassError}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. SUCCESS CELEBRATION (APPROVED >= 80%) */}
          {(examResult?.aprobado || user.examenAprobado) && (
            <div className="p-6 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500 rounded-3xl text-emerald-200 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg">
                <Sparkles className="w-10 h-10 animate-bounce" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-300 uppercase tracking-tight">
                ¡FELICIDADES! CONCLUYÓ CON ÉXITO LA CAPACITACIÓN
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                Has alcanzado un puntaje de{' '}
                <strong className="text-emerald-400 font-mono font-bold text-base">
                  {examResult?.nota ?? user.examenNota}%
                </strong>
                , superando el estándar mínimo del 80%. Tu acreditación en la Identificación de Peligros, Evaluación, Control de Riesgos Ocupacionales y Oportunidades SST (IPERO) ha sido registrada formalmente.
              </p>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  onClick={onViewCertificate}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 text-slate-950" />
                  Descargar / Imprimir Certificado Oficial
                </button>
              </div>
            </div>
          )}

          {/* 3. EXAM QUESTIONS LIST (When not locked out) */}
          {!isLockedOut && (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>
                  Respondidas: <strong className="text-emerald-400">{answeredCount}</strong> de {totalQuestions}
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  Condición de aprobación: Mínimo 8 aciertos (80%)
                </span>
              </div>

              {activeQuestions.map((q, idx) => {
                const selectedOpt = answers[q.id];
                const isSubmitted = Boolean(examResult);
                const isCorrect = isSubmitted && selectedOpt === q.respuestaCorrecta;
                const isWrong = isSubmitted && selectedOpt !== undefined && selectedOpt !== q.respuestaCorrecta;

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCorrect
                        ? 'bg-emerald-950/20 border-emerald-500/50'
                        : isWrong
                          ? 'bg-rose-950/20 border-rose-500/50'
                          : selectedOpt !== undefined
                            ? 'bg-slate-850 border-slate-700'
                            : 'bg-slate-850/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center font-bold font-mono text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                        {q.pregunta}
                      </h4>
                    </div>

                    {/* Options list */}
                    <div className="space-y-2 pl-10">
                      {q.opciones.map((opt, optIdx) => {
                        const isChosen = selectedOpt === optIdx;
                        const isThisCorrect = isSubmitted && optIdx === q.respuestaCorrecta;

                        return (
                          <label
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              isThisCorrect
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                                : isChosen && isWrong
                                  ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                                  : isChosen
                                    ? 'bg-emerald-500/15 border-emerald-500/60 text-white'
                                    : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800 hover:border-slate-650'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              checked={isChosen}
                              onChange={() => handleSelectOption(q.id, optIdx)}
                              disabled={isSubmitted || isLockedOut}
                              className="mt-0.5 accent-emerald-500"
                            />
                            <span className="flex-1 leading-relaxed">{opt}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Explanation if submitted */}
                    {isSubmitted && (
                      <div className="mt-3 ml-10 p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 text-xs text-slate-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-400">
                          <span>{q.articuloReferencia}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{q.explicacion}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-slate-900 p-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Participante:{' '}
            <strong className="text-white">{user.nombre}</strong> (CI: {user.carnet})
          </div>

          <div className="flex items-center gap-3">
            {user.examenAprobado ? (
              <button
                onClick={onViewCertificate}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" />
                Ver Certificado de Aprobación
              </button>
            ) : isLockedOut ? (
              <span className="text-xs font-mono text-rose-400">
                Bloqueado hasta cumplir 24h
              </span>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || answeredCount < totalQuestions}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isSubmitting ? (
                  <span>Evaluando respuestas...</span>
                ) : (
                  <>
                    <span>Enviar Examen Final ({answeredCount}/{totalQuestions})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

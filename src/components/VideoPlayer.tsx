import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Lock, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, Volume2, VolumeX, RotateCcw, Clock, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { UserProfile } from '../types.ts';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  user: UserProfile;
  videoId: string;
  formUrl: string;
  onProgressUpdate: (percentage: number) => Promise<void>;
  onCompleteAll: () => void;
  onOpenExam: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  user,
  videoId,
  formUrl,
  onProgressUpdate,
  onCompleteAll,
  onOpenExam,
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tickerTimerRef = useRef<any>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0); // Real duration from YouTube
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTimeReached, setMaxTimeReached] = useState(0);
  const [skipWarning, setSkipWarning] = useState<string | null>(null);
  const [lastSavedStep, setLastSavedStep] = useState(user.videoProgreso || 0);

  // 1-minute QR Form Overlay state
  const [showQROverlay, setShowQROverlay] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(60);
  const [isQrCompleted, setIsQrCompleted] = useState(user.videoProgreso >= 100 || user.videoCompletado);

  // Trigger QR overlay safely
  const triggerQrOverlay = useCallback(() => {
    if (isQrCompleted) return;
    setShowQROverlay(true);
    setIsPlaying(false);
    try {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    } catch (e) {}
  }, [isQrCompleted]);

  // Load YouTube IFrame API and initialize player
  useEffect(() => {
    let isMounted = true;

    const setupPlayer = () => {
      if (!isMounted || !window.YT || !window.YT.Player) return;

      // Clean up previous instance if any
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }

      try {
        playerRef.current = new window.YT.Player('ipero-yt-player', {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            fs: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setIsReady(true);
              const dur = Math.round(event.target.getDuration() || 0);
              if (dur > 0) {
                setDuration(dur);
                // If user already had progress, seek to that position
                if (user.videoProgreso > 0 && user.videoProgreso < 100) {
                  const resumeSec = Math.floor((user.videoProgreso / 100) * dur);
                  event.target.seekTo(resumeSec, true);
                  setCurrentTime(resumeSec);
                  setMaxTimeReached(resumeSec);
                }
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              // YT.PlayerState: PLAYING (1), PAUSED (2), ENDED (0), BUFFERING (3)
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                // Video Ended naturally!
                setIsPlaying(false);
                triggerQrOverlay();
              }
            },
            onError: (err: any) => {
              console.warn('[YT Player Event Error]:', err);
            },
          },
        });
      } catch (err) {
        console.error('Error creating YT.Player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        setupPlayer();
      };

      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }

    return () => {
      isMounted = false;
      try {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }
      } catch (e) {}
    };
  }, [videoId, triggerQrOverlay]);

  // Sync initial user progress to local state
  useEffect(() => {
    if (user.videoProgreso > 0) {
      setLastSavedStep(user.videoProgreso);
      if (duration > 0) {
        const resumedSec = Math.floor((user.videoProgreso / 100) * duration);
        setMaxTimeReached((prev) => Math.max(prev, resumedSec));
        setCurrentTime(resumedSec);
      }
    }
    if (user.videoProgreso >= 100 || user.videoCompletado) {
      setIsQrCompleted(true);
    }
  }, [user.videoProgreso, user.videoCompletado, duration]);

  // Active polling ticker to track time, advance continuous progress, and prevent forward skipping
  useEffect(() => {
    if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);

    tickerTimerRef.current = setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;

      try {
        const curr = Math.floor(playerRef.current.getCurrentTime() || 0);
        const dur = Math.floor(playerRef.current.getDuration() || 0);

        if (dur > 0 && dur !== duration) {
          setDuration(dur);
        }

        const playerState = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
        const activePlaying = playerState === 1;

        if (activePlaying !== isPlaying) {
          setIsPlaying(activePlaying);
        }

        if (activePlaying) {
          const effectiveDur = dur > 0 ? dur : duration;
          const savedCheckpointSec = Math.floor(((user.videoProgreso || 0) / 100) * (effectiveDur || 1));
          const currentAllowedMax = Math.max(maxTimeReached, savedCheckpointSec);

          // Anti-skip enforcement: Prevent skipping forward ahead of watched position
          if (curr > currentAllowedMax + 3 && !user.videoCompletado && !isQrCompleted) {
            playerRef.current.seekTo(currentAllowedMax, true);
            setCurrentTime(currentAllowedMax);
            setSkipWarning('⚠️ Prohibido adelantar: La capacitación SST exige visualización continua para certificar.');
            setTimeout(() => setSkipWarning(null), 3000);
            return;
          }

          const updatedMax = Math.max(currentAllowedMax, curr);
          setMaxTimeReached(updatedMax);
          setCurrentTime(curr);

          // Check 5% stepped intervals
          if (effectiveDur > 0) {
            const rawPercent = Math.min(100, Math.floor((updatedMax / effectiveDur) * 100));
            const steppedPercent = Math.floor(rawPercent / 5) * 5;

            if (steppedPercent > lastSavedStep) {
              setLastSavedStep(steppedPercent);
              onProgressUpdate(steppedPercent);
            }

            // When video reaches end (or within 2 seconds of completion), show QR Overlay!
            if (curr >= effectiveDur - 2 && !isQrCompleted && !showQROverlay) {
              triggerQrOverlay();
            }
          }
        }
      } catch (err) {}
    }, 500);

    return () => {
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current);
    };
  }, [
    isPlaying,
    duration,
    maxTimeReached,
    lastSavedStep,
    user.videoProgreso,
    user.videoCompletado,
    isQrCompleted,
    showQROverlay,
    onProgressUpdate,
    triggerQrOverlay,
  ]);

  // Unified Toggle Play / Pause: Works with single button below and video overlay
  const togglePlay = () => {
    if (showQROverlay && !isQrCompleted) return;

    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') {
      return;
    }

    try {
      const state = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
      if (state === 1 || isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        // If resuming from previous saved progress and current time is at zero
        if (user.videoProgreso > 0 && user.videoProgreso < 100 && currentTime < 5 && duration > 0) {
          const resSec = Math.floor((user.videoProgreso / 100) * duration);
          playerRef.current.seekTo(resSec, true);
          setCurrentTime(resSec);
          setMaxTimeReached((prev) => Math.max(prev, resSec));
        }
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('Error in togglePlay:', e);
    }
  };

  // Direct resume handler from banner
  const handleResumeClick = () => {
    if (!playerRef.current || duration <= 0) return;
    const resSec = Math.floor((user.videoProgreso / 100) * duration);
    try {
      playerRef.current.seekTo(resSec, true);
      playerRef.current.playVideo();
      setCurrentTime(resSec);
      setMaxTimeReached((prev) => Math.max(prev, resSec));
      setIsPlaying(true);
    } catch (e) {}
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {}
  };

  const rewind10 = () => {
    if (!playerRef.current) return;
    const target = Math.max(0, currentTime - 10);
    try {
      playerRef.current.seekTo(target, true);
      setCurrentTime(target);
    } catch (e) {}
  };

  // 1-MINUTE QR COUNTDOWN TIMER
  useEffect(() => {
    if (!showQROverlay || isQrCompleted) return;

    const qrTimer = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(qrTimer);
          setIsQrCompleted(true);
          setShowQROverlay(false);
          setLastSavedStep(100);
          onProgressUpdate(100);
          onCompleteAll();
          // Auto open exam once completed
          setTimeout(() => onOpenExam(), 400);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(qrTimer);
  }, [showQROverlay, isQrCompleted, onProgressUpdate, onCompleteAll, onOpenExam]);

  const currentPercent = lastSavedStep;
  const isFullyCompleted = currentPercent >= 100 || user.videoCompletado || isQrCompleted;

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl mb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              Video Oficial de Capacitación IPERO SST
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Bloqueo Anti-Adelanto Activo
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualización auditada y continua • El tiempo avanza automáticamente segundo a segundo y se registra cada 5%.
          </p>
        </div>

        {/* Progress Value Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Progreso Verificado</span>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {currentPercent}%
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            {isFullyCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <span className="text-xs font-mono font-bold text-emerald-400">5%</span>
            )}
          </div>
        </div>
      </div>

      {/* CI Progress Resume Banner */}
      {user.videoProgreso > 0 && (
        <div className="mb-4 p-3.5 bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-black text-sm border border-emerald-500/30">
              {user.videoProgreso}%
            </div>
            <div>
              <p className="text-xs text-white font-bold flex items-center gap-1.5">
                <span>Sesión Reconocida por Carnet (CI: {user.carnet})</span>
                <span className="text-slate-400 font-normal">• {user.nombre}</span>
              </p>
              <p className="text-[11px] text-emerald-300">
                {user.videoProgreso >= 100 || user.videoCompletado
                  ? '¡Has completado el 100% de la capacitación! El examen final se encuentra habilitado.'
                  : `Avance guardado: ${user.videoProgreso}%. Presiona "Reanudar Video" abajo o el botón directo.`}
              </p>
            </div>
          </div>

          {user.videoProgreso > 0 && user.videoProgreso < 100 && (
            <button
              onClick={handleResumeClick}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 transition-all shrink-0 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Reanudar desde el {user.videoProgreso}%</span>
            </button>
          )}
        </div>
      )}

      {/* Warning Alert if user attempts forward skip */}
      {skipWarning && (
        <div className="mb-4 p-3 bg-amber-500/20 border-2 border-amber-500 rounded-2xl text-amber-200 text-xs font-semibold flex items-center gap-2.5 animate-bounce shadow-lg">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{skipWarning}</span>
        </div>
      )}

      {/* Video Container Frame */}
      <div
        ref={containerRef}
        className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl select-none group"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Top Header Shield */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/95 via-black/80 to-transparent z-10 flex items-center px-4 pointer-events-auto cursor-default">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-tight">
              Capacitación Oficial IPERO SST • SOBOCE S.A.
            </span>
          </div>
        </div>

        {/* Bottom-Right Shield: Covers "Ver en YouTube" button */}
        <div className="absolute bottom-0 right-0 w-36 h-10 bg-slate-950/95 border-t border-l border-slate-800 rounded-tl-xl z-10 flex items-center justify-center gap-1.5 pointer-events-auto cursor-default">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-bold text-slate-200 font-mono">
            SOBOCE SST
          </span>
        </div>

        {/* Official YouTube Player Hook Element */}
        <div id="ipero-yt-player" className="w-full h-full" />

        {/* Big Center Play/Pause Overlay for intuitive 1-click interaction */}
        {!isPlaying && isReady && !showQROverlay && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 z-20 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-950/30"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/50 transform hover:scale-110 active:scale-95 transition-all">
              <Play className="w-9 h-9 fill-slate-950 ml-1" />
            </div>
            <span className="mt-3 px-4 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold border border-slate-700 shadow-md">
              {currentTime > 0 ? `Reanudar Video (${formatTime(currentTime)})` : 'Comenzar Reproducción'}
            </span>
          </div>
        )}

        {/* OVERLAID QR POSTER WHEN VIDEO FINISHES (Overlaid for 1 minute before exam unlocks) */}
        {showQROverlay && !isQrCompleted && (
          <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in duration-300">
            {/* Poster Header */}
            <div className="mb-2 max-w-md">
              <span className="px-3.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
                <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                Paso Obligatorio: Escaneo de Formulario QR (1 Minuto)
              </span>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mt-2">
                Metodología de Identificación y Evaluación de Riesgos (IPERO)
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Escanea el código QR con tu teléfono móvil para completar tu formulario antes de habilitar el examen final.
              </p>
            </div>

            {/* Scannable QR Code */}
            <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-emerald-500 my-2">
              <QRCodeSVG value={formUrl} size={155} level="H" includeMargin={true} />
            </div>

            {/* Countdown Bar */}
            <div className="w-full max-w-xs space-y-1 mt-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span>Tiempo restante para examen:</span>
                <span className="text-amber-400 font-bold text-sm">
                  00:{qrSecondsLeft < 10 ? `0${qrSecondsLeft}` : qrSecondsLeft}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-amber-500 via-teal-400 to-emerald-400 h-full transition-all duration-1000"
                  style={{ width: `${Math.round(((60 - qrSecondsLeft) / 60) * 100)}%` }}
                />
              </div>
            </div>

            {/* Direct buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <a
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-700 shadow-sm"
              >
                <span>Abrir Formulario en otra pestaña</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {qrSecondsLeft <= 45 && (
                <button
                  onClick={() => {
                    setQrSecondsLeft(0);
                    setIsQrCompleted(true);
                    setShowQROverlay(false);
                    setLastSavedStep(100);
                    onProgressUpdate(100);
                    onCompleteAll();
                    setTimeout(() => onOpenExam(), 300);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ya completé el formulario → Ir al Examen</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SINGLE PLATFORM PLAYBACK CONTROLS (Only 1 Unified Play Button) */}
      <div className="mt-4 p-3.5 bg-slate-850 rounded-2xl border border-slate-750 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          {/* THE ONLY ONE PLAY / PAUSE / REANUDAR BUTTON */}
          <button
            onClick={togglePlay}
            disabled={showQROverlay && !isQrCompleted}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 active:scale-95"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-slate-950" />
                <span>Pausar Video</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{currentTime > 0 ? `Reanudar Video (${formatTime(currentTime)})` : 'Reproducir Video'}</span>
              </>
            )}
          </button>

          {/* Rewind 10s (allowed backward only for study review) */}
          <button
            onClick={rewind10}
            className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl border border-slate-700 text-xs flex items-center gap-1 cursor-pointer transition-colors"
            title="Retroceder 10 segundos para repasar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">-10s</span>
          </button>

          {/* Mute Toggle */}
          <button
            onClick={toggleMute}
            className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl border border-slate-700 text-xs flex items-center cursor-pointer transition-colors"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>
        </div>

        {/* Live Timestamp & Anti-Skip Flag */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
          <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
            <span className="text-emerald-400 font-black">{formatTime(currentTime)}</span>
            <span className="text-slate-600"> / </span>
            <span className="text-slate-400">
              {duration > 0 ? formatTime(duration) : 'Cargando duración...'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/15 px-3 py-1.5 rounded-xl border border-amber-500/30">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Adelanto deshabilitado</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & 5% Step Trackers */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Progreso Auditado en Intervalos del 5%
          </span>
          <span className="font-mono text-emerald-400 font-bold">{currentPercent}% de 100%</span>
        </div>

        {/* Outer Bar */}
        <div className="w-full bg-slate-800 rounded-full h-3.5 p-0.5 border border-slate-700/80 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500 shadow-md shadow-emerald-500/40"
            style={{ width: `${currentPercent}%` }}
          />
        </div>

        {/* 5% Step Grid Checklist */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-2">
          {Array.from({ length: 20 }, (_, i) => (i + 1) * 5).map((step) => {
            const isReached = currentPercent >= step;
            return (
              <div
                key={step}
                className={`py-1 rounded-lg text-center text-[10px] font-mono font-bold border transition-all ${
                  isReached
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800/40 text-slate-500 border-slate-750'
                }`}
                title={`Checkpoint de verificación: ${step}%`}
              >
                {step}%
              </div>
            );
          })}
        </div>
      </div>

      {/* Exam Readiness Card */}
      {isFullyCompleted ? (
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-teal-950/70 border-2 border-emerald-500/60 flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-300 uppercase tracking-tight">
                ¡Visualización del Video y Formulario QR Concluidos!
              </h4>
              <p className="text-xs text-slate-300">
                Has alcanzado el 100% de la capacitación obligatoria. El examen oficial de 10 preguntas está habilitado.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenExam}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wide shadow-lg shadow-emerald-950/40 transition-all cursor-pointer animate-pulse"
          >
            {user.examenAprobado ? 'Ver Resultado Examen (Aprobado)' : 'Rendir Examen SST Ahora (Mín. 8 Aciertos) →'}
          </button>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            El examen se habilitará tras culminar la visualización del video y el minuto del formulario QR.
          </span>
          <span className="text-[11px] font-mono text-slate-400 font-bold">
            Falta: {100 - currentPercent}%
          </span>
        </div>
      )}
    </div>
  );
};

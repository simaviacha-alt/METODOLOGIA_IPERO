import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { WelcomeBanner } from './components/WelcomeBanner.tsx';
import { VideoPlayer } from './components/VideoPlayer.tsx';
import { ProceduralChatBot } from './components/ProceduralChatBot.tsx';
import { RegistrationModal } from './components/RegistrationModal.tsx';
import { ExamModal } from './components/ExamModal.tsx';
import { CertificateModal } from './components/CertificateModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { AdminPasswordModal } from './components/AdminPasswordModal.tsx';
import { UserProfile } from './types.ts';
import { ShieldCheck, Award, Lock, Sparkles } from 'lucide-react';

const LOCAL_STORAGE_USER_KEY = 'ipero_active_user_carnet';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isAdminPasswordOpen, setIsAdminPasswordOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [selectedCertificateUser, setSelectedCertificateUser] = useState<UserProfile | null>(null);

  // Platform Config - Official Link requested: https://youtu.be/zbTIMX2Gbu8
  const [config, setConfig] = useState({
    youtubeVideoId: 'zbTIMX2Gbu8',
    youtubeVideoUrl: 'https://youtu.be/zbTIMX2Gbu8',
    googleDriveFolderUrl: 'https://drive.google.com/drive/folders/1rf24lhjQIGYTCyCbpH6cqopyLciECf7k?hl=es',
  });

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {
      console.warn('Could not fetch config:', e);
    }
  }, []);

  // Restore user from carnet in localStorage on initial mount
  useEffect(() => {
    fetchConfig();

    const savedCarnet = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (savedCarnet) {
      fetch(`/api/user/${savedCarnet}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.user) {
            setCurrentUser(data.user);
          } else {
            setIsRegistrationOpen(true);
          }
        })
        .catch(() => {
          setIsRegistrationOpen(true);
        });
    } else {
      setIsRegistrationOpen(true);
    }
  }, [fetchConfig]);

  // Lookup Carnet function for registration/login
  const handleLookupCarnet = async (carnet: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`/api/user/${carnet}`);
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    } catch (e) {}
    return null;
  };

  // On successful registration or re-login
  const handleRegistrationSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, user.carnet);
    setIsRegistrationOpen(false);
  };

  // Video progress update (recorded every 5%)
  const handleProgressUpdate = async (percentage: number) => {
    if (!currentUser) return;

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carnet: currentUser.carnet,
          progreso: percentage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                videoProgreso: data.videoProgreso,
                videoCompletado: data.videoCompletado,
                ultimoVideoUpdate: data.ultimoVideoUpdate,
              }
            : null
        );
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const handleCompleteAll = () => {
    if (!currentUser) return;
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            videoProgreso: 100,
            videoCompletado: true,
          }
        : null
    );
  };

  const handleExamCompleted = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    if (updatedUser.examenAprobado) {
      setSelectedCertificateUser(updatedUser);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    setCurrentUser(null);
    setIsRegistrationOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Header with corporate branding and password-protected admin button */}
      <Header
        user={currentUser}
        onOpenAdmin={() => setIsAdminPasswordOpen(true)}
        onLogout={handleLogout}
        onOpenCertificate={() => {
          if (currentUser?.examenAprobado) {
            setSelectedCertificateUser(currentUser);
            setIsCertificateOpen(true);
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentUser ? (
          <>
            {/* 2. Welcome Banner with exact required text */}
            <WelcomeBanner
              user={currentUser}
              onOpenExam={() => setIsExamOpen(true)}
            />

            {/* 3. YouTube Video Player with single play button, no-skip, and 1-min overlaid QR poster */}
            <VideoPlayer
              user={currentUser}
              videoId={config.youtubeVideoId}
              formUrl={config.googleDriveFolderUrl}
              onProgressUpdate={handleProgressUpdate}
              onCompleteAll={handleCompleteAll}
              onOpenExam={() => setIsExamOpen(true)}
            />

            {/* 4. Procedural ChatBot directly below video (instant response) */}
            <ProceduralChatBot />

            {/* 5. Exam Readiness / Certification Ribbon */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                    Evaluación Final de Conocimientos SST (10 Preguntas al Azar)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aprobación obligatoria con <strong className="text-amber-400">mínimo 8 aciertos (80%)</strong>. En caso de reprobar se debe esperar 1 día (24 horas) para reintentar.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {currentUser.examenAprobado ? (
                  <button
                    onClick={() => {
                      setSelectedCertificateUser(currentUser);
                      setIsCertificateOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    ¡Felicidades! Ver Certificado Oficial (Aprobado)
                  </button>
                ) : currentUser.videoProgreso >= 100 || currentUser.videoCompletado ? (
                  <button
                    onClick={() => setIsExamOpen(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer animate-pulse"
                  >
                    <Award className="w-4 h-4 text-slate-950" />
                    Rendir Examen Oficial (Mín. 8 Aciertos)
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs border border-slate-700">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Examen bloqueado hasta completar video y formulario QR ({currentUser.videoProgreso}%)</span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Empty placeholder while login modal opens */
          <div className="text-center py-24 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-200">
              Inicia sesión con tu Carnet o regístrate para acceder a la capacitación IPERO SST
            </h2>
            <button
              onClick={() => setIsRegistrationOpen(true)}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-950/50"
            >
              Abrir Formulario de Ingreso
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 space-y-1">
        <p>
          SOBOCE S.A. • Sistema de Gestión de Seguridad y Salud en el Trabajo (ISO 45001 / NTS 009/23)
        </p>
        <p className="text-[11px] text-slate-600 font-mono">
          Procedimiento Oficial SPT-GSS.SI.011 (Revisión 11) • Video https://youtu.be/zbTIMX2Gbu8 • Mínimo 8 Aciertos
        </p>
      </footer>

      {/* Modals */}
      <RegistrationModal
        isOpen={isRegistrationOpen}
        onSuccess={handleRegistrationSuccess}
        onLookupCarnet={handleLookupCarnet}
      />

      {/* Admin Password Gatekeeper (CVCM2026!) */}
      <AdminPasswordModal
        isOpen={isAdminPasswordOpen}
        onClose={() => setIsAdminPasswordOpen(false)}
        onAuthorized={() => {
          setIsAdminPasswordOpen(false);
          setIsAdminOpen(true);
        }}
      />

      {currentUser && (
        <ExamModal
          isOpen={isExamOpen}
          onClose={() => setIsExamOpen(false)}
          user={currentUser}
          onExamCompleted={handleExamCompleted}
          onViewCertificate={() => {
            setIsExamOpen(false);
            setSelectedCertificateUser(currentUser);
            setIsCertificateOpen(true);
          }}
        />
      )}

      {selectedCertificateUser && (
        <CertificateModal
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
          user={selectedCertificateUser}
        />
      )}

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        googleDriveUrl={config.googleDriveFolderUrl}
        onSelectUserCertificate={(u) => {
          setSelectedCertificateUser(u);
          setIsCertificateOpen(true);
        }}
        onConfigUpdated={fetchConfig}
      />
    </div>
  );
}

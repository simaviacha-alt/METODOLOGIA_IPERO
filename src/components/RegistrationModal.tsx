import React, { useState, useEffect } from 'react';
import { CreditCard, User, Building2, Briefcase, ArrowRight, ShieldCheck, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { UserProfile } from '../types.ts';

interface RegistrationModalProps {
  isOpen: boolean;
  onSuccess: (user: UserProfile) => void;
  onLookupCarnet: (carnet: string) => Promise<UserProfile | null>;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onSuccess,
  onLookupCarnet,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginCarnet, setLoginCarnet] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [detectedLoginUser, setDetectedLoginUser] = useState<UserProfile | null>(null);

  // New registration form state
  const [regCarnet, setRegCarnet] = useState('');
  const [regNombre, setRegNombre] = useState('');
  const [regEmpresa, setRegEmpresa] = useState('SOBOCE S.A.');
  const [regCargo, setRegCargo] = useState('');
  const [isCustomCompany, setIsCustomCompany] = useState(false);
  const [customCompany, setCustomCompany] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [detectedRegUser, setDetectedRegUser] = useState<UserProfile | null>(null);

  // Real-time lookup for Login Carnet
  useEffect(() => {
    const clean = loginCarnet.trim().toUpperCase();
    if (clean.length >= 4) {
      const timer = setTimeout(async () => {
        const u = await onLookupCarnet(clean);
        setDetectedLoginUser(u);
        if (u) setLoginError(null);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDetectedLoginUser(null);
    }
  }, [loginCarnet, onLookupCarnet]);

  // Real-time lookup for Register Carnet
  useEffect(() => {
    const clean = regCarnet.trim().toUpperCase();
    if (clean.length >= 4) {
      const timer = setTimeout(async () => {
        const u = await onLookupCarnet(clean);
        setDetectedRegUser(u);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDetectedRegUser(null);
    }
  }, [regCarnet, onLookupCarnet]);

  if (!isOpen) return null;

  // 1. Handle Login with Carnet (Key to Re-enter)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = loginCarnet.trim().toUpperCase();
    if (clean.length < 4) {
      setLoginError('Por favor ingrese un número de Carnet válido (mínimo 4 caracteres).');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carnet: clean }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Carnet no encontrado.');
      }

      onSuccess(data.user);
    } catch (err: any) {
      setLoginError(err.message || 'Error al verificar carnet.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. Handle New Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCarnet = regCarnet.trim().toUpperCase();
    const cleanNombre = regNombre.trim().toUpperCase();
    const cleanCompany = (isCustomCompany ? customCompany : regEmpresa).trim().toUpperCase();
    const cleanCargo = regCargo.trim().toUpperCase();

    if (cleanCarnet.length < 4) {
      setRegError('El Carnet debe tener al menos 4 caracteres.');
      return;
    }
    if (cleanNombre.length < 3) {
      setRegError('Ingrese su nombre y apellido completo.');
      return;
    }
    if (cleanCompany.length < 2) {
      setRegError('Indique la empresa o contratista.');
      return;
    }
    if (cleanCargo.length < 2) {
      setRegError('Indique su cargo o puesto laboral.');
      return;
    }

    setIsRegistering(true);
    setRegError(null);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carnet: cleanCarnet,
          nombre: cleanNombre,
          empresa: cleanCompany,
          cargo: cleanCargo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar.');
      }

      onSuccess(data.user);
    } catch (err: any) {
      setRegError(err.message || 'Error de conexión.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white text-center relative">
          <div className="w-12 h-12 mx-auto mb-2 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight">
            Acceso a Capacitación IPERO SST
          </h2>
          <p className="text-xs text-emerald-100 font-medium">
            SOBOCE S.A. • Procedimiento SPT-GSS.SI.011 (Rev. 11)
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setLoginError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Ingresar con Carnet (CI)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Registro</span>
          </button>
        </div>

        {/* TAB 1: LOGIN WITH CARNET */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Tu <strong>Número de Carnet de Identidad</strong> es tu llave para retomar el avance del video exactamente donde te quedaste o consultar tu examen y certificado.
            </p>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mb-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                Número de Carnet de Identidad (CI):
              </label>
              <input
                type="text"
                value={loginCarnet}
                onChange={(e) => setLoginCarnet(e.target.value.toUpperCase())}
                placeholder="INGRESA TU NÚMERO DE CARNET..."
                className="w-full bg-slate-800/90 text-white text-base font-mono uppercase px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                autoFocus
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                Se convierte automáticamente a mayúsculas.
              </span>
            </div>

            {detectedLoginUser && (
              <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>¡Carnet Reconocido en el Sistema!</span>
                </div>
                <p className="text-white font-medium">
                  {detectedLoginUser.nombre} ({detectedLoginUser.empresa})
                </p>
                <p className="text-[11px] text-emerald-200">
                  Progreso registrado: <strong className="text-amber-300 font-bold">{detectedLoginUser.videoProgreso}%</strong> • Cargo: {detectedLoginUser.cargo}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || !loginCarnet.trim()}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40"
            >
              {isLoggingIn ? (
                <span>Buscando datos de avance...</span>
              ) : (
                <>
                  <span>Ingresar y Retomar Avance</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setRegCarnet(loginCarnet);
                  setActiveTab('register');
                }}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                ¿Es tu primera vez en la capacitación? Regístrate aquí →
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: NUEVO REGISTRO */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
            <p className="text-xs text-slate-300">
              Completa tus datos para crear tu perfil oficial de capacitación SST (todos los campos se registrarán en mayúsculas):
            </p>

            {regError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{regError}</span>
              </div>
            )}

            {/* Carnet */}
            <div>
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                Número de Carnet (CI) - Llave de reingreso:
              </label>
              <input
                type="text"
                value={regCarnet}
                onChange={(e) => setRegCarnet(e.target.value.toUpperCase())}
                placeholder="EJ. 10234567 O LP-847291"
                className="w-full bg-slate-800/90 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 font-mono uppercase"
                required
              />
            </div>

            {detectedRegUser && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Este Carnet ya se encuentra registrado</span>
                </div>
                <p className="text-white text-xs">
                  Pertenece a <strong className="text-emerald-400">{detectedRegUser.nombre}</strong> con un avance registrado del <strong className="text-amber-300">{detectedRegUser.videoProgreso}%</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => onSuccess(detectedRegUser)}
                  className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-lg cursor-pointer text-xs uppercase tracking-wider"
                >
                  Ingresar directamente con esta cuenta →
                </button>
              </div>
            )}

            {/* Nombre Completo */}
            <div>
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-teal-400" />
                Nombre Completo y Apellidos:
              </label>
              <input
                type="text"
                value={regNombre}
                onChange={(e) => setRegNombre(e.target.value.toUpperCase())}
                placeholder="EJ. JUAN CARLOS MAMANI FLORES"
                className="w-full bg-slate-800/90 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500 uppercase"
                required
              />
            </div>

            {/* Empresa */}
            <div>
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Empresa / Contratista:
              </label>
              {!isCustomCompany ? (
                <select
                  value={regEmpresa}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomCompany(true);
                      setCustomCompany('');
                    } else {
                      setRegEmpresa(e.target.value.toUpperCase());
                    }
                  }}
                  className="w-full bg-slate-800/90 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none uppercase"
                >
                  <option value="SOBOCE S.A.">SOBOCE S.A. (PERSONAL PROPIO)</option>
                  <option value="CONTRATISTA DE MANTENIMIENTO">CONTRATISTA DE MANTENIMIENTO MECÁNICO / ELÉCTRICO</option>
                  <option value="TRANSPORTES Y LOGÍSTICA">TRANSPORTES Y LOGÍSTICA DE CEMENTO</option>
                  <option value="SERVICIOS INDUSTRIALES">SERVICIOS INDUSTRIALES Y LIMPIEZA</option>
                  <option value="__custom__">+ OTRA EMPRESA / ESCRIBIR MANUALMENTE...</option>
                </select>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value.toUpperCase())}
                    placeholder="NOMBRE DE LA EMPRESA O CONTRATISTA..."
                    className="w-full bg-slate-800/90 text-white text-xs px-3.5 py-2.5 rounded-xl border border-cyan-500 uppercase"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCompany(false)}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    ← Seleccionar de la lista
                  </button>
                </div>
              )}
            </div>

            {/* Cargo */}
            <div>
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                Cargo / Puesto de Trabajo:
              </label>
              <input
                type="text"
                value={regCargo}
                onChange={(e) => setRegCargo(e.target.value.toUpperCase())}
                placeholder="EJ. OPERADOR DE PLANTA, SUPERVISOR, MECÁNICO..."
                className="w-full bg-slate-800/90 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 uppercase"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-all disabled:opacity-40"
            >
              {isRegistering ? 'Guardando registro...' : 'Registrar e Ingresar a Capacitación'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

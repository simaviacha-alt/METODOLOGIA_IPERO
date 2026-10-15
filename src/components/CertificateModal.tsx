import React from 'react';
import { ShieldCheck, Award, Printer, CheckCircle2, Download, X } from 'lucide-react';
import { UserProfile } from '../types.ts';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Actions Bar */}
        <div className="bg-slate-850 p-4 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Certificado Oficial de Acreditación SST
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Guardar PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Canvas */}
        <div
          id="certificate-printable"
          className="p-8 sm:p-12 bg-white text-slate-900 relative m-4 sm:m-6 rounded-2xl border-8 border-double border-emerald-800 shadow-xl overflow-hidden"
        >
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <ShieldCheck className="w-96 h-96 text-emerald-900" />
          </div>

          {/* Header */}
          <div className="text-center relative z-10 border-b-2 border-emerald-800 pb-5 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center text-white font-black text-xl shadow-md">
                S
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-black tracking-tight text-emerald-900 leading-none">
                  SOBOCE S.A.
                </h1>
                <p className="text-[11px] font-bold text-slate-600 tracking-wider uppercase mt-0.5">
                  Gerencia Nacional de Sostenibilidad y Proyectos • Seguridad Industrial
                </p>
              </div>
            </div>
            <p className="text-xs font-mono font-semibold text-slate-500">
              SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO (ISO 45001 / NTS 009)
            </p>
          </div>

          {/* Certificate Body */}
          <div className="text-center relative z-10 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-4 py-1 rounded-full border border-emerald-200">
              CERTIFICADO DE APROBACIÓN
            </span>

            <p className="text-xs text-slate-600 uppercase font-medium">
              Se certifica formalmente que:
            </p>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight text-emerald-950 underline decoration-emerald-600 decoration-2 underline-offset-4">
              {user.nombre}
            </h2>

            <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-700 font-mono py-1">
              <span><strong>C.I.:</strong> {user.carnet}</span>
              <span>•</span>
              <span><strong>Empresa:</strong> {user.empresa}</span>
              <span>•</span>
              <span><strong>Cargo:</strong> {user.cargo}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed pt-2">
              Ha completado satisfactoriamente el programa de entrenamiento y aprobado con éxito la evaluación reglamentaria en:
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-xl mx-auto">
              <h3 className="text-sm font-black text-emerald-900 uppercase leading-snug">
                IDENTIFICACIÓN DE PELIGROS, EVALUACIÓN, CONTROL DE RIESGOS OCUPACIONALES Y OPORTUNIDADES SST (IPERO)
              </h3>
              <p className="text-[11px] font-mono text-slate-600 mt-1">
                Procedimiento SPT-GSS.SI.011 (Revisión 11)
              </p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 pt-3 text-xs text-slate-700">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-left">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Calificación Obtenida</span>
                <span className="text-lg font-black font-mono text-emerald-800">{user.examenNota}%</span>
                <span className="text-[10px] text-slate-500 block">(Mínimo requerido: 80%)</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-left">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Fecha de Emisión</span>
                <span className="text-xs font-mono font-bold text-slate-800">{user.examenFecha || user.fechaRegistro}</span>
                <span className="text-[10px] text-slate-500 block">Vigencia Trienal</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-left">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Código de Acreditación</span>
                <span className="text-xs font-mono font-bold text-slate-800">{user.certificadoId || 'CERT-IPERO-2026-001'}</span>
                <span className="text-[10px] text-emerald-700 block font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verificado Oficial
                </span>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs text-slate-600 border-t border-slate-200 mt-6">
              <div>
                <div className="w-40 mx-auto border-b border-slate-400 mb-1" />
                <p className="font-bold text-slate-800">Jefatura Nacional de Seguridad Industrial</p>
                <p className="text-[10px] text-slate-500">SOBOCE S.A.</p>
              </div>
              <div>
                <div className="w-40 mx-auto border-b border-slate-400 mb-1" />
                <p className="font-bold text-slate-800">Responsable de Seguridad Industrial (SIMA)</p>
                <p className="text-[10px] text-slate-500">Unidad de Negocio / Planta</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

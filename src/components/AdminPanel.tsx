import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Upload,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Award,
  Video,
  Settings,
  ShieldCheck,
  X,
  Send,
  Zap,
  Info,
  LogOut,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types.ts';
import { googleSignIn, getAccessToken, getCurrentUser, logoutGoogle, initAuth } from '../services/googleAuth.ts';
import { syncRowsToGoogleSheet, DEFAULT_SPREADSHEET_ID, DEFAULT_SPREADSHEET_URL } from '../services/googleSheetsService.ts';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  googleDriveUrl: string;
  onSelectUserCertificate: (user: UserProfile) => void;
  onConfigUpdated: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  googleDriveUrl,
  onSelectUserCertificate,
  onConfigUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'sheet_live' | 'visualizacion' | 'aprobados' | 'sheets_sync' | 'config'>('sheet_live');
  const [reportsData, setReportsData] = useState<any>(null);
  const [sheetData, setSheetData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('ALL');
  const [copiedHeaders, setCopiedHeaders] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedAllRows, setCopiedAllRows] = useState(false);

  // Webhook Sync states
  const [webhookInput, setWebhookInput] = useState('');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [webhookTestStatus, setWebhookTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncAllMessage, setSyncAllMessage] = useState<string | null>(null);

  // Bulk import state
  const [importText, setImportText] = useState('');
  const [importValidationResult, setImportValidationResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Config video URL state
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [saveConfigSuccess, setSaveConfigSuccess] = useState(false);

  // Google Sheets Direct OAuth Sync states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isGoogleSyncing, setIsGoogleSyncing] = useState(false);
  const [googleSyncStatus, setGoogleSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showSyncConfirmationModal, setShowSyncConfirmationModal] = useState(false);

  useEffect(() => {
    const unsub = initAuth(
      (user) => setGoogleUser(user),
      () => setGoogleUser(null)
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [resReports, resSheet] = await Promise.all([
        fetch('/api/admin/reports'),
        fetch('/api/admin/sheet-data')
      ]);

      if (resReports.ok) {
        const dataReports = await resReports.json();
        setReportsData(dataReports);
        if (dataReports.sheetsWebhookUrl && !webhookInput) {
          setWebhookInput(dataReports.sheetsWebhookUrl);
        }
      }

      if (resSheet.ok) {
        const dataSheet = await resSheet.json();
        setSheetData(dataSheet);
        if (dataSheet.sheetsWebhookUrl && !webhookInput) {
          setWebhookInput(dataSheet.sheetsWebhookUrl);
        }
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const AUTOMATIC_HEADERS = [
    'N° Carnet (CI)',
    'Nombre Completo',
    'Empresa',
    'Cargo',
    'Fecha de Registro',
    'Hora de Registro',
    'Progreso Video (%)',
    'Estado Video',
    'Última Visualización',
    'Nota Examen (%)',
    'Estado Examen',
    'Fecha Aprobación',
    'N° Certificado'
  ];

  const handleCopyHeaders = () => {
    navigator.clipboard.writeText(AUTOMATIC_HEADERS.join('\t'));
    setCopiedHeaders(true);
    setTimeout(() => setCopiedHeaders(false), 2000);
  };

  // Copy entire sheet content formatted with tabs for direct Ctrl+V into Google Sheets
  const handleCopyAllRows = async () => {
    try {
      const res = await fetch('/api/admin/export-tsv');
      if (res.ok) {
        const text = await res.text();
        await navigator.clipboard.writeText(text);
        setCopiedAllRows(true);
        setTimeout(() => setCopiedAllRows(false), 2500);
      }
    } catch (e) {
      // fallback to sheetData
      if (sheetData?.rows) {
        const tsv = [
          AUTOMATIC_HEADERS.join('\t'),
          ...sheetData.rows.map((r: any[]) => r.join('\t'))
        ].join('\n');
        navigator.clipboard.writeText(tsv);
        setCopiedAllRows(true);
        setTimeout(() => setCopiedAllRows(false), 2500);
      }
    }
  };

  // Google Apps Script snippet that updates in place by Carnet or appends if new
  const googleAppsScriptCode = `
// =========================================================================
// GOOGLE APPS SCRIPT PARA SINCRONIZACIÓN AUTOMÁTICA EN TU HOJA GOOGLE SHEET
// =========================================================================
// 1. Abre tu hoja de cálculo en Google Drive.
// 2. Ve a: Extensiones > Apps Script.
// 3. Borra el código existente y pega este bloque completo.
// 4. Haz clic en "Implementar" > "Nueva implementación".
// 5. Tipo: "Aplicación web".
// 6. Ejecutar como: "Yo".
// 7. Quién tiene acceso: "Cualquier persona" (Anyone).
// 8. Copia la URL generada y pégala en el Panel Admin de la plataforma.
// =========================================================================

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Si la hoja está vacía, genera automáticamente los 13 encabezados oficiales
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "N° Carnet (CI)", "Nombre Completo", "Empresa", "Cargo",
        "Fecha de Registro", "Hora de Registro", "Progreso Video (%)",
        "Estado Video", "Última Visualización", "Nota Examen (%)",
        "Estado Examen", "Fecha Aprobación", "N° Certificado"
      ]);
      sheet.getRange(1, 1, 1, 13)
        .setFontWeight("bold")
        .setBackground("#065f46")
        .setFontColor("#ffffff");
    }
    
    // Buscar si el Carnet (CI) ya existe para actualizar su fila en tiempo real
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    var rowIndex = -1;
    var carnetBuscado = String(data.carnet || "").trim().toUpperCase();

    for (var i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim().toUpperCase() === carnetBuscado) {
        rowIndex = i + 1; // 1-indexed
        break;
      }
    }
    
    var rowData = [
      carnetBuscado,
      String(data.nombre || "").toUpperCase(),
      String(data.empresa || "").toUpperCase(),
      String(data.cargo || "").toUpperCase(),
      data.fechaRegistro,
      data.horaRegistro,
      (data.videoProgreso !== undefined ? data.videoProgreso : 0) + "%",
      data.videoCompletado ? "Completado (100%)" : "En Progreso",
      data.ultimoVideoUpdate || new Date().toLocaleString(),
      (data.examenNota !== undefined ? data.examenNota : 0) + "%",
      data.examenAprobado ? "APROBADO" : (data.examenRendido ? "REPROBADO" : "PENDIENTE"),
      data.examenFecha || "-",
      data.certificadoId || "-"
    ];
    
    if (rowIndex > 0) {
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "OK", 
      updated: rowIndex > 0, 
      carnet: carnetBuscado 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "ERROR", 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`.trim();

  const handleCopyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Test and Save Webhook
  const handleSaveAndTestWebhook = async () => {
    if (!webhookInput.trim()) {
      alert('Por favor ingrese la URL de la aplicación web de Google Apps Script.');
      return;
    }

    setIsSavingWebhook(true);
    setWebhookTestStatus(null);

    try {
      // 1. Save in config
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetsWebhookUrl: webhookInput.trim() })
      });

      // 2. Test webhook
      const testRes = await fetch('/api/admin/test-sheet-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookInput.trim() })
      });

      const testData = await testRes.json();
      if (testRes.ok && testData.success) {
        setWebhookTestStatus({
          success: true,
          message: '¡Conexión verificada con éxito! Tu Google Sheet ya está conectado y recibiendo datos automáticamente.'
        });
        fetchAllData();
        onConfigUpdated();
      } else {
        setWebhookTestStatus({
          success: false,
          message: testData.error || 'La URL no respondió correctamente. Verifica que hayas implementado la Aplicación Web con acceso "Cualquier persona".'
        });
      }
    } catch (e: any) {
      setWebhookTestStatus({
        success: false,
        message: `Error de conexión: ${e.message}`
      });
    } finally {
      setIsSavingWebhook(false);
    }
  };

  // Force sync all records to Google Sheet
  const handleSyncAllToGoogleSheet = async () => {
    setIsSyncingAll(true);
    setSyncAllMessage(null);
    try {
      const res = await fetch('/api/admin/sync-all-to-sheet', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncAllMessage(`✅ ¡Sincronización completada! Se actualizaron ${data.synced} filas en tu Google Sheet.`);
        fetchAllData();
      } else {
        setSyncAllMessage(`⚠️ ${data.error || 'No se pudo sincronizar con Google Sheet.'}`);
      }
    } catch (e: any) {
      setSyncAllMessage(`⚠️ Error al sincronizar: ${e.message}`);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Direct Google Sheets API OAuth Handlers
  const handleGoogleSignInClick = async () => {
    setGoogleSyncStatus(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleSyncStatus({
          success: true,
          message: `¡Cuenta ${res.user.displayName || res.user.email} conectada con éxito a Google Sheets! Ahora puedes sincronizar tus registros.`,
        });
      }
    } catch (err: any) {
      setGoogleSyncStatus({
        success: false,
        message: `Error al iniciar sesión con Google: ${err.message}`,
      });
    }
  };

  const handleGoogleLogoutClick = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleSyncStatus({
      success: true,
      message: 'Sesión de Google cerrada.',
    });
  };

  const handleRequestSyncToGoogleSheet = async () => {
    let token = getAccessToken();
    if (!token) {
      try {
        const res = await googleSignIn();
        if (!res) return;
        token = res.accessToken;
        setGoogleUser(res.user);
      } catch (err: any) {
        setGoogleSyncStatus({
          success: false,
          message: `Error al conectar con Google: ${err.message}`,
        });
        return;
      }
    }
    setShowSyncConfirmationModal(true);
  };

  const handleConfirmSyncToGoogleSheet = async () => {
    setShowSyncConfirmationModal(false);
    setIsGoogleSyncing(true);
    setGoogleSyncStatus(null);

    try {
      let token = getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        token = res?.accessToken || null;
      }

      if (!token) {
        throw new Error('No se pudo obtener el token de autorización de Google.');
      }

      const spreadsheetId = sheetData?.googleSpreadsheetId || DEFAULT_SPREADSHEET_ID;

      // 1. Direct browser sync to Google Sheets API
      const result = await syncRowsToGoogleSheet(spreadsheetId, token, rawSheetRows);

      // 2. Update server tracking
      await fetch('/api/admin/sync-google-sheet-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          spreadsheetId,
          accessToken: token,
        }),
      });

      setGoogleSyncStatus({
        success: true,
        message: `✅ ¡Excelente! Se sincronizaron exitosamente ${result.updatedRows} registros en tu hoja oficial de Google Sheets ("${result.spreadsheetTitle}").`,
      });
      fetchAllData();
    } catch (err: any) {
      console.error('Error syncing to Google Sheet:', err);
      setGoogleSyncStatus({
        success: false,
        message: `Error al sincronizar con Google Sheets: ${err.message}`,
      });
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  // Bulk import
  const handleValidateImportText = (text: string) => {
    setImportText(text);
    if (!text.trim()) {
      setImportValidationResult(null);
      return;
    }

    const lines = text.trim().split('\n');
    const validRows: any[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/[,\t;]/).map((p) => p.replace(/^"|"$/g, '').trim());
      if (parts.length < 2) return;

      if (parts[0].toLowerCase().includes('carnet') || parts[0].toLowerCase().includes('ci')) {
        return;
      }

      const carnet = parts[0].toUpperCase();
      const nombre = (parts[1] || '').toUpperCase();
      const empresa = (parts[2] || 'SOBOCE S.A.').toUpperCase();
      const cargo = (parts[3] || 'TRABAJADOR').toUpperCase();
      const progreso = Number(parts[4] || 0);

      const rowErrors: string[] = [];
      if (carnet.length < 4) rowErrors.push(`Fila ${index + 1}: Carnet inválido (${carnet})`);
      if (nombre.length < 2) rowErrors.push(`Fila ${index + 1}: Nombre muy corto`);

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validRows.push({
          carnet,
          nombre,
          empresa,
          cargo,
          videoProgreso: Math.min(100, Math.max(0, isNaN(progreso) ? 0 : progreso)),
        });
      }
    });

    setImportValidationResult({
      totalParsed: validRows.length,
      validRows,
      errors,
    });
  };

  const handleExecuteImport = async () => {
    if (!importValidationResult || importValidationResult.validRows.length === 0) return;
    setIsImporting(true);

    try {
      const res = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: importValidationResult.validRows }),
      });
      const data = await res.json();
      alert(data.message || 'Importación completada.');
      setImportText('');
      setImportValidationResult(null);
      fetchAllData();
      setActiveTab('sheet_live');
    } catch (e) {
      alert('Error al sincronizar datos.');
    } finally {
      setIsImporting(false);
    }
  };

  // Video Config
  const handleSaveVideoConfig = async () => {
    if (!youtubeUrlInput.trim()) return;

    let videoId = youtubeUrlInput.trim();
    if (videoId.includes('v=')) {
      videoId = videoId.split('v=')[1]?.split('&')[0];
    } else if (videoId.includes('youtu.be/')) {
      videoId = videoId.split('youtu.be/')[1]?.split('?')[0];
    }

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeVideoUrl: youtubeUrlInput.trim(),
          youtubeVideoId: videoId,
        }),
      });
      if (res.ok) {
        setSaveConfigSuccess(true);
        onConfigUpdated();
        setTimeout(() => setSaveConfigSuccess(false), 2500);
      }
    } catch (e) {
      alert('Error al guardar configuración');
    }
  };

  // Data arrays
  const visualizacionList: any[] = reportsData?.listaVisualizacion || [];
  const aprobadosList: any[] = reportsData?.listaAprobados || [];
  const rawSheetRows: any[][] =
    sheetData?.rows && sheetData.rows.length > 0
      ? sheetData.rows
      : visualizacionList.map((u) => {
          const ap = aprobadosList.find((a) => a.carnet === u.carnet);
          return [
            u.carnet,
            u.nombre,
            u.empresa,
            u.cargo,
            u.fechaRegistro,
            u.horaRegistro,
            u.videoProgreso,
            u.estado,
            u.ultimoVideoUpdate,
            ap ? `${ap.examenNota}%` : 'No rendido',
            ap ? 'APROBADO' : 'PENDIENTE',
            ap ? ap.examenFecha : '-',
            ap ? ap.certificadoId : '-',
          ];
        });

  // Filtered live sheet rows
  const filteredSheetRows = rawSheetRows.filter((row) => {
    const carnet = String(row[0] || '').toLowerCase();
    const nombre = String(row[1] || '').toLowerCase();
    const empresa = String(row[2] || '');
    const cargo = String(row[3] || '').toLowerCase();

    const matchesQuery =
      carnet.includes(searchQuery.toLowerCase()) ||
      nombre.includes(searchQuery.toLowerCase()) ||
      cargo.includes(searchQuery.toLowerCase());

    const matchesEmpresa = filterEmpresa === 'ALL' || empresa === filterEmpresa;
    return matchesQuery && matchesEmpresa;
  });

  const filteredVisualizacion = visualizacionList.filter((item) => {
    const matchQuery =
      item.carnet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cargo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchEmpresa = filterEmpresa === 'ALL' || item.empresa === filterEmpresa;
    return matchQuery && matchEmpresa;
  });

  const filteredAprobados = aprobadosList.filter((item) => {
    const matchQuery =
      item.carnet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cargo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchEmpresa = filterEmpresa === 'ALL' || item.empresa === filterEmpresa;
    return matchQuery && matchEmpresa;
  });

  const uniqueEmpresas = Array.from(
    new Set([
      ...visualizacionList.map((i) => i.empresa),
      ...rawSheetRows.map((r) => String(r[2]))
    ])
  ).filter(Boolean);

  const isWebhookActive = Boolean(reportsData?.sheetsWebhookUrl && reportsData.sheetsWebhookUrl.startsWith('http'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-7xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                  INFORME ADMIN • HOJA DE CÁLCULO IPERO SST
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SOBOCE S.A.
                </span>
                {isWebhookActive ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Sincronización en Vivo con Google Sheet
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Datos Guardados en Servidor (Configura Webhook para Nube)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Registro de hora, fecha, participante, porcentaje de avance (de 5% en 5%) y aprobados de evaluación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Google Drive Folder Link */}
            <a
              href={googleDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
              title="Abrir Carpeta Google Drive Oficial"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir en Google Drive</span>
            </a>

            {/* Direct Excel/CSV download */}
            <a
              href="/api/admin/export-csv"
              download="registro_capacitacion_ipero_sst.csv"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all"
              title="Descargar archivo compatible con Excel y Google Sheets"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar Excel (.csv)</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/50 border-b border-slate-800 text-xs">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] block font-medium">Total Registrados</span>
              <div className="text-xl font-black text-white font-mono mt-0.5">
                {reportsData?.totalRegistrados ?? rawSheetRows.length}
              </div>
            </div>
            <Users className="w-6 h-6 text-slate-500" />
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] block font-medium">Visualizando Video</span>
              <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                {reportsData?.totalVisualizando ?? 0}
              </div>
            </div>
            <Video className="w-6 h-6 text-amber-500/60" />
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] block font-medium">Concluyeron Video (100%)</span>
              <div className="text-xl font-black text-cyan-400 font-mono mt-0.5">
                {reportsData?.totalCompletaronVideo ?? 0}
              </div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-cyan-500/60" />
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] block font-medium">Aprobados Examen (≥80%)</span>
              <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                {reportsData?.totalAprobados ?? 0}
              </div>
            </div>
            <Award className="w-6 h-6 text-emerald-500/60" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800 flex flex-wrap gap-2 bg-slate-950/20">
          <button
            onClick={() => setActiveTab('sheet_live')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sheet_live'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            📊 Hoja de Cálculo Google Sheet (En Vivo)
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-md text-[10px]">
              {rawSheetRows.length} filas
            </span>
          </button>

          <button
            onClick={() => setActiveTab('visualizacion')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'visualizacion'
                ? 'bg-slate-800 text-amber-400 border-t-2 border-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4 text-amber-400" />
            1. Lista de Visualización (% de avance)
            <span className="px-1.5 py-0.2 bg-slate-700 rounded-md text-[10px] text-white">
              {visualizacionList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('aprobados')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'aprobados'
                ? 'bg-slate-800 text-cyan-400 border-t-2 border-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 text-cyan-400" />
            2. Lista de Aprobados del Examen
            <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded-md text-[10px]">
              {aprobadosList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sheets_sync')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sheets_sync'
                ? 'bg-slate-800 text-teal-400 border-t-2 border-teal-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-teal-400" />
            Conectar Google Sheet en la Nube / Cargar Excel
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-slate-800 text-slate-200 border-t-2 border-slate-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Configuración
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* TAB 0: HOJA DE CÁLCULO GOOGLE SHEET EN VIVO */}
          {activeTab === 'sheet_live' && (
            <div className="space-y-4">
              {/* Quick Actions & Live Status Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
                      Hoja de Cálculo Oficial Generada Automáticamente
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Cada registro de trabajador, avance de video de 5% en 5% y resultado de examen se actualiza aquí en tiempo real.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyAllRows}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer transition-all"
                    title="Copia todas las filas con formato de columnas para pegar directo en tu Google Sheet"
                  >
                    {copiedAllRows ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAllRows ? '¡Copiado! Pega con Ctrl+V en tu Sheet' : 'Copiar Todo para Google Sheet (Ctrl+V)'}</span>
                  </button>

                  <a
                    href="/api/admin/export-csv"
                    download="registro_capacitacion_ipero_sst.csv"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Descargar CSV / Excel</span>
                  </a>

                  {isWebhookActive && (
                    <button
                      onClick={handleSyncAllToGoogleSheet}
                      disabled={isSyncingAll}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                      <span>{isSyncingAll ? 'Sincronizando...' : 'Forzar Sincronización a la Nube'}</span>
                    </button>
                  )}

                  <button
                    onClick={fetchAllData}
                    className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl border border-slate-700 cursor-pointer"
                    title="Refrescar datos de la hoja"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Sync all status feedback message */}
              {syncAllMessage && (
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-emerald-300 font-semibold flex items-center justify-between">
                  <span>{syncAllMessage}</span>
                  <button onClick={() => setSyncAllMessage(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
              )}

              {/* GOOGLE SPREADSHEET OFFICIAL CLOUD SYNC CARD */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/40 border border-blue-500/40 shadow-lg space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white tracking-wide uppercase">
                          Hoja Oficial de Google Sheets
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                          ID: 1vII8qox...F7JE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Hoja vinculada: <span className="font-mono text-blue-200">1vII8qox6tkwh_Z8MhjmIhXOSncm7NT7x6gbeHFsV7JE</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={sheetData?.googleSpreadsheetUrl || DEFAULT_SPREADSHEET_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all"
                      title="Abrir directamente la hoja de cálculo en Google Sheets"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir en Google Sheets</span>
                    </a>

                    {!googleUser ? (
                      <button
                        onClick={handleGoogleSignInClick}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 shadow-sm border border-slate-300 cursor-pointer transition-all"
                        title="Conectar cuenta de Google para sincronización directa"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        <span>Conectar Cuenta Google</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRequestSyncToGoogleSheet}
                          disabled={isGoogleSyncing}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Zap className={`w-3.5 h-3.5 ${isGoogleSyncing ? 'animate-spin' : ''}`} />
                          <span>{isGoogleSyncing ? 'Sincronizando Hoja...' : `⚡ Sincronizar Ahora (${rawSheetRows.length} filas)`}</span>
                        </button>

                        <button
                          onClick={handleGoogleLogoutClick}
                          className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                          title={`Desconectar (${googleUser.email || googleUser.displayName})`}
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {googleSyncStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                      googleSyncStatus.success
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {googleSyncStatus.success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      )}
                      <span>{googleSyncStatus.message}</span>
                    </div>
                    <button
                      onClick={() => setGoogleSyncStatus(null)}
                      className="text-slate-400 hover:text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por Carnet (CI), Nombre o Cargo..."
                    className="w-full bg-slate-800 text-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterEmpresa}
                    onChange={(e) => setFilterEmpresa(e.target.value)}
                    className="bg-slate-800 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700"
                  >
                    <option value="ALL">Todas las Empresas ({uniqueEmpresas.length})</option>
                    {uniqueEmpresas.map((emp) => (
                      <option key={emp} value={emp}>
                        {emp}
                      </option>
                    ))}
                  </select>

                  <span className="text-xs text-slate-400 font-mono">
                    Mostrando {filteredSheetRows.length} de {rawSheetRows.length} registros
                  </span>
                </div>
              </div>

              {/* Authentic Google Sheet Grid Display */}
              <div className="rounded-2xl border-2 border-emerald-900/60 overflow-hidden bg-slate-950 shadow-2xl">
                {/* Spreadsheet Ribbon simulation */}
                <div className="bg-emerald-900/80 px-4 py-2 text-white text-xs font-mono font-bold flex items-center justify-between border-b border-emerald-800">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                    <span>HOJA1: CAPACITACIÓN_IPERO_SST_2026.SHEET</span>
                  </div>
                  <span className="text-[11px] text-emerald-200">
                    13 Columnas Oficiales • Autoguardado Activo
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs text-slate-200 border-collapse">
                    <thead className="sticky top-0 bg-emerald-900 text-white uppercase font-mono text-[11px] shadow-md z-10">
                      <tr>
                        <th className="p-2.5 border-r border-emerald-800 w-10 text-center text-emerald-300">#</th>
                        {AUTOMATIC_HEADERS.map((h, i) => (
                          <th key={i} className="p-2.5 border-r border-emerald-800 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                      {filteredSheetRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-850/80 transition-colors odd:bg-slate-900/40 even:bg-slate-950/60"
                        >
                          <td className="p-2.5 border-r border-slate-800 text-center text-slate-500 font-bold">
                            {idx + 1}
                          </td>
                          {/* 0: Carnet */}
                          <td className="p-2.5 border-r border-slate-800 font-bold text-emerald-400 whitespace-nowrap">
                            {row[0]}
                          </td>
                          {/* 1: Nombre */}
                          <td className="p-2.5 border-r border-slate-800 font-sans font-semibold text-white whitespace-nowrap">
                            {row[1]}
                          </td>
                          {/* 2: Empresa */}
                          <td className="p-2.5 border-r border-slate-800 font-sans text-slate-300 whitespace-nowrap">
                            {row[2]}
                          </td>
                          {/* 3: Cargo */}
                          <td className="p-2.5 border-r border-slate-800 font-sans text-slate-400 whitespace-nowrap">
                            {row[3]}
                          </td>
                          {/* 4: Fecha Registro */}
                          <td className="p-2.5 border-r border-slate-800 text-slate-300 whitespace-nowrap">
                            {row[4]}
                          </td>
                          {/* 5: Hora Registro */}
                          <td className="p-2.5 border-r border-slate-800 text-slate-400 whitespace-nowrap">
                            {row[5]}
                          </td>
                          {/* 6: Progreso Video (%) */}
                          <td className="p-2.5 border-r border-slate-800 whitespace-nowrap">
                            <span className="font-bold text-amber-300">
                              {row[6]}%
                            </span>
                          </td>
                          {/* 7: Estado Video */}
                          <td className="p-2.5 border-r border-slate-800 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                String(row[7]).includes('Completado')
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {row[7]}
                            </span>
                          </td>
                          {/* 8: Última Visualización */}
                          <td className="p-2.5 border-r border-slate-800 text-slate-400 whitespace-nowrap">
                            {row[8]}
                          </td>
                          {/* 9: Nota Examen */}
                          <td className="p-2.5 border-r border-slate-800 whitespace-nowrap font-bold">
                            {row[9]}
                          </td>
                          {/* 10: Estado Examen */}
                          <td className="p-2.5 border-r border-slate-800 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row[10] === 'APROBADO'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : row[10] === 'REPROBADO'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {row[10]}
                            </span>
                          </td>
                          {/* 11: Fecha Aprobación */}
                          <td className="p-2.5 border-r border-slate-800 text-slate-400 whitespace-nowrap">
                            {row[11]}
                          </td>
                          {/* 12: N° Certificado */}
                          <td className="p-2.5 text-cyan-300 font-bold whitespace-nowrap">
                            {row[12]}
                          </td>
                        </tr>
                      ))}
                      {filteredSheetRows.length === 0 && (
                        <tr>
                          <td colSpan={14} className="p-8 text-center text-slate-500">
                            No se encontraron filas que coincidan con la búsqueda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: LISTA DE VISUALIZACIÓN */}
          {activeTab === 'visualizacion' && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por Carnet, Nombre o Cargo..."
                    className="w-full bg-slate-800 text-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterEmpresa}
                    onChange={(e) => setFilterEmpresa(e.target.value)}
                    className="bg-slate-800 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700"
                  >
                    <option value="ALL">Todas las Empresas</option>
                    {uniqueEmpresas.map((emp) => (
                      <option key={emp} value={emp}>
                        {emp}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={fetchAllData}
                    className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl border border-slate-700 cursor-pointer"
                    title="Actualizar datos"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60 shadow-inner">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-850 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">N° Carnet (CI)</th>
                      <th className="p-3">Participante</th>
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Cargo</th>
                      <th className="p-3">Progreso de Video (%)</th>
                      <th className="p-3">Última Visualización</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredVisualizacion.map((u) => (
                      <tr key={u.carnet} className="hover:bg-slate-850/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-emerald-400">{u.carnet}</td>
                        <td className="p-3 font-semibold text-white">{u.nombre}</td>
                        <td className="p-3 text-slate-300">{u.empresa}</td>
                        <td className="p-3 text-slate-400">{u.cargo}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full"
                                style={{ width: `${u.videoProgreso}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-emerald-400 text-[11px]">
                              {u.videoProgreso}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">
                          {u.ultimoVideoUpdate}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              u.videoCompletado
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : u.videoProgreso > 0
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {u.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredVisualizacion.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          No se encontraron registros de participantes para esta búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: LISTA DE APROBADOS */}
          {activeTab === 'aprobados' && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar en aprobados..."
                    className="w-full bg-slate-800 text-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterEmpresa}
                    onChange={(e) => setFilterEmpresa(e.target.value)}
                    className="bg-slate-800 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700"
                  >
                    <option value="ALL">Todas las Empresas</option>
                    {uniqueEmpresas.map((emp) => (
                      <option key={emp} value={emp}>
                        {emp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60 shadow-inner">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-850 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">N° Carnet (CI)</th>
                      <th className="p-3">Personal Aprobado</th>
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Cargo</th>
                      <th className="p-3">Calificación</th>
                      <th className="p-3">Fecha Aprobación</th>
                      <th className="p-3">N° Certificado</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredAprobados.map((u) => (
                      <tr key={u.carnet} className="hover:bg-slate-850/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-emerald-400">{u.carnet}</td>
                        <td className="p-3 font-semibold text-white">{u.nombre}</td>
                        <td className="p-3 text-slate-300">{u.empresa}</td>
                        <td className="p-3 text-slate-400">{u.cargo}</td>
                        <td className="p-3">
                          <span className="font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">
                            {u.examenNota}%
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">{u.examenFecha}</td>
                        <td className="p-3 font-mono text-cyan-300 text-[11px] font-bold">
                          {u.certificadoId}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              onSelectUserCertificate(u);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer transition-all shadow-sm"
                          >
                            Ver Certificado
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredAprobados.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-500">
                          Aún no hay participantes aprobados registrados en el sistema.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SINCRONIZAR CON GOOGLE SHEETS / EXCEL */}
          {activeTab === 'sheets_sync' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Webhook Configuration Box */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-tight">
                      Sincronización Automática con Google Sheets en tu Google Drive
                    </h3>
                    <p className="text-xs text-slate-400">
                      Conecta tu hoja para que cada registro y avance se guarde en tu nube de forma automática e inmediata.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-200 block">
                    URL de la Aplicación Web de Google Apps Script (Webhook):
                  </label>
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <input
                      type="url"
                      value={webhookInput}
                      onChange={(e) => setWebhookInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 bg-slate-800 text-white text-xs px-3.5 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500 font-mono"
                    />
                    <button
                      onClick={handleSaveAndTestWebhook}
                      disabled={isSavingWebhook}
                      className="px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 shrink-0"
                    >
                      {isSavingWebhook ? 'Verificando...' : 'Guardar y Probar Conexión'}
                    </button>
                  </div>

                  {webhookTestStatus && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        webhookTestStatus.success
                          ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                          : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {webhookTestStatus.success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      )}
                      <span>{webhookTestStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* 3 Step Tutorial */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-3">
                  <h4 className="font-bold text-teal-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Pasos sencillos para conectar tu Google Sheet (Toma 1 minuto):
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs">
                    <li>
                      Abre tu Google Spreadsheet en tu carpeta de Google Drive:
                      <a
                        href={googleDriveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:underline ml-1 font-bold inline-flex items-center gap-0.5"
                      >
                        Abrir Carpeta Drive <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      En el menú superior de Google Sheet, haz clic en: <strong className="text-white">Extensiones &gt; Apps Script</strong>.
                    </li>
                    <li>
                      Borra cualquier texto existente y pega el script que te dejamos abajo.
                    </li>
                    <li>
                      Haz clic en <strong className="text-white">Implementar &gt; Nueva implementación</strong>, selecciona tipo <strong className="text-white">Aplicación web</strong>, en <em>Quién tiene acceso</em> elige <strong className="text-emerald-400">Cualquier persona (Anyone)</strong>, y haz clic en <em>Implementar</em>.
                    </li>
                    <li>
                      Copia la URL web resultante y pégala arriba en este campo. ¡Listo!
                    </li>
                  </ol>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={handleCopyScript}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? '¡Código Copiado al Portapapeles!' : 'Copiar Código de Google Apps Script'}</span>
                    </button>

                    <button
                      onClick={handleCopyHeaders}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedHeaders ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedHeaders ? '¡Encabezados Copiados!' : 'Copiar Encabezados Oficiales'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bulk Import from Excel */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-tight">
                      Carga Masiva o Sincronización Manual desde Excel
                    </h3>
                    <p className="text-xs text-slate-400">
                      Pega filas copiadas directamente desde Excel o un archivo CSV con validación en tiempo real.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Pega las celdas copiadas de Excel (Carnet, Nombre, Empresa, Cargo, Progreso):
                  </label>
                  <textarea
                    rows={4}
                    value={importText}
                    onChange={(e) => handleValidateImportText(e.target.value)}
                    placeholder="10234567	CARLOS MAMANI	SOBOCE S.A.	OPERADOR	100&#10;9876543	LUCIA FERNANDEZ	CONTRATISTA	SUPERVISORA	75"
                    className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {importValidationResult && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400">
                        {importValidationResult.totalParsed} filas válidas listas para importar
                      </span>
                      {importValidationResult.errors.length > 0 && (
                        <span className="text-amber-400 font-semibold">
                          {importValidationResult.errors.length} advertencias
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleExecuteImport}
                      disabled={isImporting}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer transition-all disabled:opacity-40"
                    >
                      {isImporting ? 'Guardando...' : `Confirmar e Importar ${importValidationResult.totalParsed} Participantes`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CONFIGURACIÓN */}
          {activeTab === 'config' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-xl space-y-4">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  Configuración del Video Oficial de Capacitación
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    URL o ID del Video de YouTube Oficial:
                  </label>
                  <input
                    type="text"
                    defaultValue="https://youtu.be/zbTIMX2Gbu8"
                    onChange={(e) => setYoutubeUrlInput(e.target.value)}
                    placeholder="https://youtu.be/zbTIMX2Gbu8"
                    className="w-full bg-slate-800 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Link configurado actualmente: https://youtu.be/zbTIMX2Gbu8 (ID: zbTIMX2Gbu8)
                  </span>
                </div>

                <button
                  onClick={handleSaveVideoConfig}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  {saveConfigSuccess ? '¡Guardado Correctamente!' : 'Guardar Configuración'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MANDATORY CONFIRMATION MODAL FOR GOOGLE SHEETS MUTATIONS */}
        {showSyncConfirmationModal && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/40 mx-auto">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-extrabold text-white">
                  ¿Confirmar sincronización con Google Sheets?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Se actualizarán y escribirán <strong className="text-emerald-400">{rawSheetRows.length} registros</strong> de capacitación directamente en tu hoja oficial de cálculo:
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-blue-300 break-all select-all">
                  1vII8qox6tkwh_Z8MhjmIhXOSncm7NT7x6gbeHFsV7JE
                </div>
                <p className="text-[11px] text-slate-400">
                  Esta acción actualizará los 13 campos oficiales (Carnet, Nombre, Empresa, Cargo, Fechas, Avance de Video y Aprobación).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSyncConfirmationModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold text-xs cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSyncToGoogleSheet}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar y Llenar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

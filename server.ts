import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { PROCEDURE_FULL_TEXT, FULL_QUESTION_BANK } from './src/procedureData.ts';
import { UserProfile } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Persistent JSON File Storage
const DB_FILE_PATH = path.resolve(__dirname, 'users_db.json');

// Initialize Store with sample or persisted data
function loadUsersDatabase(): Map<string, UserProfile> {
  const store = new Map<string, UserProfile>();
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        parsed.forEach((u: UserProfile) => {
          if (u.carnet) store.set(u.carnet.toUpperCase(), u);
        });
        console.log(`[DB] Se cargaron ${store.size} usuarios desde ${DB_FILE_PATH}`);
        return store;
      }
    }
  } catch (err) {
    console.warn('[DB] Error al leer archivo de base de datos:', err);
  }

  // Initial Seed Data if file does not exist yet
  const initialSeeds: UserProfile[] = [
    {
      carnet: '10234567',
      nombre: 'CARLOS MAMANI FLORES',
      empresa: 'SOBOCE S.A.',
      cargo: 'OPERADOR DE MOLIENDA',
      fechaRegistro: '2026-10-14',
      horaRegistro: '08:15:22',
      videoProgreso: 100,
      videoCompletado: true,
      ultimoVideoUpdate: '2026-10-14 08:45:10',
      examenRendido: true,
      examenAprobado: true,
      examenNota: 90,
      examenFecha: '2026-10-14 09:00:15',
      certificadoId: 'CERT-IPERO-2026-0041'
    },
    {
      carnet: '9876543',
      nombre: 'LUCIA FERNÁNDEZ QUISPE',
      empresa: 'CONSTRUCTORA DEL SUR S.R.L. (CONTRATISTA)',
      cargo: 'SUPERVISORA DE OBRAS',
      fechaRegistro: '2026-10-14',
      horaRegistro: '08:20:00',
      videoProgreso: 75,
      videoCompletado: false,
      ultimoVideoUpdate: '2026-10-14 08:52:30',
      examenRendido: false,
      examenAprobado: false,
      examenNota: 0
    },
    {
      carnet: '4567890',
      nombre: 'JUAN PEREZ CHOQUE',
      empresa: 'SOBOCE S.A.',
      cargo: 'TÉCNICO MECÁNICO',
      fechaRegistro: '2026-10-14',
      horaRegistro: '07:45:10',
      videoProgreso: 45,
      videoCompletado: false,
      ultimoVideoUpdate: '2026-10-14 08:12:05',
      examenRendido: false,
      examenAprobado: false,
      examenNota: 0
    }
  ];

  initialSeeds.forEach((u) => store.set(u.carnet.toUpperCase(), u));
  saveUsersDatabase(store);
  return store;
}

function saveUsersDatabase(store: Map<string, UserProfile>) {
  try {
    const list = Array.from(store.values());
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error guardando base de datos:', err);
  }
}

const usersStore = loadUsersDatabase();

const CONFIG_FILE_PATH = path.resolve(__dirname, 'config.json');

let platformConfig = {
  youtubeVideoId: 'zbTIMX2Gbu8',
  youtubeVideoUrl: 'https://youtu.be/zbTIMX2Gbu8',
  adminPassword: 'CVCM2026!)',
  minimoAprobacionExamen: 80,
  minimoAciertos: 8,
  totalPreguntas: 10,
  googleDriveFolderUrl: 'https://drive.google.com/drive/folders/1rf24lhjQIGYTCyCbpH6cqopyLciECf7k?hl=es',
  googleSpreadsheetId: '1vII8qox6tkwh_Z8MhjmIhXOSncm7NT7x6gbeHFsV7JE',
  googleSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1vII8qox6tkwh_Z8MhjmIhXOSncm7NT7x6gbeHFsV7JE/edit?gid=0#gid=0',
  sheetsWebhookUrl: '', // Google Apps Script Web App URL
  lastSyncTime: '' as string | null,
  totalSyncedRows: 0,
};

// Load saved config from disk if exists
try {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'));
    platformConfig = { ...platformConfig, ...savedConfig };
  }
} catch (e) {
  console.warn('[Config] Error loading config.json:', e);
}

function saveConfigToDisk() {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(platformConfig, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Config] Error saving config.json:', e);
  }
}

const SHEET_FILE_PATH = path.resolve(__dirname, 'google_sheet_registros.csv');
const SHEET_JSON_PATH = path.resolve(__dirname, 'google_sheet_registros.json');

// Helper to format rows for Google Sheets / Excel
function getSheetRowsArray(store: Map<string, UserProfile>): Array<Array<string | number>> {
  const users = Array.from(store.values());
  return users.map((u) => [
    u.carnet,
    u.nombre,
    u.empresa,
    u.cargo,
    u.fechaRegistro,
    u.horaRegistro,
    u.videoProgreso,
    u.videoCompletado ? 'Completado (100%)' : u.videoProgreso > 0 ? `En Progreso (${u.videoProgreso}%)` : 'Sin Iniciar',
    u.ultimoVideoUpdate || `${u.fechaRegistro} ${u.horaRegistro}`,
    u.examenRendido ? `${u.examenNota}%` : 'No rendido',
    u.examenAprobado ? 'APROBADO' : u.examenRendido ? 'REPROBADO' : 'PENDIENTE',
    u.examenAprobado && u.examenFecha ? u.examenFecha : '-',
    u.certificadoId || '-',
  ]);
}

const SHEET_HEADERS = [
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
  'N° Certificado',
];

function updateSheetExportFiles(store: Map<string, UserProfile>) {
  try {
    const rows = getSheetRowsArray(store);
    const jsonContent = JSON.stringify({
      headers: SHEET_HEADERS,
      totalRows: rows.length,
      lastUpdated: new Date().toLocaleString(),
      rows,
    }, null, 2);
    fs.writeFileSync(SHEET_JSON_PATH, jsonContent, 'utf-8');

    const csvRows = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','));
    const csvContent = '\uFEFF' + [SHEET_HEADERS.join(','), ...csvRows].join('\r\n');
    fs.writeFileSync(SHEET_FILE_PATH, csvContent, 'utf-8');
  } catch (err) {
    console.error('[Sheet] Error actualizando archivos locales de hoja:', err);
  }
}

// Generate initial sheet files at server start
updateSheetExportFiles(usersStore);

// Background dispatcher to write records to Google Sheet in real time
async function sendToGoogleSheet(user: UserProfile): Promise<{ success: boolean; message?: string }> {
  // Always update local persistent sheet files
  updateSheetExportFiles(usersStore);

  if (!platformConfig.sheetsWebhookUrl || !platformConfig.sheetsWebhookUrl.startsWith('http')) {
    return { success: false, message: 'No hay URL de Google Sheet (Apps Script) configurada.' };
  }

  try {
    const payload = {
      carnet: user.carnet,
      nombre: user.nombre,
      empresa: user.empresa,
      cargo: user.cargo,
      fechaRegistro: user.fechaRegistro,
      horaRegistro: user.horaRegistro,
      videoProgreso: user.videoProgreso,
      videoCompletado: user.videoCompletado,
      ultimoVideoUpdate: user.ultimoVideoUpdate,
      examenNota: user.examenNota,
      examenAprobado: user.examenAprobado,
      examenRendido: user.examenRendido,
      examenFecha: user.examenFecha || '-',
      certificadoId: user.certificadoId || '-',
    };

    // Google Apps Script accepts text/plain with JSON body
    const response = await fetch(platformConfig.sheetsWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    platformConfig.lastSyncTime = new Date().toLocaleString();
    platformConfig.totalSyncedRows = (platformConfig.totalSyncedRows || 0) + 1;
    saveConfigToDisk();

    return { success: response.ok };
  } catch (err: any) {
    console.warn('[Google Sheets Sync Error]:', err.message);
    return { success: false, message: err.message };
  }
}

// ADMIN PASSWORD VERIFICATION (CVCM2026!)
app.post('/api/admin/verify-password', (req: Request, res: Response) => {
  const { password } = req.body;
  if (password === platformConfig.adminPassword) {
    return res.json({ success: true, authorized: true });
  }
  return res.status(401).json({ success: false, error: 'Contraseña de administrador incorrecta.' });
});

// LOGIN WITH CARNET (KEY TO RE-ENTER)
app.post('/api/login', (req: Request, res: Response) => {
  const { carnet } = req.body;
  if (!carnet || !carnet.trim()) {
    return res.status(400).json({ error: 'El número de carnet es obligatorio.' });
  }

  const cleanCarnet = carnet.trim().toUpperCase();
  const user = usersStore.get(cleanCarnet);

  if (!user) {
    return res.status(404).json({
      error: `El carnet "${cleanCarnet}" no se encuentra registrado. Si es su primera vez, seleccione la opción "Nuevo Registro".`,
    });
  }

  return res.json({
    success: true,
    message: `Bienvenido de nuevo, ${user.nombre}.`,
    user,
  });
});

// REGISTER NEW PARTICIPANT (UPPERCASE ENFORCED)
app.post('/api/register', (req: Request, res: Response) => {
  const { carnet, nombre, empresa, cargo } = req.body;

  if (!carnet || !carnet.trim()) {
    return res.status(400).json({ error: 'El número de carnet es obligatorio.' });
  }

  const cleanCarnet = carnet.trim().toUpperCase();
  const existing = usersStore.get(cleanCarnet);

  const now = new Date();
  const fechaStr = now.toISOString().split('T')[0];
  const horaStr = now.toTimeString().split(' ')[0];

  if (existing) {
    if (nombre?.trim()) existing.nombre = nombre.trim().toUpperCase();
    if (empresa?.trim()) existing.empresa = empresa.trim().toUpperCase();
    if (cargo?.trim()) existing.cargo = cargo.trim().toUpperCase();
    saveUsersDatabase(usersStore);
    sendToGoogleSheet(existing); // Auto sync to Google Sheet
    return res.json({
      message: 'Usuario reconocido. Retomando sesión...',
      isNew: false,
      user: existing,
    });
  }

  if (!nombre?.trim() || !empresa?.trim() || !cargo?.trim()) {
    return res.status(400).json({ error: 'Para el primer registro, todos los campos son obligatorios.' });
  }

  const newUser: UserProfile = {
    carnet: cleanCarnet,
    nombre: nombre.trim().toUpperCase(),
    empresa: empresa.trim().toUpperCase(),
    cargo: cargo.trim().toUpperCase(),
    fechaRegistro: fechaStr,
    horaRegistro: horaStr,
    videoProgreso: 0,
    videoCompletado: false,
    ultimoVideoUpdate: `${fechaStr} ${horaStr}`,
    examenRendido: false,
    examenAprobado: false,
    examenNota: 0,
  };

  usersStore.set(cleanCarnet, newUser);
  saveUsersDatabase(usersStore);
  sendToGoogleSheet(newUser); // Auto sync new user to Google Sheet

  return res.json({
    message: 'Usuario registrado exitosamente en la plataforma IPERO.',
    isNew: true,
    user: newUser,
  });
});

// GET RANDOM 10 QUESTIONS FROM THE 30-QUESTION BANK
app.get('/api/exam/questions', (_req: Request, res: Response) => {
  const shuffled = [...FULL_QUESTION_BANK].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 10).map((q) => ({
    id: q.id,
    pregunta: q.pregunta,
    opciones: q.opciones,
    articuloReferencia: q.articuloReferencia,
    explicacion: q.explicacion,
  }));
  return res.json({ questions: selected });
});

// GET USER PROFILE BY CARNET
app.get('/api/user/:carnet', (req: Request, res: Response) => {
  const carnet = req.params.carnet?.trim().toUpperCase();
  const user = usersStore.get(carnet);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado con ese carnet.' });
  }
  return res.json({ user });
});

// UPDATE VIDEO PROGRESS (Record 5% increments and sync to Google Sheet)
app.post('/api/progress', (req: Request, res: Response) => {
  const { carnet, progreso } = req.body;
  if (!carnet) {
    return res.status(400).json({ error: 'Carnet requerido.' });
  }

  const cleanCarnet = carnet.trim().toUpperCase();
  const user = usersStore.get(cleanCarnet);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no registrado.' });
  }

  const rawProg = Math.max(0, Math.min(100, Number(progreso) || 0));
  const steppedProg = Math.floor(rawProg / 5) * 5;

  if (steppedProg > user.videoProgreso) {
    user.videoProgreso = steppedProg;
  }

  const now = new Date();
  user.ultimoVideoUpdate = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

  if (user.videoProgreso >= 100 || rawProg >= 99) {
    user.videoProgreso = 100;
    user.videoCompletado = true;
  }

  saveUsersDatabase(usersStore);
  sendToGoogleSheet(user); // Auto sync progress update to Google Sheet

  return res.json({
    success: true,
    videoProgreso: user.videoProgreso,
    videoCompletado: user.videoCompletado,
    ultimoVideoUpdate: user.ultimoVideoUpdate,
  });
});

// SUBMIT EXAM (Evaluated against 30-question bank with 8 aciertos threshold)
app.post('/api/exam/submit', (req: Request, res: Response) => {
  const { carnet, answers, questionIds } = req.body;

  if (!carnet) {
    return res.status(400).json({ error: 'Carnet requerido.' });
  }

  const cleanCarnet = carnet.trim().toUpperCase();
  const user = usersStore.get(cleanCarnet);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const now = Date.now();
  if (user.siguienteIntentoPermitido && now < user.siguienteIntentoPermitido) {
    const diffMs = user.siguienteIntentoPermitido - now;
    const hoursRemaining = (diffMs / (1000 * 60 * 60)).toFixed(1);
    return res.status(429).json({
      error: `Debe esperar 1 día (24 horas) para volver a intentar el examen. Tiempo restante aprox: ${hoursRemaining} horas.`,
      siguienteIntentoPermitido: user.siguienteIntentoPermitido,
    });
  }

  const qBankMap = new Map(FULL_QUESTION_BANK.map((q) => [q.id, q]));
  const evaluatedIds: number[] = Array.isArray(questionIds) && questionIds.length > 0
    ? questionIds
    : Object.keys(answers || {}).map(Number);

  let correctCount = 0;
  const details: Array<{
    id: number;
    userChoice: number;
    correctChoice: number;
    isCorrect: boolean;
    explicacion: string;
    articuloReferencia: string;
  }> = [];

  evaluatedIds.forEach((id) => {
    const questionObj = qBankMap.get(id);
    if (!questionObj) return;

    const userChoice = answers ? answers[id] : undefined;
    const isCorrect = userChoice === questionObj.respuestaCorrecta;
    if (isCorrect) correctCount++;
    details.push({
      id: questionObj.id,
      userChoice,
      correctChoice: questionObj.respuestaCorrecta,
      isCorrect,
      explicacion: questionObj.explicacion,
      articuloReferencia: questionObj.articuloReferencia,
    });
  });

  const totalQuestions = evaluatedIds.length || 10;
  const percentageScore = Math.round((correctCount / totalQuestions) * 100);
  const passed = correctCount >= platformConfig.minimoAciertos;

  user.examenRendido = true;
  user.examenNota = percentageScore;
  const dateObj = new Date();
  user.examenFecha = `${dateObj.toISOString().split('T')[0]} ${dateObj.toTimeString().split(' ')[0]}`;

  if (passed) {
    user.examenAprobado = true;
    user.siguienteIntentoPermitido = undefined;
    if (!user.certificadoId) {
      user.certificadoId = `CERT-IPERO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  } else {
    user.examenAprobado = false;
    user.siguienteIntentoPermitido = now + 24 * 60 * 60 * 1000;
  }

  saveUsersDatabase(usersStore);
  sendToGoogleSheet(user); // Auto sync exam score & certificate to Google Sheet

  return res.json({
    aprobado: passed,
    nota: percentageScore,
    correctas: correctCount,
    total: totalQuestions,
    minimoRequeridoAciertos: platformConfig.minimoAciertos,
    minimoRequerido: platformConfig.minimoAprobacionExamen,
    siguienteIntentoPermitido: user.siguienteIntentoPermitido,
    certificadoId: user.certificadoId,
    details,
    user,
  });
});

// SUPERVISOR BYPASS LOCKOUT
app.post('/api/exam/bypass-lockout', (req: Request, res: Response) => {
  const { carnet } = req.body;
  const cleanCarnet = carnet?.trim().toUpperCase();
  const user = usersStore.get(cleanCarnet);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  user.siguienteIntentoPermitido = undefined;
  saveUsersDatabase(usersStore);
  return res.json({ success: true, message: 'Bloqueo desactivado por supervisión.', user });
});

// ADMIN REPORTS: LIST 1 (VISUALIZACIÓN) & LIST 2 (APROBADOS)
app.get('/api/admin/reports', (_req: Request, res: Response) => {
  const allUsers = Array.from(usersStore.values());

  const listaVisualizacion = allUsers.map((u) => ({
    carnet: u.carnet,
    nombre: u.nombre,
    empresa: u.empresa,
    cargo: u.cargo,
    videoProgreso: u.videoProgreso,
    videoCompletado: u.videoCompletado,
    fechaRegistro: u.fechaRegistro,
    horaRegistro: u.horaRegistro,
    ultimoVideoUpdate: u.ultimoVideoUpdate,
    estado: u.videoCompletado
      ? 'Video Completado (100%)'
      : u.videoProgreso > 0
        ? `En Progreso (${u.videoProgreso}%)`
        : 'Sin Iniciar',
  }));

  const listaAprobados = allUsers
    .filter((u) => u.examenAprobado)
    .map((u) => ({
      carnet: u.carnet,
      nombre: u.nombre,
      empresa: u.empresa,
      cargo: u.cargo,
      examenNota: u.examenNota,
      examenFecha: u.examenFecha || 'N/A',
      certificadoId: u.certificadoId || 'N/A',
      estado: 'APROBADO',
    }));

  return res.json({
    totalRegistrados: allUsers.length,
    totalVisualizando: listaVisualizacion.filter((u) => u.videoProgreso > 0 && !u.videoCompletado).length,
    totalCompletaronVideo: listaVisualizacion.filter((u) => u.videoCompletado).length,
    totalAprobados: listaAprobados.length,
    listaVisualizacion,
    listaAprobados,
    googleDriveFolderUrl: platformConfig.googleDriveFolderUrl,
    sheetsWebhookUrl: platformConfig.sheetsWebhookUrl,
    lastSyncTime: platformConfig.lastSyncTime,
    totalSyncedRows: platformConfig.totalSyncedRows || 0,
  });
});

// LIVE GOOGLE SHEET DATA FOR INFORME ADMIN TABLE
app.get('/api/admin/sheet-data', (_req: Request, res: Response) => {
  const rows = getSheetRowsArray(usersStore);
  return res.json({
    headers: SHEET_HEADERS,
    rows,
    totalRows: rows.length,
    lastSyncTime: platformConfig.lastSyncTime,
    totalSyncedRows: platformConfig.totalSyncedRows || 0,
    sheetsWebhookUrl: platformConfig.sheetsWebhookUrl,
    googleDriveFolderUrl: platformConfig.googleDriveFolderUrl,
    googleSpreadsheetId: platformConfig.googleSpreadsheetId,
    googleSpreadsheetUrl: platformConfig.googleSpreadsheetUrl,
    isWebhookActive: Boolean(platformConfig.sheetsWebhookUrl && platformConfig.sheetsWebhookUrl.startsWith('http')),
  });
});

// EXPORT TO CSV (FOR EXCEL / GOOGLE SHEETS)
app.get('/api/admin/export-csv', (_req: Request, res: Response) => {
  const allUsers = Array.from(usersStore.values());

  const rows = allUsers.map((u) => [
    `"${u.carnet}"`,
    `"${u.nombre.replace(/"/g, '""')}"`,
    `"${u.empresa.replace(/"/g, '""')}"`,
    `"${u.cargo.replace(/"/g, '""')}"`,
    `"${u.fechaRegistro}"`,
    `"${u.horaRegistro}"`,
    u.videoProgreso,
    `"${u.videoCompletado ? 'Completado' : 'En Progreso'}"`,
    `"${u.ultimoVideoUpdate}"`,
    u.examenRendido ? `${u.examenNota}%` : 'No rendido',
    `"${u.examenAprobado ? 'APROBADO' : u.examenRendido ? 'REPROBADO' : 'PENDIENTE'}"`,
    `"${u.examenAprobado && u.examenFecha ? u.examenFecha : '-'}"`,
    `"${u.certificadoId || '-'}"`,
  ]);

  const csvContent = '\uFEFF' + [SHEET_HEADERS.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="registro_capacitacion_ipero_sst.csv"');
  return res.send(csvContent);
});

// EXPORT TO TSV (TAB-SEPARATED FOR EASY CLIPBOARD COPY INTO GOOGLE SHEETS)
app.get('/api/admin/export-tsv', (_req: Request, res: Response) => {
  const rows = getSheetRowsArray(usersStore);
  const tsvLines = [
    SHEET_HEADERS.join('\t'),
    ...rows.map((r) => r.map((c) => String(c).replace(/[\t\n\r]/g, ' ')).join('\t')),
  ];
  return res.send(tsvLines.join('\n'));
});

// FORCE SYNC ALL CURRENT RECORDS TO GOOGLE SHEET WEBHOOK
app.post('/api/admin/sync-all-to-sheet', async (_req: Request, res: Response) => {
  if (!platformConfig.sheetsWebhookUrl || !platformConfig.sheetsWebhookUrl.startsWith('http')) {
    return res.status(400).json({
      success: false,
      error: 'No hay URL de Google Sheet (Apps Script) configurada. Configúrela en la pestaña correspondiente.',
    });
  }

  const allUsers = Array.from(usersStore.values());
  let synced = 0;
  let errors = 0;

  for (const user of allUsers) {
    const result = await sendToGoogleSheet(user);
    if (result.success) synced++;
    else errors++;
  }

  platformConfig.lastSyncTime = new Date().toLocaleString();
  saveConfigToDisk();

  return res.json({
    success: true,
    total: allUsers.length,
    synced,
    errors,
    lastSyncTime: platformConfig.lastSyncTime,
    message: `Se enviaron ${synced} registros a tu Google Sheet en Google Drive.`,
  });
});

// DIRECT SYNC WITH GOOGLE SHEETS REST API (OAUTH TOKEN)
app.post('/api/admin/sync-google-sheet-api', async (req: Request, res: Response) => {
  const token = (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) || req.body?.accessToken;
  const spreadsheetId = req.body?.spreadsheetId || platformConfig.googleSpreadsheetId;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso de Google no proporcionado. Conecte su cuenta de Google en el panel de administración.',
    });
  }

  if (!spreadsheetId) {
    return res.status(400).json({
      success: false,
      error: 'ID de la hoja de cálculo de Google no configurado.',
    });
  }

  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!metaRes.ok) {
      const errText = await metaRes.text();
      return res.status(metaRes.status).json({
        success: false,
        error: `Error al acceder a Google Sheets (${metaRes.status}): ${errText}`,
      });
    }

    const metaData = await metaRes.json();
    const sheetTitle = metaData.sheets?.[0]?.properties?.title || 'Hoja 1';
    const sheetId = metaData.sheets?.[0]?.properties?.sheetId || 0;

    const dataRows = getSheetRowsArray(usersStore);
    const allRows = [SHEET_HEADERS, ...dataRows];

    // Clear range first
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:Z5000:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (clearErr) {
      console.warn('Clear non-fatal error:', clearErr);
    }

    // Write all rows
    const writeRange = `${sheetTitle}!A1:M${allRows.length}`;
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(writeRange)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: writeRange,
          majorDimension: 'ROWS',
          values: allRows,
        }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.text();
      return res.status(updateRes.status).json({
        success: false,
        error: `Error al escribir en Google Sheet: ${err}`,
      });
    }

    // Style headers
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 13,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.0, green: 0.24, blue: 0.54 },
                    textFormat: {
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                      bold: true,
                    },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE',
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
              },
            },
            {
              updateSheetProperties: {
                properties: {
                  sheetId,
                  gridProperties: { frozenRowCount: 1 },
                },
                fields: 'gridProperties.frozenRowCount',
              },
            },
          ],
        }),
      });
    } catch (e) {
      console.warn('BatchUpdate style error:', e);
    }

    platformConfig.lastSyncTime = new Date().toLocaleString();
    platformConfig.totalSyncedRows = dataRows.length;
    saveConfigToDisk();

    return res.json({
      success: true,
      message: `¡Éxito! Se sincronizaron ${dataRows.length} registros directamente en tu hoja de cálculo "${metaData.properties?.title || 'Google Sheet'}".`,
      totalSyncedRows: dataRows.length,
      lastSyncTime: platformConfig.lastSyncTime,
      sheetTitle,
    });
  } catch (err: any) {
    console.error('Google Sheets API sync error:', err);
    return res.status(500).json({
      success: false,
      error: `Error al sincronizar con Google Sheets: ${err.message}`,
    });
  }
});

// TEST WEBHOOK CONNECTION
app.post('/api/admin/test-sheet-webhook', async (req: Request, res: Response) => {
  const webhookUrl = req.body?.webhookUrl || platformConfig.sheetsWebhookUrl;
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return res.status(400).json({ success: false, error: 'Debe ingresar una URL válida de Google Apps Script.' });
  }

  try {
    const testPayload = {
      carnet: 'TEST-0001',
      nombre: 'PRUEBA DE CONEXIÓN IPERO SST',
      empresa: 'SOBOCE S.A.',
      cargo: 'VERIFICACIÓN SISTEMA',
      fechaRegistro: new Date().toISOString().split('T')[0],
      horaRegistro: new Date().toTimeString().split(' ')[0],
      videoProgreso: 100,
      videoCompletado: true,
      ultimoVideoUpdate: new Date().toLocaleString(),
      examenNota: 100,
      examenAprobado: true,
      examenRendido: true,
      examenFecha: new Date().toLocaleString(),
      certificadoId: 'CERT-TEST-CONEXION',
    };

    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(testPayload),
    });

    const responseText = await resp.text();
    return res.json({
      success: resp.ok,
      status: resp.status,
      response: responseText.slice(0, 500),
      message: 'Conexión con Google Sheet exitosa. Se insertó/actualizó la fila de prueba.',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Error al contactar con Google Apps Script: ${err.message}`,
    });
  }
});

// BULK IMPORT / SYNC FROM EXCEL
app.post('/api/admin/bulk-import', async (req: Request, res: Response) => {
  const { records } = req.body;
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'Formato inválido. Se espera un arreglo de registros.' });
  }

  let importedCount = 0;
  const now = new Date();
  const fechaStr = now.toISOString().split('T')[0];
  const horaStr = now.toTimeString().split(' ')[0];

  for (const r of records) {
    if (!r.carnet || !r.carnet.toString().trim()) continue;
    const cleanCarnet = r.carnet.toString().trim().toUpperCase();
    const existing = usersStore.get(cleanCarnet);

    const user: UserProfile = {
      carnet: cleanCarnet,
      nombre: (r.nombre || existing?.nombre || 'PERSONAL CAPACITADO').toUpperCase().trim(),
      empresa: (r.empresa || existing?.empresa || 'SOBOCE S.A.').toUpperCase().trim(),
      cargo: (r.cargo || existing?.cargo || 'TRABAJADOR').toUpperCase().trim(),
      fechaRegistro: r.fechaRegistro || existing?.fechaRegistro || fechaStr,
      horaRegistro: r.horaRegistro || existing?.horaRegistro || horaStr,
      videoProgreso: Number(r.videoProgreso ?? existing?.videoProgreso ?? 0),
      videoCompletado: Boolean(r.videoCompletado ?? Number(r.videoProgreso) >= 100),
      ultimoVideoUpdate: r.ultimoVideoUpdate || existing?.ultimoVideoUpdate || `${fechaStr} ${horaStr}`,
      examenRendido: Boolean(r.examenRendido ?? existing?.examenRendido ?? false),
      examenAprobado: Boolean(r.examenAprobado ?? existing?.examenAprobado ?? false),
      examenNota: Number(r.examenNota ?? existing?.examenNota ?? 0),
      examenFecha: r.examenFecha || existing?.examenFecha,
      certificadoId: r.certificadoId || existing?.certificadoId,
    };

    usersStore.set(cleanCarnet, user);
    sendToGoogleSheet(user); // Auto sync to Google Sheet
    importedCount++;
  }

  saveUsersDatabase(usersStore);
  updateSheetExportFiles(usersStore);

  return res.json({
    success: true,
    message: `Se sincronizaron ${importedCount} registros correctamente con la base de datos y Google Sheet.`,
    total: usersStore.size,
  });
});

// CONFIG GET / SET
app.get('/api/config', (_req: Request, res: Response) => {
  res.json(platformConfig);
});

app.post('/api/config', async (req: Request, res: Response) => {
  const { youtubeVideoUrl, youtubeVideoId, googleDriveFolderUrl, sheetsWebhookUrl, googleSpreadsheetId, googleSpreadsheetUrl } = req.body;
  if (youtubeVideoUrl) platformConfig.youtubeVideoUrl = youtubeVideoUrl;
  if (youtubeVideoId) platformConfig.youtubeVideoId = youtubeVideoId;
  if (googleDriveFolderUrl) platformConfig.googleDriveFolderUrl = googleDriveFolderUrl;
  if (googleSpreadsheetId) platformConfig.googleSpreadsheetId = googleSpreadsheetId.trim();
  if (googleSpreadsheetUrl) platformConfig.googleSpreadsheetUrl = googleSpreadsheetUrl.trim();
  if (sheetsWebhookUrl !== undefined) {
    platformConfig.sheetsWebhookUrl = sheetsWebhookUrl.trim();
  }
  saveConfigToDisk();

  // If a new valid webhook was provided, trigger auto sync of all current users!
  if (sheetsWebhookUrl && sheetsWebhookUrl.trim().startsWith('http')) {
    setTimeout(async () => {
      for (const u of usersStore.values()) {
        await sendToGoogleSheet(u);
      }
    }, 100);
  }

  res.json({ success: true, config: platformConfig });
});

// HIGH-SPEED PROCEDURAL CHATBOT (< 100ms response time)
app.post('/api/chat', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensaje requerido.' });
  }

  const query = message.toLowerCase().trim();

  // Instant Procedural Resolver (Zero Latency)
  if (query.includes('duro') || query.includes('autónom') || query.includes('blando') || query.includes('dependiente')) {
    return res.json({
      reply: `De acuerdo al Procedimiento SPT-GSS.SI.011 (Pág. 4 y Anexo 2):\n\n• **Controles Autónomos ("Duros"):** Funcionan o se activan de forma independiente a la intervención de las personas (mayor prioridad en la jerarquía). Ejemplos: resguardos físicos, barandas, enclavamientos, sensores de corte automático, estructuras de seguridad, sistemas de ventilación, aislamientos y puestas a tierra.\n\n• **Controles Dependientes ("Blandos"):** Requieren la participación o conducta del trabajador. Ejemplos: uso de EPP, respeto a procedimientos o instructivos, permisos de trabajo, bloqueo y etiquetado (LOTO) e inspecciones planeadas.`,
      source: 'SPT-GSS.SI.011 Pág. 4, Definiciones de Controles Autónomos y Dependientes',
    });
  }

  if (query.includes('formula') || query.includes('fórmula') || query.includes('probabilidad') || query.includes('inpe') || query.includes('ifde') || query.includes('ico')) {
    return res.json({
      reply: `Según el Anexo 2 del procedimiento, la **Probabilidad de Ocurrencia (P)** se calcula mediante:\n\n$$\\mathbf{P = INPE + IFDE + ICO}$$\n\n• **INPE (Personas Expuestas):** 0 (no aplica/solo equipos), 1 (1-10 personas), 3 (11-20 personas), 5 (>20 personas).\n• **IFDE (Frecuencia y Duración):** Escala de 1 a 5. *Nota:* En condiciones anormales, de falla o emergencia, el IFDE tiene valor fijo de dos (2).\n• **ICO (Controles Existentes):** 1 (peligro eliminado/sustituido o controles duros simultáneos), 6 (controles parciales, al menos 2 condiciones), 10 (controles insuficientes, solo 1 condición o desvíos permanentes).\n\nInterpretación: 2-6 (Muy Baja), 7-10 (Baja), 11-14 (Media), 15-18 (Alta), ≥19 (Muy Alta).`,
      source: 'SPT-GSS.SI.011 Pág. 28-30, Anexo 2 Numeral 2',
    });
  }

  if (query.includes('apri') || query.includes('permiso de trabajo') || query.includes('3 semanas')) {
    return res.json({
      reply: `El **APRI (Análisis Preliminar de Riesgos e Impactos)** es la primera parte del formato SRT-GSS.SI.023:\n\n• Aplica a contratistas no rutinarios con trabajos menores a tres (3) semanas.\n• Aplica a actividades no rutinarias de corta duración menores a tres semanas o mantenimientos mayores.\n• **Firma reglamentaria:** El APRI **NO requiere firma de un Autorizante (PAEP)**; el PAEP solo firma en Permisos de Trabajo. El APRI se valida con las firmas de los trabajadores presentes en la charla de 5 minutos.`,
      source: 'SPT-GSS.SI.011 Pág. 11 y Pág. 19, Secc. 6.1.3 y 6.5',
    });
  }

  if (query.includes('intolerable') || query.includes('riesgo intolerable')) {
    return res.json({
      reply: `Ante un peligro con nivel de riesgo **INTOLERABLE**:\n\n1. Se debe suspender inmediatamente la actividad en ese mismo instante. Está terminantemente prohibido empezar o continuar el trabajo.\n2. Se ejecutan acciones inmediatas de control.\n3. Se comunica obligatoriamente el hallazgo a la **MAL (Máxima Autoridad del Lugar)** por correo electrónico.`,
      source: 'SPT-GSS.SI.011 Pág. 15, Nota 3 y Pág. 31',
    });
  }

  if (query.includes('jerarquia') || query.includes('jerarquía') || query.includes('controles')) {
    return res.json({
      reply: `La **Jerarquía de los Controles SST** en SOBOCE S.A. tiene el siguiente orden de preferencia estricto:\n\n1. **Eliminación:** Suprimir la fuente de peligro.\n2. **Sustitución:** Reemplazar el peligro por otro de menor riesgo (ej. Decrust en vez de gasolina).\n3. **Controles de Ingeniería / Protección Colectiva:** Resguardos, barandas, líneas de vida, ventilación.\n4. **Normalización, Capacitación, Señalización y/o Controles Administrativos:** Procedimientos, rotación, cartelería.\n5. **Dotación de EPP:** Equipos de protección personal específicos (última barrera).`,
      source: 'SPT-GSS.SI.011 Pág. 3, Numeral 3 Jerarquía de Controles',
    });
  }

  if (query.includes('oportunidad') || query.includes('ff') || query.includes('bm') || query.includes('6')) {
    return res.json({
      reply: `La determinación y evaluación de **Oportunidades SST (Anexo 3)** se realiza solo a peligros con severidad Mayor o Extremo que tengan riesgo Aceptable.\n\nFórmula:\n$$\\mathbf{Nivel\\ Oportunidad\\ SST = FF \\times BM}$$\n\n• **FF (Factibilidad):** 1 (Baja), 2 (Media), 3 (Alta).\n• **BM (Beneficio SST):** 1 (Bajo), 2 (Medio), 3 (Alto).\n• **Oportunidad Priorizada (Alta):** Puntaje igual o mayor a **6 puntos** (debe incorporarse al PG SST).`,
      source: 'SPT-GSS.SI.011 Pág. 33-35, Anexo 3',
    });
  }

  if (query.includes('examen') || query.includes('aprobar') || query.includes('80') || query.includes('8 aciertos') || query.includes('reprobar') || query.includes('esperar')) {
    return res.json({
      reply: `Reglas de Evaluación Oficial IPERO SST:\n\n• **Preguntas:** 10 preguntas seleccionadas al azar del banco oficial de 30 preguntas.\n• **Puntaje mínimo de aprobación:** 80% (mínimo 8 aciertos de 10).\n• **Habilitación:** El examen se desbloquea tras ver el video y completar el minuto de verificación del formulario QR.\n• **En caso de reprobar:** Se debe esperar **1 día (24 horas)** para volver a rendir la evaluación.\n• **Al aprobar:** Se emite automáticamente el certificado con *"¡FELICIDADES! CONCLUYÓ CON ÉXITO LA CAPACITACIÓN"*.`,
      source: 'Reglamento de Evaluación de Inducción SST SOBOCE S.A.',
    });
  }

  // Fast default response
  return res.json({
    reply: `Estimado(a) trabajador(a), sobre el Procedimiento SPT-GSS.SI.011 de SOBOCE S.A.:\n\nEste procedimiento establece la metodología IPERO bajo las normas ISO 45001 y NTS 009/23. Recuerda que la fórmula de probabilidad es P = (INPE + IFDE + ICO). Los controles autónomos (duros) tienen mayor prioridad que los blandos, y el APRI se aplica para actividades o contratistas menores a 3 semanas.\n\n¿Deseas una consulta específica sobre la jerarquía de controles, el cálculo de severidad o el formato APRI?`,
    source: 'Procedimiento SPT-GSS.SI.011 Rev. 11',
  });
});

// START SERVER
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[IPERO Platform] Servidor ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer();

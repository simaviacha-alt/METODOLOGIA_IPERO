export interface UserProfile {
  carnet: string; // Documento de Identidad (Key)
  nombre: string;
  empresa: string;
  cargo: string;
  fechaRegistro: string;
  horaRegistro: string;
  videoProgreso: number; // 0 to 100 in 5% steps
  videoCompletado: boolean;
  ultimoVideoUpdate: string;
  examenRendido: boolean;
  examenAprobado: boolean;
  examenNota: number; // 0 - 100%
  examenFecha?: string;
  siguienteIntentoPermitido?: number; // epoch ms for 24h lockout
  certificadoId?: string;
}

export interface ExamQuestion {
  id: number;
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number; // 0-indexed
  explicacion: string;
  articuloReferencia: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  sourceReference?: string;
}

export interface SyncConfig {
  sheetsWebhookUrl?: string;
  autoSync: boolean;
  lastSyncTime?: string;
}

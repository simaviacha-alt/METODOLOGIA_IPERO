import { ExamQuestion } from './types.ts';

export const PROCEDURE_METADATA = {
  codigo: "SPT-GSS.SI.011",
  revision: "11",
  fechaEmision: "23/09/2024",
  titulo: "IDENTIFICACIÓN DE PELIGROS, EVALUACIÓN, CONTROL DE RIESGOS OCUPACIONALES Y OPORTUNIDADES SST (IPERO)",
  empresa: "SOBOCE S.A.",
  normaReferencia: "ISO 45001:2018 / NTS 009/23 (Bolivia)",
  minimoAprobacionExamen: 80, // 80% mínimo (8 aciertos de 10)
  minimoAciertosRequeridos: 8,
  totalPreguntasExamen: 10,
  esperaReprobacionHoras: 24, // 1 día de espera en caso de reprobar
  adminPassword: "CVCM2026!)",
  defaultYoutubeUrl: "https://youtu.be/zbTIMX2Gbu8",
  defaultYoutubeId: "zbTIMX2Gbu8",
};

export const PROCEDURE_FULL_TEXT = `
PROCEDIMIENTO SPT-GSS.SI.011 (Rev. 11 - 23/09/2024)
SOBOCE S.A. - IDENTIFICACIÓN DE PELIGROS, EVALUACIÓN, CONTROL DE RIESGOS OCUPACIONALES Y OPORTUNIDADES SST (IPERO)

1. PROPÓSITO:
- Establecer el proceso de gestión de riesgos de seguridad y salud en el trabajo (SST), metodologías para identificación de peligros, evaluación de riesgos y determinación de medidas de control.
- Establecer el proceso para determinación, evaluación y gestión de Oportunidades SST.
- Definir directrices para revisión, aprobación y responsabilidades de programas de gestión SST (PG SST).

2. ALCANCE:
Aplica a los procesos productivos, administrativos, comerciales y lugares de trabajo de SOBOCE S.A., abarcando personal propio, contratistas, transportistas, proveedores y visitantes.

3. DEFINICIONES PRINCIPALES:
- Actividades Rutinarias: Periódicas, continuas o frecuentes (operación, paradas, mantenimiento regular anual). Cubiertas mediante IPERO Programada.
- Actividades No Rutinarias: Extraordinarias, sin frecuencia establecida o no planificadas (emergencias, mantenimientos correctivos no programados, desvíos, proyectos). Si su duración es mayor a 3 semanas se cubren mediante IPERO Anticipada; si es menor a 3 semanas, mediante APRI (Análisis Preliminar de Riesgos e Impactos).
- APRI: Metodología cualitativa simple y ágil (primera parte del SRT-GSS.SI.023). Aplica para contratistas < 3 semanas, actividades no rutinarias < 3 semanas, o de mayor criticidad. NO requiere firma de PAEP (el PAEP solo firma en Permiso de Trabajo). Requiere firma de los trabajadores de la charla de 5 minutos.
- Peligro: Fuente, situación o acto con potencial de causar daño en la salud, lesiones o daños materiales (ISO 45001 / NTS-009).
- Riesgo SST: Combinación de la probabilidad de que ocurra un evento peligroso y la severidad del daño.
- Jerarquía de Controles (en orden de prioridad estricto):
  1. Eliminación: Suprimir la fuente de peligro.
  2. Sustitución: Reemplazar el elemento peligroso por uno de menor riesgo (ej. usar Decrust en vez de gasolina).
  3. Controles de Ingeniería y Protección Colectiva: Modificaciones en diseño de maquinaria, resguardos, barandas, ventilación, enclavamientos, líneas de vida.
  4. Controles Administrativos / Normalización / Señalización / Capacitación: Horarios rotativos, descansos, procedimientos escritos, cartelería de seguridad.
  5. Dotación de EPP: Equipos de protección personal específicos.
- Controles Autónomos ("Duros"): Funcionan de manera independiente sin intervención humana (resguardos, sensores de corte automático, barandas, aislamientos, puestas a tierra). Máxima prioridad.
- Controles Dependientes ("Blandos"): Requieren la intervención o conducta del trabajador (uso de EPP, respeto de procedimientos, permisos de trabajo, bloqueo y etiquetado).

4. METODOLOGÍA DE EVALUACIÓN IPERO (ANEXO 2):
Fórmula de Probabilidad (P):
P = INPE + IFDE + ICO
Donde:
- INPE (Índice de Personas Expuestas):
  0 = No aplica (solo equipos/infraestructura)
  1 = 1 a 10 personas
  3 = 11 a 20 personas
  5 = Más de 20 personas
- IFDE (Índice de Frecuencia y Duración de Exposición):
  Escala del 1 al 5.
  *IMPORTANTE*: En condiciones anormales, de falla o emergencia, o cuando solo se exponen equipos, el IFDE tiene valor fijo de dos (2).
- ICO (Índice de Controles Existentes):
  1 = Se ha eliminado o sustituido el peligro (Condiciones A1 o A2 + B/C/D, o B+C+D simultáneas y efectivas).
  6 = Controles parciales (al menos 2 condiciones efectivas entre B, C, D, E).
  10 = Controles bajos, insuficientes o no implementados (1 o ninguna condición, desvíos permanentes o IPER anticipada).

Escala de Probabilidad resultante:
2 a 6: Muy Baja
7 a 10: Baja
11 a 14: Media
15 a 18: Alta
>= 19: Muy Alta

Severidad del Daño:
- Daño Menor: Primeros auxilios, ausencia < 1 día, daño < $1,000 USD.
- Daño Mediano: Ausencia entre 1 día y 1 mes, daño entre $1,001 y $10,000 USD.
- Daño Mayor: Ausencia entre 1 y 6 meses, incapacidades parciales permanentes, daño entre $10,001 y $100,000 USD.
- Daño Extremo: Ausencia entre 6 meses y 1 año, incapacidad total o muerte, daño > $100,000 USD.

Niveles de Riesgo y Acciones:
- RIESGO TRIVIAL y BAJO (ACEPTABLES): Mantener los controles existentes; no se requiere inversión forzada.
- RIESGO MODERADO (NO ACEPTABLE): Reducir el riesgo en plazo determinado dentro del PG SST.
- RIESGO ALTO (NO ACEPTABLE): Controlar el trabajo prioritariamente con acciones inmediatas (máx. 4 meses si hay retraso presupuestario).
- RIESGO INTOLERABLE (NO ACEPTABLE): Suspender inmediatamente la actividad, prohibir el trabajo, implementar control de inmediato y avisar a la MAL (Máxima Autoridad del Lugar) por correo electrónico.

5. DETERMINACIÓN Y EVALUACIÓN DE OPORTUNIDADES SST (ANEXO 3):
- Aplica a peligros con severidad Mayor o Extremo y con riesgo ya aceptable/controlado.
- Fórmula: Nivel de Oportunidad = FF (Factibilidad) × BM (Beneficio).
  FF: 1 (Baja), 2 (Media), 3 (Alta).
  BM: 1 (Bajo), 2 (Medio), 3 (Alto).
- Oportunidades Priorizadas (Altas): Puntaje >= 6 puntos (se incorporan al Programa de Gestión SST).

6. PERIODICIDAD:
- IPERO Programada: Trienal (cada 3 años), iniciando la actualización en el mes de octubre (según NTS 009/23).
- Revisión anual en años 2 y 3 con el Comité Mixto de Higiene y Seguridad Ocupacional.
`;

// BANCO OFICIAL DE 30 PREGUNTAS (SPT-GSS.SI.011)
export const FULL_QUESTION_BANK: ExamQuestion[] = [
  // PARTE I: SELECCIÓN MÚLTIPLE (1 a 15)
  {
    id: 1,
    pregunta: "1. ¿Qué significa la sigla IPERO?",
    opciones: [
      "A) Inspección Preventiva de Equipos y Ropa Ocupacional.",
      "B) Identificación de Peligros, Evaluación de Riesgos y Oportunidades SST.",
      "C) Índice de Productividad y Eficiencia en el Rubro Operativo."
    ],
    respuestaCorrecta: 1, // B
    explicacion: "IPERO corresponde a: Identificación de Peligros, Evaluación de Riesgos y Oportunidades SST.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 1 y Pág. 5"
  },
  {
    id: 2,
    pregunta: "2. ¿A qué empresas o lugares de trabajo aplica este procedimiento?",
    opciones: [
      "A) A los procesos productivos, administrativos, comerciales y lugares de trabajo de SOBOCE S.A.",
      "B) Únicamente a talleres mecánicos externos.",
      "C) Solo a contratistas de construcción civil."
    ],
    respuestaCorrecta: 0, // A
    explicacion: "Aplica a todos los procesos productivos, administrativos, comerciales y lugares de trabajo de SOBOCE S.A.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 2 Secc. 2"
  },
  {
    id: 3,
    pregunta: "3. ¿Cómo se define un 'Peligro' en seguridad y salud ocupacional?",
    opciones: [
      "A) La probabilidad de que un trabajador sufra una multa económica.",
      "B) Una fuente, situación o acto con potencial de causar daño (lesiones o enfermedades).",
      "C) El horario nocturno de trabajo en planta."
    ],
    respuestaCorrecta: 1, // B
    explicacion: "Peligro es toda fuente, situación y/o circunstancia con potencial de daño o lesiones a la salud.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 6"
  },
  {
    id: 4,
    pregunta: "4. ¿Qué es un 'Riesgo Ocupacional'?",
    opciones: [
      "A) La combinación de la probabilidad de que ocurra un suceso peligroso y la severidad del daño.",
      "B) Cualquier herramienta manual utilizada en el taller.",
      "C) El número de trabajadores en un turno."
    ],
    respuestaCorrecta: 0, // A
    explicacion: "Riesgo es la combinación de probabilidad de ocurrencia de un evento peligroso y la severidad del daño.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 6 y Pág. 26"
  },
  {
    id: 5,
    pregunta: "5. ¿Cuál es la primera opción en la Jerarquía de los Controles de Riesgos?",
    opciones: [
      "A) Usar Equipos de Protección Personal (EPP).",
      "B) Colocar letreros de advertencia y señalización.",
      "C) Eliminación o Sustitución del peligro."
    ],
    respuestaCorrecta: 2, // C
    explicacion: "La Jerarquía de Controles coloca como máxima prioridad la Eliminación o Sustitución del peligro.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 3"
  },
  {
    id: 6,
    pregunta: "6. ¿Qué son las actividades 'Rutinarias' según el procedimiento?",
    opciones: [
      "A) Actividades que se ejecutan de forma periódica, continua o frecuentemente en la operación.",
      "B) Emergencias que ocurren una vez al año por desastres naturales.",
      "C) Trabajos que se hacen únicamente los fines de semana."
    ],
    respuestaCorrecta: 0, // A
    explicacion: "Actividades rutinarias son aquellas ejecutadas de forma periódica, continua o frecuentemente.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 2"
  },
  {
    id: 7,
    pregunta: "7. ¿Qué metodología cualitativa se usa para actividades puntuales y operativas menores a 3 semanas con Permiso de Trabajo?",
    opciones: [
      "A) Auditoría financiera externa.",
      "B) El Análisis Preliminar de Riesgos e Impactos (APRI).",
      "C) Balance de masa de producción."
    ],
    respuestaCorrecta: 1, // B
    explicacion: "El APRI se aplica para actividades no rutinarias o de contratistas menores a 3 semanas de duración.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 3 y Pág. 11"
  },
  {
    id: 8,
    pregunta: "8. ¿Cada cuánto tiempo se planifica y ejecuta por norma la IPERO Programada o Trienal?",
    opciones: [
      "A) Cada mes.",
      "B) Cada año sin excepción.",
      "C) Cada 3 años (trienal), actualizándose o revisándose anualmente."
    ],
    respuestaCorrecta: 2, // C
    explicacion: "La IPERO se ejecuta trienalmente (cada 3 años) iniciando en octubre, revisándose anualmente.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 10 y NTS 009/23"
  },
  {
    id: 9,
    pregunta: "9. ¿Qué se debe hacer de inmediato si en una evaluación se identifica un riesgo 'Intolerable'?",
    opciones: [
      "A) Suspender inmediatamente el trabajo hasta reducir el riesgo.",
      "B) Continuar trabajando y avisar el próximo mes.",
      "C) Ignorarlo si la producción está retrasada."
    ],
    respuestaCorrecta: 0, // A
    explicacion: "Se debe suspender inmediatamente la actividad, aplicar controles de inmediato y avisar a la MAL.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 15 y Pág. 31"
  },
  {
    id: 10,
    pregunta: "10. ¿Quiénes deben participar obligatoriamente en la elaboración de la IPERO en cada área?",
    opciones: [
      "A) Únicamente los auditores externos internacionales.",
      "B) El equipo multidisciplinario que incluye a los trabajadores del área y supervisores.",
      "C) Solamente el departamento legal y de recursos humanos."
    ],
    respuestaCorrecta: 1, // B
    explicacion: "La IPERO la elabora un equipo multidisciplinario con participación de trabajadores in-situ del área.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 5 y Pág. 13"
  },
  {
    id: 11,
    pregunta: "11. ¿Qué es un 'Incidente' en el trabajo?",
    opciones: [
      "A) Un evento con lesión o deterioro de la salud (o que pudo tenerlo), o una emergencia.",
      "B) La compra de insumos de oficina.",
      "C) Una reunión rutinaria de gerencia."
    ],
    respuestaCorrecta: 0, // A
    explicacion: "Incidente es un suceso laboral que ocasiona o pudo haber ocasionado daño, lesión o emergencia.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 5 (ISO 45001)"
  },
  {
    id: 12,
    pregunta: "12. ¿Qué herramienta se utiliza antes de implementar cambios en instalaciones o maquinarias para identificar peligros y controles?",
    opciones: [
      "A) Check list de manejo del cambio.",
      "B) Recibo de caja chica.",
      "C) Planilla de sueldos."
    ],
    respuestaCorrecta: 0, // A
    explicacion: "Se utiliza el Check list de Manejo del Cambio (SRT-GSS.SI.011 / QPT-MCC.MC.003).",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 3 y Pág. 11"
  },
  {
    id: 13,
    pregunta: "13. ¿Cuál es el último recurso en la jerarquía de controles cuando el peligro no pudo ser eliminado o controlado de otra forma?",
    opciones: [
      "A) Controles de ingeniería.",
      "B) Dotación de Equipos de Protección Personal (EPP).",
      "C) Parar la planta definitivamente."
    ],
    respuestaCorrecta: 1, // B
    explicacion: "El EPP es la última barrera y último recurso en la jerarquía de controles.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 3"
  },
  {
    id: 14,
    pregunta: "14. ¿Qué son los EPP (Equipos de Protección Personal)?",
    opciones: [
      "A) Dispositivos o indumentaria llevados por el trabajador para protegerlo de uno o más riesgos.",
      "B) Máquinas pesadas de producción de cemento.",
      "C) Herramientas de carpintería."
    ],
    respuestaCorrecta: 0, // A
    explicacion: "Son elementos e indumentaria que porta el trabajador para su resguardo frente a riesgos residuales.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 30"
  },
  {
    id: 15,
    pregunta: "15. ¿Por qué es importante la participación de los trabajadores operativos en la IPERO?",
    opciones: [
      "A) Porque conocen a detalle las condiciones reales y peligros de su puesto de trabajo diario.",
      "B) Porque es un requisito para salir de vacaciones.",
      "C) Para cumplir una tarea administrativa sin importancia."
    ],
    respuestaCorrecta: 0, // A
    explicacion: "Los trabajadores operativos conocen las condiciones reales in-situ y riesgos diarios de su puesto.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 13 Nota 2"
  },

  // PARTE II: FALSO O VERDADERO (16 a 30)
  {
    id: 16,
    pregunta: "16. El propósito del procedimiento IPERO incluye establecer directrices para la identificación de peligros y evaluación de riesgos SST.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 0, // V
    explicacion: "Verdadero. El propósito formal es establecer directrices para gestión de riesgos y oportunidades SST.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 2 Secc. 1"
  },
  {
    id: 17,
    pregunta: "17. Las actividades rutinarias son aquellas que ocurren de manera extraordinaria, imprevista o en situaciones de emergencia.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 1, // F
    explicacion: "Falso. Esas corresponden a las actividades NO rutinarias. Las rutinarias son continuas o periódicas.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 2"
  },
  {
    id: 18,
    pregunta: "18. El Análisis Preliminar de Riesgos (APRI) se aplica en actividades no rutinarias de corta duración menores a tres semanas.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 0, // V
    explicacion: "Verdadero. El APRI se aplica para actividades y contratistas de menos de 3 semanas.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 3 y Pág. 11"
  },
  {
    id: 19,
    pregunta: "19. Los Equipos de Protección Personal (EPP) tienen mayor prioridad en la Jerarquía de Control que la Eliminación o Sustitución.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 1, // F
    explicacion: "Falso. La Eliminación y Sustitución tienen la máxima prioridad; el EPP es la última opción.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 3"
  },
  {
    id: 20,
    pregunta: "20. La IPERO Programada o Trienal se actualiza y ejecuta con una periodicidad general de cada 3 años.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 0, // V
    explicacion: "Verdadero. Se ejecuta cada 3 años (trienal) según la norma NTS 009/23.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 10 Secc. 6.1.2 a)"
  },
  {
    id: 21,
    pregunta: "21. Si durante una evaluación de riesgos se identifica un nivel 'Intolerable', se debe suspender inmediatamente el trabajo.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 0, // V
    explicacion: "Verdadero. No debe empezar ni continuar el trabajo hasta que se reduzca el riesgo.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 15 y Pág. 31"
  },
  {
    id: 22,
    pregunta: "22. La participación de los trabajadores del área operativa no es necesaria ni obligatoria durante la ejecución de la IPERO.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 1, // F
    explicacion: "Falso. Es obligatorio que participe personal operativo in-situ del área.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 13 Nota 2"
  },
  {
    id: 23,
    pregunta: "23. Un incidente incluye tanto a los sucesos sin lesión (cuasi-accidentes) como a los accidentes con lesión o deterioro de la salud.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 0, // V
    explicacion: "Verdadero. En SOBOCE se clasifican en incidentes sin lesión (cuasi-accidentes) y con lesión (accidentes).",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 5"
  },
  {
    id: 24,
    pregunta: "24. El Check list de manejo del cambio se utiliza para identificar peligros y oportunidades SST antes de implementar cambios en equipos o instalaciones.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 0, // V
    explicacion: "Verdadero. Sirve para evaluar previamente cambios en instalaciones, equipos, maquinarias o sistemas.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 3 y Pág. 11"
  },
  {
    id: 25,
    pregunta: "25. Los riesgos evaluados como 'triviales' o 'bajos' se consideran riesgos aceptables dentro del sistema de gestión de SOBOCE S.A.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 0, // V
    explicacion: "Verdadero. En SOBOCE S.A. son riesgos aceptables los evaluados como triviales y bajos.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 7 y Pág. 31"
  },
  {
    id: 26,
    pregunta: "26. Los controles de ingeniería (como resguardos, barandas y sistemas de ventilación) son considerados controles duros y eficaces.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 0, // V
    explicacion: "Verdadero. Son controles autónomos o duros que funcionan independientemente de la conducta humana.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 4 y Pág. 30"
  },
  {
    id: 27,
    pregunta: "27. Las actividades no rutinarias largas mayores a tres semanas se cubren mediante la IPERO No Planeada o Anticipada.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 0, // V
    explicacion: "Verdadero. Si la duración es mayor a tres semanas se realiza IPERO no planeada o anticipada.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 3 y Pág. 10"
  },
  {
    id: 28,
    pregunta: "28. Los Programas de Gestión de Seguridad y Salud Ocupacional (PG SST) se elaboran sin tomar en cuenta los resultados de la IPERO.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 1, // F
    explicacion: "Falso. El PG SST se elabora obligatoriamente con base en los resultados de la IPERO y riesgos no aceptables.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 16"
  },
  {
    id: 29,
    pregunta: "29. El supervisor o jefe de área es responsable de liderar la identificación de peligros y asegurar la implementación de controles en su zona.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 0, // V
    explicacion: "Verdadero. Es responsabilidad del dueño natural o jefe de área liderar la identificación y controles.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 7 y Pág. 13"
  },
  {
    id: 30,
    pregunta: "30. Los EPPs se pueden utilizar como única medida de control permanente sin importar que el peligro pueda ser eliminado.",
    opciones: [
      "A) Verdadero (V)",
      "B) Falso (F)"
    ],
    respuestaCorrecta: 1, // F
    explicacion: "Falso. Siempre se debe buscar primero eliminar, sustituir o aplicar controles de ingeniería.",
    articuloReferencia: "Procedimiento SPT-GSS.SI.011, Pág. 3 y Pág. 31"
  }
];

// Helper to get 10 random questions from the official bank of 30
export function getRandomExamQuestions(count = 10): ExamQuestion[] {
  const shuffled = [...FULL_QUESTION_BANK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Default 10 questions for initial SSR/fallback
export const EXAM_QUESTIONS = FULL_QUESTION_BANK.slice(0, 10);

export const SUGGESTED_BOT_QUESTIONS = [
  "¿Cuáles son los controles duros (autónomos) y blandos?",
  "¿Cómo se calcula la fórmula de probabilidad P = INPE + IFDE + ICO?",
  "¿Cuándo se debe aplicar un APRI en lugar de una IPERO trienal?",
  "¿Qué acciones se toman si un riesgo resulta Intolerable?",
  "¿Cómo se priorizan las Oportunidades SST (fórmula FF * BM)?",
  "¿Cuál es el orden de la Jerarquía de Controles?",
];

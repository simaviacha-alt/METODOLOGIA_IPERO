// Google Sheets API Service for Induction Platform

export const DEFAULT_SPREADSHEET_ID = '1vII8qox6tkwh_Z8MhjmIhXOSncm7NT7x6gbeHFsV7JE';
export const DEFAULT_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1vII8qox6tkwh_Z8MhjmIhXOSncm7NT7x6gbeHFsV7JE/edit?gid=0#gid=0';

export const SHEET_COLUMNS = [
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

export interface SheetSyncResult {
  success: boolean;
  message?: string;
  updatedRows?: number;
  spreadsheetTitle?: string;
  sheetName?: string;
}

/**
 * Sync all platform rows to the designated Google Spreadsheet
 */
export async function syncRowsToGoogleSheet(
  spreadsheetId: string,
  accessToken: string,
  dataRows: (string | number)[][]
): Promise<SheetSyncResult> {
  if (!spreadsheetId || !accessToken) {
    throw new Error('ID de la hoja de cálculo y token de Google son obligatorios.');
  }

  // 1. Fetch spreadsheet metadata to get the first sheet's title and sheetId
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!metaRes.ok) {
    const errorBody = await metaRes.text();
    console.error('Error fetching Google Sheet metadata:', errorBody);
    throw new Error(`Error al acceder a Google Sheet (${metaRes.status}): Verifica permisos de edición en la cuenta conectada.`);
  }

  const metaData = await metaRes.json();
  const sheets = metaData.sheets || [];
  if (sheets.length === 0) {
    throw new Error('La hoja de cálculo no contiene pestañas.');
  }

  const firstSheet = sheets[0];
  const sheetTitle = firstSheet.properties?.title || 'Hoja 1';
  const sheetId = firstSheet.properties?.sheetId || 0;

  // 2. Prepare values: Header row + Data rows
  const allRows = [SHEET_COLUMNS, ...dataRows];

  // 3. Clear existing values to prevent orphan rows
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:Z5000:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (clearErr) {
    console.warn('Clear non-fatal error:', clearErr);
  }

  // 4. Write all rows starting from A1
  const updateRange = `${sheetTitle}!A1:M${allRows.length}`;
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: updateRange,
        majorDimension: 'ROWS',
        values: allRows,
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    console.error('Error updating values in Google Sheet:', errText);
    throw new Error(`Error al escribir en Google Sheet: ${errText}`);
  }

  // 5. Apply header styling & freeze top row for high readability
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Format Header Row (Dark blue background #003366, Bold white text, Center aligned)
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
                  backgroundColor: { red: 0.0, green: 0.2, blue: 0.4 },
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    bold: true,
                    fontSize: 10,
                  },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                  wrapStrategy: 'WRAP',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
            },
          },
          // Freeze top row
          {
            updateSheetProperties: {
              properties: {
                sheetId,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
        ],
      }),
    });
  } catch (styleErr) {
    // Non-fatal, data is already written
    console.warn('Batch update formatting warning:', styleErr);
  }

  return {
    success: true,
    updatedRows: dataRows.length,
    spreadsheetTitle: metaData.properties?.title || 'Hoja de Inducción SST',
    sheetName: sheetTitle,
  };
}

import crypto from 'node:crypto';
import type { LeadRecord, OrderRecord, PaymentRecord, SiteConfigRecord } from './store';

export interface GoogleSheetsResolvedConfig {
  sheetId: string;
  sheetTab: string;
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
  appsScriptWebhookUrl: string;
  mode: 'sheets-api' | 'apps-script' | 'unconfigured';
}

export interface GoogleSheetSyncResult {
  synced: boolean;
  provider?: 'sheets-api' | 'apps-script';
  error?: string;
}

const LEAD_HEADERS = [
  'Lead ID',
  'Created At',
  'Name',
  'Phone',
  'Email',
  'Goal',
  'Age',
  'Gender',
  'Height (cm)',
  'Weight (kg)',
  'Diet Type',
  'Status',
  'Source',
];

const LEAD_COLUMN_WIDTHS = [210, 170, 150, 130, 210, 120, 70, 105, 115, 115, 165, 125, 140];
const PAYMENT_HEADERS = [
  'Order ID',
  'Razorpay Order ID',
  'Payment ID',
  'Buyer Name',
  'Mobile Number',
  'Email',
  'Plan Purchased',
  'Amount (INR)',
  'Payment Status',
  'Order Status',
  'Latest Attempt',
  'Payment Method',
  'Order Time (IST)',
  'Payment Time (IST)',
  'Attempt Time (IST)',
];
const PAYMENT_COLUMN_WIDTHS = [
  150, 190, 185, 165, 140, 220, 165, 140, 145, 130, 185, 145, 205, 205, 205,
];

interface SheetLayout {
  headers: string[];
  columnWidths: number[];
  statusColumn?: number;
  currencyColumn?: number;
  centeredColumns?: Array<{ start: number; end: number }>;
  createIfMissing?: boolean;
}

function columnLabel(columnNumber: number): string {
  let number = columnNumber;
  let label = '';
  while (number > 0) {
    const remainder = (number - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    number = Math.floor((number - 1) / 26);
  }
  return label;
}

function normalizePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, '\n').trim();
}

function formatIstTimestamp(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const fields = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  return `${fields.day}/${fields.month}/${fields.year} ${fields.hour}:${fields.minute}:${fields.second} ${fields.dayPeriod?.toUpperCase()} IST`;
}

function paymentSheetRow(order: OrderRecord, payments: PaymentRecord[]): Array<string | number> {
  const latestPayment = payments
    .filter((payment) => payment.orderId === order.id)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0];
  const attemptStatus = latestPayment
    ? latestPayment.status === 'reported_failed'
      ? 'Reported failure (unverified)'
      : latestPayment.status === 'failed'
        ? 'Failed'
        : latestPayment.status === 'captured' || latestPayment.captured
          ? 'Captured'
          : 'Unknown'
    : 'No attempt';

  return [
    order.id,
    order.razorpayOrderId,
    latestPayment?.status === 'reported_failed' ? '' : latestPayment?.razorpayPaymentId || '',
    order.customerName,
    order.customerPhone,
    order.customerEmail || '',
    order.productName,
    order.amountPaise / 100,
    order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1),
    order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1),
    attemptStatus,
    latestPayment?.method || '',
    formatIstTimestamp(order.createdAt),
    formatIstTimestamp(order.paidAt),
    formatIstTimestamp(latestPayment?.createdAt),
  ];
}

function appsScriptResponseError(responseText: string): string | undefined {
  try {
    const response = JSON.parse(responseText) as { ok?: boolean; error?: string };
    return response.ok === false
      ? response.error || 'Google Apps Script reported a sync error.'
      : undefined;
  } catch {
    return undefined;
  }
}

export function resolveGoogleSheetsConfig(
  siteConfig?: SiteConfigRecord,
): GoogleSheetsResolvedConfig {
  const gs = siteConfig?.googleSheets;

  const sheetId = (gs?.sheetId || process.env.GOOGLE_SHEET_ID || '').trim();
  const sheetTab = (gs?.sheetTab || process.env.GOOGLE_SHEET_TAB || 'Leads').trim() || 'Leads';
  const serviceAccountEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim();
  const serviceAccountPrivateKey = normalizePrivateKey(
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '',
  );
  const appsScriptWebhookUrl = (
    process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL || ''
  ).trim();

  let mode: GoogleSheetsResolvedConfig['mode'] = 'unconfigured';
  if (sheetId && serviceAccountEmail && serviceAccountPrivateKey) {
    mode = 'sheets-api';
  } else if (appsScriptWebhookUrl) {
    mode = 'apps-script';
  }

  return {
    sheetId,
    sheetTab,
    serviceAccountEmail,
    serviceAccountPrivateKey,
    appsScriptWebhookUrl,
    mode,
  };
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getGoogleAccessToken(
  serviceAccountEmail: string,
  privateKey: string,
): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: nowSec + 3600,
      iat: nowSec,
    }),
  );

  const signingInput = `${header}.${claimSet}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = base64UrlEncode(signer.sign(privateKey));
  const jwt = `${signingInput}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google OAuth token error (${tokenRes.status}): ${errText.slice(0, 180)}`);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error('Google OAuth token response missing access_token');
  }
  return tokenData.access_token;
}

async function ensureFormattedSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetTab: string,
  layout: SheetLayout,
): Promise<number> {
  const { headers, columnWidths, statusColumn, currencyColumn, centeredColumns = [] } = layout;
  const columnCount = headers.length;
  if (columnWidths.length !== columnCount) {
    throw new Error(`Column widths do not match the "${sheetTab}" sheet headers.`);
  }
  const endColumn = columnLabel(columnCount);

  const spreadsheetUrl =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `?fields=properties(title),sheets(properties(sheetId,title,gridProperties(rowCount,columnCount)),bandedRanges)`;
  const metaRes = await fetch(spreadsheetUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!metaRes.ok) {
    const message = await metaRes.text();
    throw new Error(`Could not read spreadsheet metadata (${metaRes.status}): ${message.slice(0, 220)}`);
  }

  const metadata = (await metaRes.json()) as {
    sheets?: Array<{
      properties?: {
        sheetId?: number;
        title?: string;
        gridProperties?: { rowCount?: number; columnCount?: number };
      };
      bandedRanges?: Array<{ bandedRangeId?: number }>;
    }>;
  };
  let tab = metadata.sheets?.find((item) => item.properties?.title === sheetTab);
  if (!tab && layout.createIfMissing) {
    const createRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            addSheet: {
              properties: {
                title: sheetTab,
                gridProperties: {
                  rowCount: 1000,
                  columnCount,
                  frozenRowCount: 1,
                  frozenColumnCount: 2,
                },
              },
            },
          }],
        }),
      },
    );
    if (!createRes.ok) {
      const message = await createRes.text();
      throw new Error(`Could not create "${sheetTab}" sheet (${createRes.status}): ${message.slice(0, 220)}`);
    }
    const created = (await createRes.json()) as {
      replies?: Array<{ addSheet?: { properties?: { sheetId?: number } } }>;
    };
    const createdSheetId = created.replies?.[0]?.addSheet?.properties?.sheetId;
    if (typeof createdSheetId !== 'number') {
      throw new Error(`Google Sheets did not return an ID for the new "${sheetTab}" sheet.`);
    }
    tab = {
      properties: {
        sheetId: createdSheetId,
        title: sheetTab,
        gridProperties: { rowCount: 1000, columnCount },
      },
      bandedRanges: [],
    };
  }
  if (!tab || typeof tab.properties?.sheetId !== 'number') {
    const available = metadata.sheets?.map((item) => item.properties?.title).filter(Boolean).join(', ');
    throw new Error(`Tab "${sheetTab}" was not found. Available tabs: ${available || 'none'}`);
  }

  const sheetId = tab.properties.sheetId;
  const gridRowCount = tab.properties.gridProperties?.rowCount || 0;
  const gridColumnCount = tab.properties.gridProperties?.columnCount || 0;
  const resizeRequests: unknown[] = [];
  if (gridRowCount < 1000) {
    resizeRequests.push({
      appendDimension: {
        sheetId,
        dimension: 'ROWS',
        length: 1000 - gridRowCount,
      },
    });
  }
  if (gridColumnCount < columnCount) {
    resizeRequests.push({
      appendDimension: {
        sheetId,
        dimension: 'COLUMNS',
        length: columnCount - gridColumnCount,
      },
    });
  }
  if (resizeRequests.length) {
    const resizeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: resizeRequests }),
      },
    );
    if (!resizeRes.ok) {
      const message = await resizeRes.text();
      throw new Error(`Could not prepare spreadsheet dimensions (${resizeRes.status}): ${message.slice(0, 220)}`);
    }
  }

  const quotedSheetTab = `'${sheetTab.replace(/'/g, "''")}'`;
  const valuesRange = encodeURIComponent(`${quotedSheetTab}!A1:${endColumn}1`);
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${valuesRange}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!valuesRes.ok) {
    const message = await valuesRes.text();
    throw new Error(`Could not read header row (${valuesRes.status}): ${message.slice(0, 180)}`);
  }
  const valuesData = (await valuesRes.json()) as { values?: string[][] };
  if (!valuesData.values?.[0]?.length) {
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${valuesRange}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [headers] }),
      },
    );
    if (!writeRes.ok) {
      const message = await writeRes.text();
      throw new Error(`Could not create header row (${writeRes.status}): ${message.slice(0, 180)}`);
    }
  }

  const requests: unknown[] = [];

  requests.push(
    {
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: { frozenRowCount: 1, frozenColumnCount: 2 },
        },
        fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 0, endColumnIndex: columnCount },
        cell: {
          userEnteredFormat: {
            textFormat: {
              foregroundColor: { red: 0.18, green: 0.22, blue: 0.29 },
              fontFamily: 'Arial',
              fontSize: 10,
            },
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(textFormat,verticalAlignment,wrapStrategy)',
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.09, green: 0.17, blue: 0.30 },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontFamily: 'Arial',
              fontSize: 11,
            },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,wrapStrategy,textFormat)',
      },
    },
    {
      updateBorders: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: columnCount },
        bottom: {
          style: 'SOLID_MEDIUM',
          color: { red: 0.96, green: 0.47, blue: 0.09 },
        },
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 46 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: 'ROWS', startIndex: 1, endIndex: 1000 },
        properties: { pixelSize: 38 },
        fields: 'pixelSize',
      },
    },
    {
      autoResizeDimensions: {
        dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: columnCount },
      },
    },
    ...columnWidths.map((pixelSize, index) => ({
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: index, endIndex: index + 1 },
        properties: { pixelSize },
        fields: 'pixelSize',
      },
    })),
  );

  for (const range of centeredColumns) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 1000,
          startColumnIndex: range.start,
          endColumnIndex: range.end,
        },
        cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
        fields: 'userEnteredFormat.horizontalAlignment',
      },
    });
  }

  if (statusColumn !== undefined) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 1000,
          startColumnIndex: statusColumn,
          endColumnIndex: statusColumn + 1,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1, green: 0.95, blue: 0.88 },
            textFormat: {
              foregroundColor: { red: 0.55, green: 0.25, blue: 0.07 },
              bold: true,
              fontFamily: 'Arial',
            },
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
      },
    });
  }

  if (currencyColumn !== undefined) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 1000,
          startColumnIndex: currencyColumn,
          endColumnIndex: currencyColumn + 1,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: { type: 'CURRENCY', pattern: '₹#,##,##0.00' },
            horizontalAlignment: 'RIGHT',
          },
        },
        fields: 'userEnteredFormat(numberFormat,horizontalAlignment)',
      },
    });
  }

  requests.push({
    setBasicFilter: {
      filter: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1000, startColumnIndex: 0, endColumnIndex: columnCount },
      },
    },
  });

  // Add alternating row colors only once, so each sync does not stack banding rules.
  if (!tab.bandedRanges?.length) {
    requests.push({
      addBanding: {
        bandedRange: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1000, startColumnIndex: 0, endColumnIndex: columnCount },
          rowProperties: {
            headerColor: { red: 0.09, green: 0.17, blue: 0.30 },
            firstBandColor: { red: 1, green: 1, blue: 1 },
            secondBandColor: { red: 0.96, green: 0.97, blue: 0.99 },
          },
        },
      },
    });
  }

  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    },
  );
  if (!batchRes.ok) {
    const message = await batchRes.text();
    throw new Error(`Could not format spreadsheet (${batchRes.status}): ${message.slice(0, 220)}`);
  }
  return sheetId;
}

async function ensureSheetHeaderRow(
  accessToken: string,
  spreadsheetId: string,
  sheetTab: string,
): Promise<number> {
  return ensureFormattedSheet(accessToken, spreadsheetId, sheetTab, {
    headers: LEAD_HEADERS,
    columnWidths: LEAD_COLUMN_WIDTHS,
    statusColumn: 11,
    centeredColumns: [{ start: 5, end: 10 }],
  });
}

async function ensurePaymentSheet(
  accessToken: string,
  spreadsheetId: string,
): Promise<number> {
  return ensureFormattedSheet(accessToken, spreadsheetId, 'Payments', {
    headers: PAYMENT_HEADERS,
    columnWidths: PAYMENT_COLUMN_WIDTHS,
    statusColumn: 8,
    currencyColumn: 7,
    centeredColumns: [{ start: 6, end: 7 }, { start: 8, end: 12 }],
    createIfMissing: true,
  });
}

export async function syncOrderToGoogleSheet(
  order: OrderRecord,
  payments: PaymentRecord[],
  siteConfig?: SiteConfigRecord,
): Promise<GoogleSheetSyncResult> {
  const cfg = resolveGoogleSheetsConfig(siteConfig);
  if (cfg.mode === 'unconfigured') {
    return { synced: false, error: 'Google Sheets credentials not configured.' };
  }

  const row = paymentSheetRow(order, payments);
  try {
    if (cfg.mode === 'sheets-api') {
      const accessToken = await getGoogleAccessToken(
        cfg.serviceAccountEmail,
        cfg.serviceAccountPrivateKey,
      );
      await ensurePaymentSheet(accessToken, cfg.sheetId);

      const idRange = encodeURIComponent("'Payments'!A2:A");
      const idRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(cfg.sheetId)}/values/${idRange}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!idRes.ok) {
        const message = await idRes.text();
        throw new Error(`Could not find payment row (${idRes.status}): ${message.slice(0, 180)}`);
      }
      const idData = (await idRes.json()) as { values?: string[][] };
      const existingIndex = idData.values?.findIndex(([id]) => id === order.id) ?? -1;
      const quotedRange = existingIndex >= 0
        ? encodeURIComponent(`'Payments'!A${existingIndex + 2}:O${existingIndex + 2}`)
        : encodeURIComponent("'Payments'!A:O");
      const writeUrl = existingIndex >= 0
        ? `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(cfg.sheetId)}/values/${quotedRange}?valueInputOption=USER_ENTERED`
        : `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(cfg.sheetId)}/values/${quotedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      const writeRes = await fetch(writeUrl, {
        method: existingIndex >= 0 ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [row] }),
      });
      if (!writeRes.ok) {
        const message = await writeRes.text();
        throw new Error(`Could not sync payment row (${writeRes.status}): ${message.slice(0, 180)}`);
      }
      return { synced: true, provider: 'sheets-api' };
    }

    const hookRes = await fetch(cfg.appsScriptWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordType: 'payment',
        sheetTab: 'Payments',
        values: row,
        orderId: order.id,
      }),
    });
    const responseText = await hookRes.text();
    const hookError = !hookRes.ok
      ? `Webhook returned HTTP ${hookRes.status}`
      : appsScriptResponseError(responseText);
    if (hookError) {
      return { synced: false, provider: 'apps-script', error: hookError };
    }
    return { synced: true, provider: 'apps-script' };
  } catch (err) {
    return {
      synced: false,
      provider: cfg.mode === 'sheets-api' ? 'sheets-api' : 'apps-script',
      error: err instanceof Error ? err.message : 'Google Sheets payment sync failed',
    };
  }
}

export async function appendLeadToGoogleSheet(
  lead: LeadRecord,
  siteConfig?: SiteConfigRecord,
): Promise<GoogleSheetSyncResult> {
  const cfg = resolveGoogleSheetsConfig(siteConfig);
  if (cfg.mode === 'unconfigured') {
    return { synced: false, error: 'Google Sheets credentials not configured.' };
  }

  try {
    if (cfg.mode === 'sheets-api') {
      const accessToken = await getGoogleAccessToken(
        cfg.serviceAccountEmail,
        cfg.serviceAccountPrivateKey,
      );

      await ensureSheetHeaderRow(accessToken, cfg.sheetId, cfg.sheetTab);

      const range = encodeURIComponent(`'${cfg.sheetTab.replace(/'/g, "''")}'!A:M`);
      const row = [
        lead.id,
        lead.createdAt,
        lead.name,
        lead.phone,
        lead.email || '',
        lead.goal === 'fatloss' ? 'Fat Loss' : 'Weight Gain',
        lead.age ?? '',
        lead.gender || '',
        lead.heightCm ?? '',
        lead.weightKg ?? '',
        lead.dietPreference || '',
        lead.purchased ? 'Paid' : 'New Lead',
        lead.source,
      ];

      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
          cfg.sheetId,
        )}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [row] }),
        },
      );

      if (!appendRes.ok) {
        const errText = await appendRes.text();
        return {
          synced: false,
          provider: 'sheets-api',
          error: `Sheets API error (${appendRes.status}): ${errText.slice(0, 180)}`,
        };
      }

      return { synced: true, provider: 'sheets-api' };
    }

    // Google Apps Script Webhook mode
    const hookRes = await fetch(cfg.appsScriptWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetTab: cfg.sheetTab,
        id: lead.id,
        createdAt: lead.createdAt,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        goal: lead.goal === 'fatloss' ? 'Fat Loss' : 'Weight Gain',
        age: lead.age ?? '',
        gender: lead.gender || '',
        heightCm: lead.heightCm ?? '',
        weightKg: lead.weightKg ?? '',
        dietPreference: lead.dietPreference || '',
        purchased: lead.purchased ? 'Paid' : 'New Lead',
        source: lead.source,
      }),
    });

    const hookResponseText = await hookRes.text();
    const hookError = !hookRes.ok
      ? `Webhook returned HTTP ${hookRes.status}`
      : appsScriptResponseError(hookResponseText);
    if (hookError) {
      return {
        synced: false,
        provider: 'apps-script',
        error: hookError,
      };
    }

    return { synced: true, provider: 'apps-script' };
  } catch (err) {
    return {
      synced: false,
      provider: cfg.mode === 'sheets-api' ? 'sheets-api' : 'apps-script',
      error: err instanceof Error ? err.message : 'Google Sheets sync failed',
    };
  }
}

export async function testGoogleSheetConnection(
  siteConfig?: SiteConfigRecord,
): Promise<GoogleSheetSyncResult & { sheetTitle?: string }> {
  const cfg = resolveGoogleSheetsConfig(siteConfig);
  if (cfg.mode === 'unconfigured') {
    return {
      synced: false,
      error:
        'Kripya Google Sheet ID + Service Account credentials ya Apps Script Webhook URL configure karein.',
    };
  }

  try {
    if (cfg.mode === 'sheets-api') {
      const accessToken = await getGoogleAccessToken(
        cfg.serviceAccountEmail,
        cfg.serviceAccountPrivateKey,
      );
      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
          cfg.sheetId,
        )}?fields=properties.title`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!metaRes.ok) {
        const txt = await metaRes.text();
        return {
          synced: false,
          provider: 'sheets-api',
          error: `Spreadsheet access failed (${metaRes.status}): ${txt.slice(0, 180)}`,
        };
      }
      const meta = (await metaRes.json()) as { properties?: { title?: string } };
      await ensureSheetHeaderRow(accessToken, cfg.sheetId, cfg.sheetTab);
      return {
        synced: true,
        provider: 'sheets-api',
        sheetTitle: meta.properties?.title || cfg.sheetId,
      };
    }

    const res = await fetch(cfg.appsScriptWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test: true,
        source: 'admin_connection_test',
        sheetTab: cfg.sheetTab,
      }),
    });
    const responseText = await res.text();
    const webhookError = !res.ok
      ? `Apps Script Webhook HTTP ${res.status}`
      : appsScriptResponseError(responseText);
    if (webhookError) {
      return {
        synced: false,
        provider: 'apps-script',
        error: webhookError,
      };
    }
    return { synced: true, provider: 'apps-script', sheetTitle: 'Apps Script Webhook' };
  } catch (err) {
    return {
      synced: false,
      error: err instanceof Error ? err.message : 'Connection test failed',
    };
  }
}

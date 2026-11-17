import fs from 'node:fs';
import path from 'node:path';
import type { GoalSlug } from './store';

const PRIVATE_PDF_DIR = path.resolve(process.cwd(), 'private-pdfs');

function ensurePrivateDir(): void {
  if (!fs.existsSync(PRIVATE_PDF_DIR)) {
    fs.mkdirSync(PRIVATE_PDF_DIR, { recursive: true });
  }
}

function escapePdfText(input: string): string {
  return input
    .replace(/[^\x20-\x7E]/g, (ch) => {
      if (ch === '₹') return 'Rs.';
      if (ch === '—' || ch === '–') return '-';
      if (ch === '•') return '*';
      return ' ';
    })
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) current = word;
    else if (current.length + 1 + word.length <= maxChars) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function assemblePdf(pagesContent: string[]): Buffer {
  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  const pageObjStart = 5;
  const kidsRefs = pagesContent.map((_, idx) => `${pageObjStart + idx * 2} 0 R`).join(' ');
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsRefs}] /Count ${pagesContent.length} >>\nendobj\n`);
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');

  pagesContent.forEach((stream, idx) => {
    const pageId = pageObjStart + idx * 2;
    const contentId = pageId + 1;
    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`,
    );
    objects.push(`${contentId} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

function buildGoalPdfBuffer(goal: GoalSlug): Buffer {
  const isFatLoss = goal === 'fatloss';
  const title = isFatLoss ? 'FAT LOSS DIET PLAN' : 'WEIGHT GAIN DIET PLAN';
  const subtitle = isFatLoss
    ? 'Simple Hinglish Guide - Ghar Ka Khaana & Portion Discipline'
    : 'Simple Hinglish Guide - Healthy Surplus & Affordable Indian Meals';

  const p1: string[] = [];
  p1.push('0.05 0.05 0.06 rg 0 725 595 117 re f');
  p1.push('0.96 0.47 0.09 rg 0 722 595 3 re f');
  p1.push('BT /F2 11 Tf 0.96 0.47 0.09 rg 42 806 Td (SANTOSH YADAV FITNESS) Tj ET');
  p1.push(`BT /F2 24 Tf 1 1 1 rg 42 776 Td (${escapePdfText(title)}) Tj ET`);
  p1.push(`BT /F1 10.5 Tf 0.84 0.81 0.78 rg 42 750 Td (${escapePdfText(subtitle)}) Tj ET`);

  p1.push('0.96 0.92 0.87 rg 42 630 511 74 re f');
  p1.push('BT /F2 11 Tf 0.13 0.10 0.08 rg 56 684 Td (GUIDE OVERVIEW & GENERAL NUTRITION NOTICE) Tj ET');
  const noteLines = wrapText(
    'Yeh ek goal-based Indian diet guide hai jo ghar ke simple khaane par based hai. Koi medical diagnosis nahi hai; kisi bhi bimari ya allergy mein doctor se salah lein.',
    88,
  );
  let ny = 665;
  for (const line of noteLines) {
    p1.push(`BT /F1 9.5 Tf 0.30 0.25 0.22 rg 56 ${ny} Td (${escapePdfText(line)}) Tj ET`);
    ny -= 14;
  }

  p1.push('BT /F2 13 Tf 0.13 0.10 0.08 rg 42 598 Td (DAILY MEAL SCHEDULE (HINGLISH EDITION)) Tj ET');
  p1.push('0.85 0.80 0.75 RG 0.8 w 42 590 m 553 590 l S');

  const meals = isFatLoss
    ? [
        ['07:00 AM - Morning Start', '500ml gunguna paani + 5 bheege badam. Chai/coffee bina cheeni.'],
        ['08:30 AM - Breakfast', '2 Moong dal chilla pudina chutney ke saath + 150g low-fat dahi (Swap: 3 egg whites + 2 multigrain bread).'],
        ['11:30 AM - Mid-Morning', '1 Seasonal fruit (apple/guava) + 1 glass chaas roasted jeera ke saath.'],
        ['01:30 PM - Lunch (Ghar ka)', '2 Whole wheat roti + 1 katori dal + 100g paneer/chicken + kachumber salad.'],
        ['05:00 PM - Pre-Workout', '1 Black coffee + 30g roasted makhana ya 1 chhota kela.'],
        ['08:00 PM - Dinner', '50g boiled soya chunks ya 120g grilled paneer/chicken + 1 roti + hari sabzi.'],
      ]
    : [
        ['07:00 AM - Morning Start', '500ml paani + 1 kela + 8 bheege badam aur 4 kaju.'],
        ['08:30 AM - Breakfast', '80g oats 300ml full-cream doodh mein + 2 uble ande ya 75g paneer bhurji.'],
        ['11:30 AM - Mid-Morning Shake', '300ml doodh + 1 kela + 2 tbsp peanut butter shake.'],
        ['01:30 PM - Lunch (Ghar ka)', '3 Roti + 150g chawal + 1.5 katori dal/rajma + 150g paneer/chicken sabzi + dahi.'],
        ['05:00 PM - Pre-Workout', '2 Uble aalu (150g) sendha namak ke saath + 1 kela.'],
        ['08:30 PM - Dinner', '2-3 Roti + 100g chawal + 150g paneer/egg curry + salad.'],
      ];

  let y = 564;
  for (const [heading, desc] of meals) {
    p1.push(`BT /F2 10.5 Tf 0.96 0.47 0.09 rg 42 ${y} Td (${escapePdfText(heading)}) Tj ET`);
    y -= 15;
    for (const line of wrapText(desc, 88)) {
      p1.push(`BT /F1 10 Tf 0.15 0.13 0.11 rg 52 ${y} Td (${escapePdfText(line)}) Tj ET`);
      y -= 14;
    }
    p1.push(`0.92 0.88 0.84 RG 0.5 w 42 ${y + 2} m 553 ${y + 2} l S`);
    y -= 14;
  }

  p1.push('BT /F1 8.5 Tf 0.45 0.40 0.36 rg 42 28 Td (Santosh Yadav Fitness | Goal-Based Indian Nutrition Guide | Page 1 of 2) Tj ET');

  const p2: string[] = [];
  p2.push('0.05 0.05 0.06 rg 0 770 595 72 re f');
  p2.push('0.96 0.47 0.09 rg 0 767 595 3 re f');
  p2.push('BT /F2 16 Tf 1 1 1 rg 42 800 Td (FOOD SWAP LIST, MEAL TIMINGS & COMMON MISTAKES) Tj ET');
  p2.push('BT /F1 10 Tf 0.82 0.79 0.76 rg 42 782 Td (Consistency banao, mehengi supplements ki zarurat nahi hai) Tj ET');

  const blocks = [
    [
      '1. BUDGET-FRIENDLY INDIAN PROTEIN SWAPS',
      'Paneer (100g) | Soya Chunks (50g raw) | Whole Eggs & Egg Whites | Moong Dal + Chana | Thick Homemade Dahi.',
    ],
    [
      '2. MEAL TIMING TIPS',
      'Subah uthne ke 60 min ke andar nashta lein. Workout se 45-60 min pehle light carbs aur dinner sone se 2 ghante pehle complete karein.',
    ],
    [
      '3. COMMON MISTAKES JO RESULTS SLOW KARTE HAIN',
      '1) Bina naape cooking oil/ghee daalna. 2) Hafte bhar skip karke weekend par overeating karna. 3) Meethi chai aur cold drinks se hidden calories lena. 4) Roz subah weight dekh kar demotivate hona.',
    ],
    [
      '4. SUPPORT & DISCLAIMER',
      'Yeh PDF sirf general educational information ke liye hai. Koi sawaal ho toh humare WhatsApp support par apna Order ID bhej kar pooch sakte hain.',
    ],
  ];

  let y2 = 728;
  for (const [h, body] of blocks) {
    p2.push(`BT /F2 11.5 Tf 0.96 0.47 0.09 rg 42 ${y2} Td (${escapePdfText(h)}) Tj ET`);
    y2 -= 18;
    for (const line of wrapText(body, 88)) {
      p2.push(`BT /F1 10 Tf 0.16 0.14 0.12 rg 48 ${y2} Td (${escapePdfText(line)}) Tj ET`);
      y2 -= 15;
    }
    y2 -= 18;
  }

  p2.push('BT /F1 8.5 Tf 0.45 0.40 0.36 rg 42 28 Td (Santosh Yadav Fitness | Goal-Based Indian Nutrition Guide | Page 2 of 2) Tj ET');

  return assemblePdf([p1.join('\n'), p2.join('\n')]);
}

export function getOrCreatePrivatePdf(goal: GoalSlug, filename: string): Buffer {
  ensurePrivateDir();
  const safeName = path.basename(filename);
  const fullPath = path.join(PRIVATE_PDF_DIR, safeName);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath);
  }
  const generated = buildGoalPdfBuffer(goal);
  fs.writeFileSync(fullPath, generated);
  return generated;
}

export function saveUploadedPrivatePdf(filename: string, data: Buffer): void {
  ensurePrivateDir();
  const safeName = path.basename(filename);
  const fullPath = path.join(PRIVATE_PDF_DIR, safeName);
  fs.writeFileSync(fullPath, data);
}

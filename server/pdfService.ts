import type { GoalSlug, OrderRecord } from './store';

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

type DietProfile = Pick<OrderRecord, 'customerName' | 'id' | 'age' | 'gender' | 'heightCm' | 'weightKg' | 'dietPreference'>;

function calculateNutrition(profile: DietProfile, goal: GoalSlug) {
  const age = Number(profile.age || 25);
  const weight = Number(profile.weightKg || 65);
  const height = Number(profile.heightCm || 165);
  const gender = profile.gender || 'Other';
  const bmi = weight / Math.pow(height / 100, 2);
  // Mifflin-St Jeor estimate. For "Other", use the midpoint rather than
  // silently assigning a sex-specific coefficient. These are estimates only.
  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = gender === 'Male' ? base + 5 : gender === 'Female' ? base - 161 : base - 78;
  const maintenance = bmr * 1.2; // sedentary baseline; activity level is not collected yet
  const calories = age < 18 ? null : Math.round(goal === 'fatloss'
    ? Math.max(gender === 'Female' ? 1200 : 1500, maintenance - 350)
    : maintenance + 250);
  const bmiLabel = age < 18 ? 'Adult BMI categories are not used for under-18 profiles' : bmi < 18.5 ? 'Below standard adult range' : bmi < 25 ? 'Standard adult range' : bmi < 30 ? 'Above standard adult range' : 'High adult BMI range';
  const portionScale = Math.max(0.75, Math.min(1.3, (calories || (goal === 'fatloss' ? 1600 : 2300)) / (goal === 'fatloss' ? 1600 : 2300)));
  return { bmi: bmi.toFixed(1), bmiLabel, calories, portionScale };
}

function buildGoalPdfBuffer(goal: GoalSlug, profile: DietProfile): Buffer {
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

  const nutrition = calculateNutrition(profile, goal);
  p1.push('0.96 0.92 0.87 rg 42 625 511 79 re f');
  p1.push('BT /F2 11 Tf 0.13 0.10 0.08 rg 56 687 Td (YOUR PERSONAL DIET PROFILE) Tj ET');
  const profileLines = [
    `Name: ${String(profile.customerName || 'Customer').slice(0, 24)}   Order: ${String(profile.id || '').slice(-10)}`,
    `Age: ${profile.age} years   Gender: ${profile.gender}   Diet: ${profile.dietPreference}`,
    `Height: ${profile.heightCm} cm   Current weight: ${profile.weightKg} kg   BMI: ${nutrition.bmi}`,
    `BMI category (adult reference): ${nutrition.bmiLabel}`,
    nutrition.calories ? `Estimated energy starting point: ${nutrition.calories} kcal/day (sedentary baseline)` : 'Under 18: calorie and protein targets require parent/guardian and qualified dietitian review.',
  ];
  let ny = 671;
  for (const line of profileLines) {
    for (const wrapped of wrapText(line, 92)) {
      p1.push(`BT /F1 8.5 Tf 0.30 0.25 0.22 rg 56 ${ny} Td (${escapePdfText(wrapped)}) Tj ET`);
      ny -= 11;
    }
  }

  p1.push('BT /F2 13 Tf 0.13 0.10 0.08 rg 42 598 Td (YOUR DAILY MEAL SCHEDULE) Tj ET');
  p1.push('0.85 0.80 0.75 RG 0.8 w 42 590 m 553 590 l S');

  const scale = nutrition.portionScale;
  const qty = (value: number, step = 1) => String(Math.max(step, Math.round((value * scale) / step) * step));
  const vegetarian = profile.dietPreference === 'Vegetarian';
  const eggetarian = profile.dietPreference === 'Eggetarian';
  const proteinChoice = vegetarian ? 'paneer/tofu/soya' : eggetarian ? 'eggs/paneer' : 'chicken/fish/eggs';
  const breakfastProtein = vegetarian ? 'paneer bhurji' : eggetarian ? 'egg bhurji ya paneer' : 'egg bhurji';
  const meals = isFatLoss
    ? [
        ['07:00 AM - Morning Start', 'Paani + 4-5 bheege badam. Chai/coffee bina ya kam cheeni.'],
        ['08:30 AM - Breakfast', `${qty(2)} moong dal chilla + ${qty(100, 5)}g dahi. Protein option: ${proteinChoice}.`],
        ['11:30 AM - Mid-Morning', '1 seasonal fruit (apple/guava/orange) + chaas.'],
        ['01:30 PM - Lunch', `${qty(2)} roti + ${qty(1)} katori dal + ${qty(100, 5)}g ${proteinChoice} + salad aur sabzi.`],
        ['05:00 PM - Evening Snack', `${qty(25, 5)}g roasted chana/makhana ya 1 fruit; workout ho toh timing adjust karein.`],
        ['08:00 PM - Dinner', `${qty(1)}-${qty(2)} roti + ${qty(100, 5)}g ${proteinChoice} + seasonal sabzi/salad.`],
      ]
    : [
        ['07:00 AM - Morning Start', 'Paani + 1 kela + 6-8 bheege badam.'],
        ['08:30 AM - Breakfast', `${qty(70, 5)}g oats doodh ke saath + ${qty(2)} eggs equivalent ${breakfastProtein}.` ],
        ['11:30 AM - Mid-Morning Shake', `${qty(250, 25)}ml doodh + 1 kela + 1 tbsp peanut butter (allergy na ho toh).`],
        ['01:30 PM - Lunch', `${qty(3)} roti + ${qty(1)} katori chawal + dal/rajma + ${qty(120, 5)}g ${proteinChoice} + dahi.`],
        ['05:00 PM - Evening Snack', 'Boiled aloo/sweet potato + dahi ya roasted chana.'],
        ['08:30 PM - Dinner', `${qty(2)}-${qty(3)} roti + chawal + ${qty(120, 5)}g ${proteinChoice} + sabzi.`],
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

  const proteinSwapList = vegetarian
    ? 'Paneer | Tofu | Soya chunks | Moong dal | Chana | Thick homemade dahi.'
    : eggetarian
      ? 'Whole eggs | Egg whites | Paneer | Soya chunks | Moong dal | Thick homemade dahi.'
      : 'Chicken | Fish | Whole eggs | Egg whites | Paneer | Dal and chana.';
  const blocks = [
    [
      '1. PROTEIN OPTIONS BASED ON YOUR FOOD PREFERENCE',
      proteinSwapList,
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
      'Yeh plan aapke diye gaye age, gender, height, weight aur diet preference ke basis par portion guidance adjust karta hai. Energy estimate sedentary activity assumption par hai kyunki activity level checkout mein nahi poocha gaya; meal quantities practical starting portions hain, exact calorie prescription nahi. Calories/BMI estimates medical advice nahi hain. Allergy, diabetes, kidney/liver condition, pregnancy, eating disorder, medicines, ya age 18 se kam hone par qualified doctor/dietitian se personalized review karayein. Koi sawaal ho toh WhatsApp support par Order ID bhejein.',
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

export async function getOrCreatePrivatePdf(goal: GoalSlug, profile: DietProfile): Promise<Buffer> {
  // Shared content template; render a fresh PDF from the paid order's stored profile.
  return buildGoalPdfBuffer(goal, profile);
}

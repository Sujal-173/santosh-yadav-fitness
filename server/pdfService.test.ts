import test from 'node:test';
import assert from 'node:assert/strict';
import { getOrCreatePrivatePdf } from './pdfService';

test('personalized PDF includes the stored customer profile and goal', async () => {
  const profile = {
    id: 'SYFTEST123456',
    customerName: 'Demo Customer',
    age: 29,
    gender: 'Female',
    heightCm: 162,
    weightKg: 74,
    dietPreference: 'Vegetarian',
  } as const;
  const pdf = await getOrCreatePrivatePdf('fatloss', profile);
  const text = pdf.toString('latin1');
  assert.equal(pdf.subarray(0, 8).toString(), '%PDF-1.4');
  assert.match(text, /Demo Customer/);
  assert.match(text, /162 cm/);
  assert.match(text, /74 kg/);
  assert.match(text, /FAT LOSS DIET PLAN/);
});

test('PDF content changes for a different goal and food preference', async () => {
  const profile = {
    id: 'SYFTEST654321',
    customerName: 'Another Customer',
    age: 31,
    gender: 'Male',
    heightCm: 178,
    weightKg: 68,
    dietPreference: 'Non-Vegetarian',
  } as const;
  const pdf = await getOrCreatePrivatePdf('gain', profile);
  const text = pdf.toString('latin1');
  assert.match(text, /WEIGHT GAIN DIET PLAN/);
  assert.match(text, /Another Customer/);
  assert.match(text, /Chicken/);
});

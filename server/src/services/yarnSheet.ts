import { parse } from 'csv-parse/sync';
import { replaceAllYarns, type YarnInput } from '../db/yarns.js';
import { classFromSheetLabel } from './weightClass.js';

const SHEET_ID = process.env.YARN_SHEET_ID;

function num(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// The sheet lays out two independent yarn entries per row when there's a
// second one to show (columns 0-8 are the first entry, column 9 is a blank
// spacer, columns 10-17 are the second). A row with nothing in column 10 has
// just one entry. This mirrors the sheet's own layout, not a format we chose.
function blockToYarn(fields: string[], offset: number, withProjectCol: boolean): YarnInput | null {
  const brand = fields[offset]?.trim();
  if (!brand) return null;

  const weightLabel = fields[offset + 3]?.trim() || null;
  return {
    brand,
    colorName: fields[offset + 1]?.trim() || null,
    color: fields[offset + 2]?.trim() || null,
    weightLabel,
    weightClass: classFromSheetLabel(weightLabel),
    fiber: fields[offset + 4]?.trim() || null,
    yardsPerGram: num(fields[offset + 5]),
    grams: num(fields[offset + 6]),
    yards: num(fields[offset + 7]),
    sourceUrl: withProjectCol ? fields[offset + 8]?.trim() || null : null
  };
}

export function parseYarnCsv(csvText: string): YarnInput[] {
  const rows: string[][] = parse(csvText, { skip_empty_lines: false });
  const [, ...dataRows] = rows; // first row is the header

  const yarns: YarnInput[] = [];
  for (const fields of dataRows) {
    const first = blockToYarn(fields, 0, true);
    if (first) yarns.push(first);

    const second = blockToYarn(fields, 10, false);
    if (second) yarns.push(second);
  }
  return yarns;
}

export async function syncYarnSheet(): Promise<number> {
  if (!SHEET_ID) throw new Error('YARN_SHEET_ID is not configured');

  const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`);
  if (!response.ok) throw new Error(`Failed to fetch yarn sheet: ${response.status}`);

  const csvText = await response.text();
  const yarns = parseYarnCsv(csvText);
  return replaceAllYarns(yarns);
}

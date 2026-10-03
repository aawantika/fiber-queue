export const WEIGHT_CLASS_OPTIONS = [
  { value: 0, label: '0 - Lace' },
  { value: 1, label: '1 - Fingering' },
  { value: 2, label: '2 - Sport' },
  { value: 3, label: '3 - DK' },
  { value: 4, label: '4 - Worsted/Aran' },
  { value: 5, label: '5 - Bulky' },
  { value: 6, label: '6 - Super Bulky' }
];

export function weightClassLabel(weightClass: number | null | undefined): string {
  if (weightClass == null) return '—';
  return WEIGHT_CLASS_OPTIONS.find((o) => o.value === weightClass)?.label ?? String(weightClass);
}

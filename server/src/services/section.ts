// Mirrors web/src/section.ts — kept in sync by hand since it's ~10 lines.
// Ravelry's category path is "Categories > Group > Type > [Subtype]" (4
// levels), but sock patterns go one level deeper ("... > Socks > Mid-calf").
// Capping at the 4th segment collapses that extra sock-cut level back to
// "Socks" while leaving normal 4-level paths (Pullover, Cardigan) untouched.
const SECTION_OVERRIDES: Record<string, string> = {
  'Sleeveless Top': 'Tops'
};

export function deriveSectionName(category: string | null): string | null {
  if (!category) return null;
  const first = category.split(';')[0].trim();
  const segments = first.split(' > ').map((s) => s.trim());
  const leaf = segments[Math.min(3, segments.length - 1)];
  return SECTION_OVERRIDES[leaf] ?? leaf;
}

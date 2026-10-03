// Ravelry's category path is "Categories > Group > Type > [Subtype]", e.g.
// "Categories > Clothing > Sweater > Pullover" (4 levels) but sock patterns
// go one level deeper: "Categories > Accessories > Feet / Legs > Socks >
// Mid-calf" (5 levels). Capping at the 4th segment collapses that extra
// sock-cut level back down to "Socks" while leaving normal 4-level paths
// (Pullover, Cardigan, Sleeveless Top) untouched — matches what actually
// reads as a useful queue section, not an exact style variant.
// Some leaf category names just restate their parent group without adding a
// distinction worth a separate section (every "Sleeveless Top" is already a
// "Top" — unlike "Pullover" vs "Cardigan", which are genuinely different
// garments under "Sweater"). Collapse those specific leaves back to their
// parent; everything else keeps the capped-depth leaf as-is.
const SECTION_OVERRIDES: Record<string, string> = {
  'Sleeveless Top': 'Tops',
  Tee: 'Tops'
};

export function deriveSectionName(category: string | null): string {
  if (!category) return 'Uncategorized';
  const first = category.split(';')[0].trim();
  const segments = first.split(' > ').map((s) => s.trim());
  const leaf = segments[Math.min(3, segments.length - 1)];
  return SECTION_OVERRIDES[leaf] ?? leaf;
}

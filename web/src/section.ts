// Ravelry's category path is "Categories > Group > Type > [Subtype]", e.g.
// "Categories > Clothing > Sweater > Pullover" (4 levels) but sock patterns
// go one level deeper: "Categories > Accessories > Feet / Legs > Socks >
// Mid-calf" (5 levels). Capping at the 4th segment collapses that extra
// sock-cut level back down to "Socks" while leaving normal 4-level paths
// (Pullover, Cardigan, Sleeveless Top) untouched — matches what actually
// reads as a useful queue section, not an exact style variant.
export function deriveSectionName(category: string | null): string {
  if (!category) return 'Uncategorized';
  const first = category.split(';')[0].trim();
  const segments = first.split(' > ').map((s) => s.trim());
  return segments[Math.min(3, segments.length - 1)];
}

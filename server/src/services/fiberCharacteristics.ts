// Mirrors web/src/fiberCharacteristics.ts — kept in sync by hand.
//
// Unlike yarn_notes (hand-written, saved once, per brand), this runs live
// against whatever `fiber` text is on a yarn row — no saved state, so it
// still produces a real answer for a yarn that was only just added to the
// sheet, renamed, or hasn't been synced in a while. It's the fallback a
// manual note overrides, not a replacement for one: a person's actual
// experience with a yarn ("I made a sweater, it's too warm to wear inside")
// beats a keyword guess every time, but the guess is free and always there.
export interface FiberTrait {
  keyword: string;
  trait: string;
}

const FIBER_TRAITS: FiberTrait[] = [
  { keyword: 'alpaca', trait: 'warm, drapey, little elastic memory (sags over time)' },
  { keyword: 'mohair', trait: 'fuzzy halo, extra warmth, obscures fine stitch detail' },
  { keyword: 'angora', trait: 'fuzzy halo, very warm, sheds' },
  { keyword: 'cashmere', trait: 'very warm, soft, delicate' },
  { keyword: 'silk', trait: 'drapey, sheen, less insulating than wool at the same weight' },
  { keyword: 'cotton', trait: 'heavy, breathable, no elastic stretch — garments stretch out under their own weight' },
  { keyword: 'linen', trait: 'crisp, breathable, cooling, no stretch' },
  { keyword: 'bamboo', trait: 'drapey, breathable, silky sheen' },
  { keyword: 'rayon', trait: 'drapey, silky sheen, adds drape to blends' },
  { keyword: 'acrylic', trait: 'less insulating than natural fiber, durable, machine-washable' },
  { keyword: 'nylon', trait: 'adds durability and elasticity — common sock-yarn addition' },
  { keyword: 'polyamide', trait: 'adds durability and elasticity — common sock-yarn addition' },
  { keyword: 'merino', trait: 'warm, soft, good elastic memory' },
  { keyword: 'wool', trait: 'warm, elastic memory' },
  { keyword: 'metallic', trait: 'novelty sparkle — reads as a lot across a full garment' },
  { keyword: 'paper', trait: 'crisp, essentially no insulation, very breathable' }
];

export function deriveFiberTraits(fiber: string | null): string[] {
  if (!fiber) return [];
  const lower = fiber.toLowerCase();
  const seen = new Set<string>();
  const traits: string[] = [];
  for (const { keyword, trait } of FIBER_TRAITS) {
    if (lower.includes(keyword) && !seen.has(trait)) {
      seen.add(trait);
      traits.push(trait);
    }
  }
  return traits;
}

// weightClass 4+ (worsted/aran and up) compounds whatever warmth the fiber
// itself has — a bulky alpaca-mohair blend is warm for two independent
// reasons, not one.
export function deriveFiberSuggestion(fiber: string | null, weightClass: number | null): string | null {
  const traits = deriveFiberTraits(fiber);
  if (traits.length === 0) return null;
  const weightNote = weightClass != null && weightClass >= 4 ? ' At this weight, any warmth from the fiber is compounded.' : '';
  return `${traits.join('; ')}.${weightNote}`;
}

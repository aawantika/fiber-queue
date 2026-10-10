// Mirrors server/src/services/fiberCharacteristics.ts — kept in sync by hand.
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

export function deriveFiberSuggestion(fiber: string | null, weightClass: number | null): string | null {
  const traits = deriveFiberTraits(fiber);
  if (traits.length === 0) return null;
  const weightNote = weightClass != null && weightClass >= 4 ? ' At this weight, any warmth from the fiber is compounded.' : '';
  return `${traits.join('; ')}.${weightNote}`;
}

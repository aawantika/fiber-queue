export type ProjectStatus = 'queue' | 'in_progress' | 'completed' | 'frogged';
export type PatternStatus = 'have' | 'need_to_buy';

export interface Project {
  id: number;
  name: string;
  category: string | null;
  craft: string | null;
  designer: string | null;
  status: ProjectStatus;
  patternStatus: PatternStatus;
  patternFree: boolean;
  needsReview: boolean;
  ravelryId: number | null;
  ravelryPermalink: string | null;
  ravelryUrl: string | null;
  patternUrl: string | null;
  yardageMin: number | null;
  yardageMax: number | null;
  yardageBySize: string | null;
  sizesAvailable: string | null;
  weightLabel: string | null;
  weightClass: number | null;
  needleSizes: string | null;
  hookSizes: string | null;
  gauge: string | null;
  yarnComponents: string | null;
  suggestedYarn: string | null;
  published: string | null;
  imagePath: string | null;
  imageSourceUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  bestMatchYards?: number;
  hasYardageMatch?: boolean | null;
}

export interface YarnMatchGroup {
  brand: string;
  colorName: string | null;
  color: string | null;
  weightLabel: string | null;
  fiber: string | null;
  totalYards: number;
  totalGrams: number;
  yarnIds: number[];
  meetsMin: boolean | null;
  meetsMax: boolean | null;
}

export interface YarnComponent {
  weightLabel: string | null;
  weightClass: number | null;
  yarnName: string | null;
  yardageMin: number | null;
  yardageMax: number | null;
}

export interface ComponentMatch extends YarnComponent {
  matches: YarnMatchGroup[];
}

export interface ProjectDetail extends Project {
  yarnMatches: YarnMatchGroup[];
  componentMatches: ComponentMatch[];
}

export interface Yarn {
  id: number;
  brand: string;
  colorName: string | null;
  color: string | null;
  weightLabel: string | null;
  weightClass: number | null;
  fiber: string | null;
  yardsPerGram: number | null;
  grams: number | null;
  yards: number | null;
  sourceUrl: string | null;
}

export interface ManualProjectInput {
  name: string;
  category?: string | null;
  craft?: string | null;
  designer?: string | null;
  status?: ProjectStatus;
  patternStatus?: PatternStatus;
  patternFree?: boolean;
  needsReview?: boolean;
  yardageMin?: number | null;
  yardageMax?: number | null;
  yardageBySize?: string | null;
  sizesAvailable?: string | null;
  weightLabel?: string | null;
  weightClass?: number | null;
  needleSizes?: string | null;
  hookSizes?: string | null;
  gauge?: string | null;
  suggestedYarn?: string | null;
  published?: string | null;
  patternUrl?: string | null;
  imageSourceUrl?: string | null;
  notes?: string | null;
}

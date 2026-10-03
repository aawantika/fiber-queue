-- weight_class is a normalized 0-7 CYC yarn weight bucket (0 Lace ... 6 Super Bulky)
-- derived from whatever label the source (sheet or Ravelry) used, so yarns and
-- projects can be matched by weight even though the two sources label weights
-- inconsistently (e.g. "DK" vs "3 - Light", "Worsted" vs "Aran").
CREATE TABLE IF NOT EXISTS yarns (
  id INTEGER PRIMARY KEY,
  brand TEXT NOT NULL,
  color_name TEXT,
  color TEXT,
  weight_label TEXT,
  weight_class INTEGER,
  fiber TEXT,
  yards_per_gram REAL,
  grams REAL,
  yards REAL,
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_yarns_weight_class ON yarns(weight_class);

-- A project is one queue entry: either pulled from a Ravelry pattern link
-- (ravelry_id set, specs/image come from the API) or added manually.
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  craft TEXT,
  designer TEXT,
  status TEXT NOT NULL DEFAULT 'queue' CHECK (status IN ('queue', 'in_progress', 'completed', 'frogged')),
  pattern_status TEXT NOT NULL DEFAULT 'need_to_buy' CHECK (pattern_status IN ('have', 'need_to_buy')),
  pattern_free INTEGER NOT NULL DEFAULT 0,
  ravelry_id INTEGER,
  ravelry_permalink TEXT,
  ravelry_url TEXT,
  yardage_min REAL,
  yardage_max REAL,
  -- Free-text, user-filled: Ravelry only exposes a single yardage_min/max
  -- range for the whole size run; per-size yardage lives in each designer's
  -- materials text in whatever format they chose, so it isn't reliably
  -- machine-parseable. e.g. "S: 525yd, M: 575yd, L: 640yd, XL: 700yd"
  yardage_by_size TEXT,
  sizes_available TEXT,
  weight_label TEXT,
  weight_class INTEGER,
  needle_sizes TEXT,
  hook_sizes TEXT,
  suggested_yarn TEXT,
  published TEXT,
  image_path TEXT,
  image_source_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_weight_class ON projects(weight_class);

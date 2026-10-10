import { useEffect, useMemo, useState } from 'react';
import { deleteYarnNote, getYarnNotes, getYarnSheetUrl, getYarns, saveYarnNote, syncYarns } from '../api/client';
import { Yarn, YarnNote } from '../api/types';
import { deriveFiberSuggestion } from '../fiberCharacteristics';
import { weightClassLabel } from '../weightClass';

function findNote(notes: YarnNote[], brand: string, colorName: string | null): YarnNote | null {
  return notes.find((n) => n.brand === brand && n.colorName === colorName) ?? notes.find((n) => n.brand === brand && n.colorName === null) ?? null;
}

interface BrandGroup {
  brand: string;
  yarns: Yarn[];
  totalYards: number;
  minWeightClass: number | null;
}

export default function YarnInventoryPage() {
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [notes, setNotes] = useState<YarnNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editWholeBrand, setEditWholeBrand] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    getYarns()
      .then(setYarns)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }
  function loadNotes() {
    getYarnNotes().then(setNotes).catch(() => {});
  }

  useEffect(load, []);
  useEffect(loadNotes, []);
  useEffect(() => {
    getYarnSheetUrl().then((r) => setSheetUrl(r.url)).catch(() => setSheetUrl(null));
  }, []);

  // Grouped by brand, not flattened to one row per colorway — a brand with
  // 10 colorways (Swish) was repeating the same suggested-use text 10 times
  // down the page, which is the actual "too long to read" problem. Sorted by
  // each brand's lightest colorway so the overall light-to-heavy order from
  // before is preserved even though weight can vary within a brand.
  const groups = useMemo<BrandGroup[]>(() => {
    const byBrand = new Map<string, Yarn[]>();
    for (const y of yarns) byBrand.set(y.brand, [...(byBrand.get(y.brand) ?? []), y]);
    const result: BrandGroup[] = Array.from(byBrand.entries()).map(([brand, list]) => ({
      brand,
      yarns: list,
      totalYards: list.reduce((sum, y) => sum + (y.yards ?? 0), 0),
      minWeightClass: list.reduce<number | null>((min, y) => {
        if (y.weightClass == null) return min;
        return min == null ? y.weightClass : Math.min(min, y.weightClass);
      }, null)
    }));
    result.sort((a, b) => {
      if (a.minWeightClass == null && b.minWeightClass != null) return 1;
      if (a.minWeightClass != null && b.minWeightClass == null) return -1;
      if (a.minWeightClass !== b.minWeightClass) return (a.minWeightClass ?? 0) - (b.minWeightClass ?? 0);
      return a.brand.localeCompare(b.brand);
    });
    return result;
  }, [yarns]);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const { imported } = await syncYarns();
      setSyncMessage(`Imported ${imported} yarns from the sheet.`);
      load();
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  function startEdit(brand: string, colorName: string | null) {
    const existing = findNote(notes, brand, colorName);
    setEditingKey(`${brand}::${colorName ?? ''}`);
    setEditText(existing?.note ?? '');
    setEditWholeBrand(existing ? existing.colorName === null : true);
  }

  async function handleSaveNote(brand: string, colorName: string | null) {
    setSaving(true);
    try {
      await saveYarnNote(brand, editWholeBrand ? null : colorName, editText);
      loadNotes();
      setEditingKey(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteNote(id: number) {
    await deleteYarnNote(id);
    loadNotes();
    setEditingKey(null);
  }

  function toggleExpanded(brand: string) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="muted">Error: {error}</p>;

  return (
    <div>
      <h1>
        Yarn inventory ({yarns.length} colorways, {groups.length} brands)
      </h1>
      <div className="filters">
        <button onClick={handleSync} disabled={syncing}>
          {syncing ? 'Syncing…' : 'Sync from Google Sheet'}
        </button>
        {sheetUrl && (
          <a href={sheetUrl} target="_blank" rel="noreferrer">
            Open Google Sheet ↗
          </a>
        )}
      </div>
      {syncMessage && <p className="muted">{syncMessage}</p>}

      {groups.map((g) => {
        const note = findNote(notes, g.brand, null);
        const brandKey = `${g.brand}::`;
        const isEditingBrand = editingKey === brandKey;
        const isMulti = g.yarns.length > 1;
        const isExpanded = expanded.has(g.brand);
        const fallback = !note ? deriveFiberSuggestion(g.yarns[0]?.fiber ?? null, g.minWeightClass) : null;

        return (
          <div key={g.brand} className="section" style={{ marginTop: 14 }}>
            <div className="spec-row" style={{ alignItems: 'flex-start' }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div>
                  <strong>{g.brand}</strong>{' '}
                  <span className="muted">
                    — {weightClassLabel(g.minWeightClass)}
                    {isMulti ? ` · ${g.yarns.length} colorways` : ''} · {Math.round(g.totalYards)} yd total
                  </span>
                  {isMulti && (
                    <button className="secondary" style={{ marginLeft: 8 }} onClick={() => toggleExpanded(g.brand)}>
                      {isExpanded ? 'Hide colorways' : 'Show colorways'}
                    </button>
                  )}
                </div>

                {isEditingBrand ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, maxWidth: 500 }}>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      placeholder="e.g. runs warm — prefer cardigans/open-front over pullovers"
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleSaveNote(g.brand, null)} disabled={saving || !editText.trim()}>
                        Save
                      </button>
                      <button className="secondary" onClick={() => setEditingKey(null)}>
                        Cancel
                      </button>
                      {note && (
                        <button className="secondary" onClick={() => handleDeleteNote(note.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span className="muted" style={{ fontSize: 13 }}>
                      {note?.note ?? fallback ?? '—'}
                      {!note && fallback && ' (auto)'}
                    </span>
                    <button className="secondary" onClick={() => startEdit(g.brand, null)}>
                      {note ? 'Edit' : '+ Add'}
                    </button>
                  </div>
                )}
              </span>
            </div>

            {(!isMulti || isExpanded) && (
              <table style={{ marginTop: 6 }}>
                <thead>
                  <tr>
                    <th>Colorway</th>
                    <th>Color</th>
                    <th>Weight</th>
                    <th>Fiber</th>
                    <th>Yards</th>
                    <th>Meters</th>
                  </tr>
                </thead>
                <tbody>
                  {g.yarns.map((y) => (
                    <tr key={y.id}>
                      <td>{y.colorName ?? '—'}</td>
                      <td>{y.color ?? '—'}</td>
                      <td>{weightClassLabel(y.weightClass)}</td>
                      <td>{y.fiber ?? '—'}</td>
                      <td>{y.yards != null ? Math.round(y.yards) : '—'}</td>
                      <td>{y.yards != null ? Math.round(y.yards * 0.9144) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

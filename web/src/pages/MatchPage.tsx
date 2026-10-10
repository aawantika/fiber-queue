import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getYarnGroups, matchYarnSelection } from '../api/client';
import { SelectionMatchResult, YarnGroup } from '../api/types';
import { weightClassLabel } from '../weightClass';

function groupKey(g: { brand: string; colorName: string | null }): string {
  return `${g.brand}::${g.colorName ?? ''}`;
}

export default function MatchPage() {
  const [groups, setGroups] = useState<YarnGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<SelectionMatchResult | null>(null);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    getYarnGroups()
      .then(setGroups)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const byWeight = useMemo(() => {
    const map = new Map<number | null, YarnGroup[]>();
    for (const g of groups) {
      map.set(g.weightClass, [...(map.get(g.weightClass) ?? []), g]);
    }
    for (const list of map.values()) list.sort((a, b) => a.brand.localeCompare(b.brand));
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a == null) return 1;
      if (b == null) return -1;
      return a - b;
    });
  }, [groups]);

  const selectedGroups = useMemo(() => groups.filter((g) => selected.has(groupKey(g))), [groups, selected]);

  const selectedKey = Array.from(selected).sort().join('|');
  useEffect(() => {
    if (selectedGroups.length === 0) {
      setResult(null);
      return;
    }
    setMatching(true);
    matchYarnSelection(
      selectedGroups.map((g) => ({
        brand: g.brand,
        colorName: g.colorName,
        weightClass: g.weightClass,
        totalYards: g.totalYards
      }))
    )
      .then(setResult)
      .finally(() => setMatching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  function toggle(g: YarnGroup) {
    const key = groupKey(g);
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const distinctClasses = new Set(selectedGroups.map((g) => g.weightClass).filter((c) => c != null));

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="muted">Error: {error}</p>;

  return (
    <div>
      <h1>What can I make?</h1>
      <p className="muted">
        Pick one or more stash colorways. Selecting a single one shows every project at that weight and whether you
        have enough. Selecting exactly two different weights also checks held-together (multi-strand) projects that
        call for that pairing.
      </p>

      <div className="detail-layout">
        <div style={{ flex: 1, minWidth: 280 }}>
          <h2>Your stash</h2>
          {byWeight.map(([weightClass, items]) => (
            <div key={weightClass ?? 'null'} className="section" style={{ marginTop: 12 }}>
              <h2>{weightClass != null ? weightClassLabel(weightClass) : 'Unknown weight'}</h2>
              {items.map((g) => (
                <label key={groupKey(g)} className="spec-row" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <input type="checkbox" checked={selected.has(groupKey(g))} onChange={() => toggle(g)} style={{ flexShrink: 0, marginTop: 3 }} />
                    <span style={{ minWidth: 0 }}>
                      <div>
                        {g.brand} {g.colorName ?? g.color ?? ''}
                      </div>
                      {g.note && (
                        <div className="muted" style={{ fontSize: 12 }}>
                          {g.note.note}
                        </div>
                      )}
                    </span>
                  </span>
                  <span className="muted" style={{ flexShrink: 0, marginLeft: 12 }}>
                    {Math.round(g.totalYards)} yd
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>

        <div style={{ flex: 2, minWidth: 320 }}>
          <h2>Selected</h2>
          {selectedGroups.length === 0 && <p className="muted">Nothing selected yet.</p>}
          {selectedGroups.length > 0 && (
            <>
              {Array.from(distinctClasses).map((wc) => (
                <div key={wc} className="spec-row">
                  <span className="label">{weightClassLabel(wc as number)}</span>
                  <span>
                    {Math.round(selectedGroups.filter((g) => g.weightClass === wc).reduce((sum, g) => sum + g.totalYards, 0))} yd
                  </span>
                </div>
              ))}
            </>
          )}

          {matching && <p className="muted">Matching…</p>}

          {result && (
            <>
              <div className="section">
                <h2>Projects at this weight ({result.soloMatches.length})</h2>
                {result.soloMatches.length === 0 && <p className="muted">No projects in your queue at this weight.</p>}
                {result.soloMatches.length > 0 && (
                  <table>
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Yardage needed</th>
                        <th>Enough?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.soloMatches.map((m) => (
                        <tr key={m.project.id}>
                          <td>
                            <Link to={`/projects/${m.project.id}`}>{m.project.name}</Link>
                          </td>
                          <td>
                            {m.project.yardageMin ?? '?'}–{m.project.yardageMax ?? '?'} yd
                          </td>
                          <td>
                            {m.meetsMin === null ? (
                              '—'
                            ) : (
                              <span className={`badge ${m.meetsMin ? 'good' : 'bad'}`}>{m.meetsMin ? 'enough' : 'short'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {distinctClasses.size === 2 && (
                <div className="section">
                  <h2>Held together, this pairing unlocks ({result.heldTogetherMatches.length})</h2>
                  {result.heldTogetherMatches.length === 0 && (
                    <p className="muted">No held-together projects call for this exact pair of weights.</p>
                  )}
                  {result.heldTogetherMatches.map((m) => (
                    <div key={m.project.id} className="spec-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Link to={`/projects/${m.project.id}`}>{m.project.name}</Link>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {m.components.map((c, i) => (
                          <span key={i} style={{ marginRight: 12 }}>
                            {c.weightLabel}: {c.yardageMin ?? '?'}–{c.yardageMax ?? '?'} yd needed, {Math.round(c.availableYards)} yd
                            available{' '}
                            {c.meetsMin !== null && (
                              <span className={`badge ${c.meetsMin ? 'good' : 'bad'}`}>{c.meetsMin ? 'enough' : 'short'}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {distinctClasses.size > 2 && (
                <p className="muted section">
                  3+ different weights selected — no pattern in your queue holds more than 2 strands together, so only
                  the per-weight matches above apply.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

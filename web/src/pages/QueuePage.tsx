import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProjects } from '../api/client';
import { Project } from '../api/types';
import { deriveSectionName } from '../section';
import { weightClassLabel } from '../weightClass';

export default function QueuePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [craftFilter, setCraftFilter] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const designerFilter = searchParams.get('designer') ?? 'all';

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(projects.map((p) => deriveSectionName(p.category)))).sort((a, b) => a.localeCompare(b)),
    [projects]
  );
  const crafts = useMemo(
    () => Array.from(new Set(projects.map((p) => p.craft).filter(Boolean))) as string[],
    [projects]
  );
  const designers = useMemo(
    () => (Array.from(new Set(projects.map((p) => p.designer).filter(Boolean))) as string[]).sort((a, b) => a.localeCompare(b)),
    [projects]
  );

  const filtered = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && deriveSectionName(p.category) !== categoryFilter) return false;
    if (craftFilter !== 'all' && p.craft !== craftFilter) return false;
    if (designerFilter !== 'all' && p.designer !== designerFilter) return false;
    return true;
  });

  // Not alphabetical — "Uncategorized" always trails, and the rest follows
  // a fixed preference order (garments roughly biggest/most-queued first).
  // Anything that shows up later and isn't in the list falls in
  // alphabetically before "Uncategorized" rather than disappearing.
  const SECTION_ORDER = ['Tops', 'Cardigan', 'Pullover', 'Socks', 'Household'];

  function sectionRank(name: string): number {
    if (name === 'Uncategorized') return Infinity;
    const i = SECTION_ORDER.indexOf(name);
    return i === -1 ? SECTION_ORDER.length : i;
  }

  const sections = useMemo(() => {
    const grouped = new Map<string, Project[]>();
    for (const p of filtered) {
      const section = deriveSectionName(p.category);
      grouped.set(section, [...(grouped.get(section) ?? []), p]);
    }
    for (const items of grouped.values()) items.sort((a, b) => a.name.localeCompare(b.name));
    return Array.from(grouped.entries()).sort(([a], [b]) => {
      const rankDiff = sectionRank(a) - sectionRank(b);
      return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
    });
  }, [filtered]);

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="muted">Error: {error}</p>;

  return (
    <div>
      <h1>Queue ({filtered.length})</h1>
      <div className="filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="queue">Queue</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="frogged">Frogged</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={craftFilter} onChange={(e) => setCraftFilter(e.target.value)}>
          <option value="all">All crafts</option>
          {crafts.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={designerFilter}
          onChange={(e) => setSearchParams(e.target.value === 'all' ? {} : { designer: e.target.value })}
        >
          <option value="all">All designers</option>
          {designers.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 && <p className="muted">No projects yet — add one.</p>}

      {sections.map(([section, items]) => (
        <div key={section} className="section">
          <h2>
            {section} ({items.length})
          </h2>
          <div className="grid">
            {items.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="card">
                {p.imagePath && <img src={p.imagePath} alt={p.name} />}
                <div className="body">
                  <div className="name">{p.name}</div>
                  <div className="meta">{[p.craft, p.designer].filter(Boolean).join(' · ')}</div>
                  <div>
                    <span className="badge">{p.status.replace('_', ' ')}</span>
                    <span className={`badge ${p.patternStatus === 'have' ? 'good' : ''}`}>
                      {p.patternStatus === 'have' ? 'pattern: have' : 'pattern: need to buy'}
                    </span>
                    {p.weightClass != null && <span className="badge">{weightClassLabel(p.weightClass)}</span>}
                    {p.needsReview && <span className="badge bad">needs fixing</span>}
                    {p.hasYardageMatch != null && (
                      <span className={`badge ${p.hasYardageMatch ? 'good' : 'bad'}`}>
                        {p.hasYardageMatch ? 'yarn: possible' : 'yarn: short'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

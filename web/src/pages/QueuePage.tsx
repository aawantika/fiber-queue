import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(projects.map((p) => deriveSectionName(p.category)))).sort(),
    [projects]
  );
  const crafts = useMemo(
    () => Array.from(new Set(projects.map((p) => p.craft).filter(Boolean))) as string[],
    [projects]
  );

  const filtered = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && deriveSectionName(p.category) !== categoryFilter) return false;
    if (craftFilter !== 'all' && p.craft !== craftFilter) return false;
    return true;
  });

  const sections = useMemo(() => {
    const grouped = new Map<string, Project[]>();
    for (const p of filtered) {
      const section = deriveSectionName(p.category);
      grouped.set(section, [...(grouped.get(section) ?? []), p]);
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
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
                  <div className="meta">{p.craft ?? ''}</div>
                  <div>
                    <span className="badge">{p.status.replace('_', ' ')}</span>
                    <span className={`badge ${p.patternStatus === 'have' ? 'good' : ''}`}>
                      {p.patternStatus === 'have' ? 'pattern: have' : 'pattern: need to buy'}
                    </span>
                    {p.weightClass != null && <span className="badge">{weightClassLabel(p.weightClass)}</span>}
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

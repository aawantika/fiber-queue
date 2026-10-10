import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProjects } from '../api/client';
import ProjectSections from '../components/ProjectSections';
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
  const [patternStatusFilter, setPatternStatusFilter] = useState('all');
  const [weightFilter, setWeightFilter] = useState('all');
  const [breathabilityFilter, setBreathabilityFilter] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const designerFilter = searchParams.get('designer') ?? 'all';

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Completed projects live in their own tab, not mixed into the queue.
  const active = useMemo(() => projects.filter((p) => p.status !== 'completed'), [projects]);

  const categories = useMemo(
    () => Array.from(new Set(active.map((p) => deriveSectionName(p.category)))).sort((a, b) => a.localeCompare(b)),
    [active]
  );
  const crafts = useMemo(
    () => Array.from(new Set(active.map((p) => p.craft).filter(Boolean))) as string[],
    [active]
  );
  const designers = useMemo(
    () => (Array.from(new Set(active.map((p) => p.designer).filter(Boolean))) as string[]).sort((a, b) => a.localeCompare(b)),
    [active]
  );
  const weightClasses = useMemo(
    () => Array.from(new Set(active.map((p) => p.weightClass).filter((w): w is number => w != null))).sort((a, b) => a - b),
    [active]
  );

  const filtered = active.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && deriveSectionName(p.category) !== categoryFilter) return false;
    if (craftFilter !== 'all' && p.craft !== craftFilter) return false;
    if (patternStatusFilter !== 'all' && p.patternStatus !== patternStatusFilter) return false;
    if (designerFilter !== 'all' && p.designer !== designerFilter) return false;
    if (weightFilter !== 'all' && String(p.weightClass) !== weightFilter) return false;
    if (breathabilityFilter !== 'all' && p.breathability !== breathabilityFilter) return false;
    return true;
  });

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="muted">Error: {error}</p>;

  return (
    <div>
      <h1>Queue ({filtered.length})</h1>
      <div className="filters">
        <Link to="/add" className="button">
          + Add project
        </Link>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="queue">Queue</option>
          <option value="in_progress">In progress</option>
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
        <select value={weightFilter} onChange={(e) => setWeightFilter(e.target.value)}>
          <option value="all">All weights</option>
          {weightClasses.map((w) => (
            <option key={w} value={w}>
              {weightClassLabel(w)}
            </option>
          ))}
        </select>
        <select value={breathabilityFilter} onChange={(e) => setBreathabilityFilter(e.target.value)}>
          <option value="all">Airy / dense: any</option>
          <option value="airy">Airy</option>
          <option value="dense">Dense</option>
          <option value="neutral">Neutral</option>
        </select>
        <select value={patternStatusFilter} onChange={(e) => setPatternStatusFilter(e.target.value)}>
          <option value="all">All projects</option>
          <option value="have">Pattern: have</option>
          <option value="need_to_buy">Pattern: need to buy</option>
          <option value="free">Pattern: free</option>
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

      <ProjectSections projects={filtered} />
    </div>
  );
}

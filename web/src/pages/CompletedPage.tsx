import { useEffect, useMemo, useState } from 'react';
import { getProjects } from '../api/client';
import ProjectSections from '../components/ProjectSections';
import { Project } from '../api/types';

export default function CompletedPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const completed = useMemo(() => projects.filter((p) => p.status === 'completed'), [projects]);

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="muted">Error: {error}</p>;

  return (
    <div>
      <h1>Completed ({completed.length})</h1>
      <ProjectSections projects={completed} />
    </div>
  );
}

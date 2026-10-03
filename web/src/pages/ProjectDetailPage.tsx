import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteProject, getProject, updateProject } from '../api/client';
import { ProjectDetail } from '../api/types';
import { deriveSectionName } from '../section';
import { weightClassLabel } from '../weightClass';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [yardageBySize, setYardageBySize] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProject(Number(id))
      .then((p) => {
        setProject(p);
        setYardageBySize(p.yardageBySize ?? '');
        setNotes(p.notes ?? '');
      })
      .catch((err) => setError(err.message));
  }, [id]);

  async function patch(fields: Partial<ProjectDetail>) {
    if (!project) return;
    const updated = await updateProject(project.id, { ...project, ...fields } as any);
    setProject({ ...project, ...updated });
  }

  async function handleSaveNotes() {
    setSaving(true);
    try {
      await patch({ yardageBySize, notes });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!project) return;
    if (!confirm(`Delete "${project.name}"?`)) return;
    await deleteProject(project.id);
    navigate('/');
  }

  if (error) return <p className="muted">Error: {error}</p>;
  if (!project) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h1>{project.name}</h1>
      <div className="detail-layout">
        {project.imagePath && <img className="detail-image" src={project.imagePath} alt={project.name} />}

        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="spec-row">
            <span className="label">Status</span>
            <select value={project.status} onChange={(e) => patch({ status: e.target.value as any })}>
              <option value="queue">Queue</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="frogged">Frogged</option>
            </select>
          </div>
          <div className="spec-row">
            <span className="label">Pattern</span>
            <select value={project.patternStatus} onChange={(e) => patch({ patternStatus: e.target.value as any })}>
              <option value="have">Have it</option>
              <option value="need_to_buy">Need to buy</option>
            </select>
          </div>
          {project.patternFree && <div className="spec-row"><span className="label">Free pattern</span><span>yes</span></div>}
          <div className="spec-row"><span className="label">Category</span><span>{deriveSectionName(project.category)}</span></div>
          <div className="spec-row"><span className="label">Craft</span><span>{project.craft ?? '—'}</span></div>
          <div className="spec-row"><span className="label">Designer</span><span>{project.designer ?? '—'}</span></div>
          <div className="spec-row"><span className="label">Weight</span><span>{weightClassLabel(project.weightClass)} {project.weightLabel ? `(${project.weightLabel})` : ''}</span></div>
          <div className="spec-row">
            <span className="label">Yardage</span>
            <span>{project.yardageMin ?? '?'}–{project.yardageMax ?? '?'} yd</span>
          </div>
          <div className="spec-row"><span className="label">Sizes available</span><span>{project.sizesAvailable ?? '—'}</span></div>
          <div className="spec-row"><span className="label">Needle size(s)</span><span>{project.needleSizes ?? '—'}</span></div>
          <div className="spec-row"><span className="label">Hook size(s)</span><span>{project.hookSizes ?? '—'}</span></div>
          <div className="spec-row"><span className="label">Suggested yarn</span><span>{project.suggestedYarn ?? '—'}</span></div>
          {project.ravelryUrl && (
            <div className="spec-row">
              <span className="label">Ravelry</span>
              <a href={project.ravelryUrl} target="_blank" rel="noreferrer">open pattern ↗</a>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <h2>Yardage by size</h2>
        <textarea
          value={yardageBySize}
          onChange={(e) => setYardageBySize(e.target.value)}
          rows={2}
          style={{ width: '100%' }}
          placeholder="S: 525yd, M: 575yd, L: 640yd, XL: 700yd"
        />
      </div>

      <div className="section">
        <h2>Notes</h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: '100%' }} />
      </div>

      <div className="section" style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSaveNotes} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="secondary" onClick={handleDelete}>
          Delete project
        </button>
      </div>

      <div className="section">
        <h2>Yarn that could work ({project.yarnMatches.length})</h2>
        {project.weightClass == null && <p className="muted">No weight set — can't match against stash.</p>}
        {project.weightClass != null && project.yarnMatches.length === 0 && (
          <p className="muted">Nothing in stash at this weight ({weightClassLabel(project.weightClass)}).</p>
        )}
        {project.yarnMatches.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Colorway</th>
                <th>Fiber</th>
                <th>Total yards</th>
                <th>Enough?</th>
              </tr>
            </thead>
            <tbody>
              {project.yarnMatches.map((m, i) => (
                <tr key={i}>
                  <td>{m.brand}</td>
                  <td>{m.colorName ?? m.color ?? '—'}</td>
                  <td>{m.fiber ?? '—'}</td>
                  <td>{Math.round(m.totalYards)}</td>
                  <td>
                    {m.meetsMin === null ? (
                      '—'
                    ) : (
                      <span className={`badge ${m.meetsMin ? 'good' : 'bad'}`}>
                        {m.meetsMin ? 'enough' : 'short'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

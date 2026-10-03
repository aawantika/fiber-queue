import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteProject, getProject, refreshProjectFromRavelry, updateProject } from '../api/client';
import { ProjectDetail, YarnComponent, YarnMatchGroup } from '../api/types';
import { WEIGHT_CLASS_OPTIONS, weightClassLabel } from '../weightClass';

function MatchTable({ matches }: { matches: YarnMatchGroup[] }) {
  if (matches.length === 0) return <p className="muted">Nothing in stash at this weight.</p>;
  return (
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
        {matches.map((m, i) => (
          <tr key={i}>
            <td>{m.brand}</td>
            <td>{m.colorName ?? m.color ?? '—'}</td>
            <td>{m.fiber ?? '—'}</td>
            <td>{Math.round(m.totalYards)}</td>
            <td>
              {m.meetsMin === null ? '—' : <span className={`badge ${m.meetsMin ? 'good' : 'bad'}`}>{m.meetsMin ? 'enough' : 'short'}</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [craft, setCraft] = useState('');
  const [designer, setDesigner] = useState('');
  const [weightClass, setWeightClass] = useState<number | null>(null);
  const [yardageMin, setYardageMin] = useState<number | null>(null);
  const [yardageMax, setYardageMax] = useState<number | null>(null);
  const [sizesAvailable, setSizesAvailable] = useState('');
  const [needleSizes, setNeedleSizes] = useState('');
  const [hookSizes, setHookSizes] = useState('');
  const [suggestedYarn, setSuggestedYarn] = useState('');
  const [yardageBySize, setYardageBySize] = useState('');
  const [notes, setNotes] = useState('');
  const [gauge, setGauge] = useState('');
  const [patternUrl, setPatternUrl] = useState('');
  const [components, setComponents] = useState<YarnComponent[]>([]);
  const [saving, setSaving] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageSaving, setImageSaving] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  function syncLocalState(p: ProjectDetail) {
    setProject(p);
    setName(p.name);
    setCategory(p.category ?? '');
    setCraft(p.craft ?? '');
    setDesigner(p.designer ?? '');
    setWeightClass(p.weightClass);
    setYardageMin(p.yardageMin);
    setYardageMax(p.yardageMax);
    setSizesAvailable(p.sizesAvailable ?? '');
    setNeedleSizes(p.needleSizes ?? '');
    setHookSizes(p.hookSizes ?? '');
    setSuggestedYarn(p.suggestedYarn ?? '');
    setYardageBySize(p.yardageBySize ?? '');
    setNotes(p.notes ?? '');
    setGauge(p.gauge ?? '');
    setPatternUrl(p.patternUrl ?? '');
    setImageUrlInput(p.imageSourceUrl ?? '');
    setComponents(p.componentMatches.map(({ matches, ...c }) => c));
  }

  useEffect(() => {
    if (!id) return;
    getProject(Number(id)).then(syncLocalState).catch((err) => setError(err.message));
  }, [id]);

  // imageSourceUrl/patternUrl are strict-URL-validated server-side; an empty
  // string (field left blank) isn't a valid URL, so it has to become null,
  // not "". Re-fetches afterward rather than trusting the PUT response,
  // since yarnMatches/componentMatches are only computed on GET.
  async function patch(fields: Partial<ProjectDetail>) {
    if (!project) return;
    const merged: any = { ...project, ...fields };
    if (merged.imageSourceUrl === '') merged.imageSourceUrl = null;
    if (merged.patternUrl === '') merged.patternUrl = null;
    await updateProject(project.id, merged);
    syncLocalState(await getProject(project.id));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await patch({
        name,
        category: category || null,
        craft: craft || null,
        designer: designer || null,
        weightClass,
        yardageMin,
        yardageMax,
        sizesAvailable: sizesAvailable || null,
        needleSizes: needleSizes || null,
        hookSizes: hookSizes || null,
        suggestedYarn: suggestedYarn || null,
        yardageBySize,
        notes,
        gauge,
        patternUrl,
        yarnComponents: JSON.stringify(components)
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateImage() {
    setImageSaving(true);
    setImageError(null);
    try {
      await patch({ imageSourceUrl: imageUrlInput });
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to update image');
    } finally {
      setImageSaving(false);
    }
  }

  async function handleRefresh() {
    if (!project) return;
    setRefreshing(true);
    try {
      await refreshProjectFromRavelry(project.id);
      syncLocalState(await getProject(project.id));
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDelete() {
    if (!project) return;
    if (!confirm(`Delete "${project.name}"?`)) return;
    await deleteProject(project.id);
    navigate('/');
  }

  function updateComponent(index: number, fields: Partial<YarnComponent>) {
    setComponents((cs) => cs.map((c, i) => (i === index ? { ...c, ...fields } : c)));
  }

  if (error) return <p className="muted">Error: {error}</p>;
  if (!project) return <p className="muted">Loading…</p>;

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ fontSize: 20, fontWeight: 700, width: '100%', border: 'none', background: 'transparent', padding: '4px 0', marginBottom: 16 }}
      />
      <div className="detail-layout">
        <div>
          {project.imagePath && <img className="detail-image" src={project.imagePath} alt={project.name} />}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, width: 280 }}>
            <input
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="paste image URL"
              style={{ flex: 1 }}
            />
            <button className="secondary" onClick={handleUpdateImage} disabled={imageSaving}>
              {imageSaving ? '…' : 'Update'}
            </button>
          </div>
          {imageError && <p className="muted" style={{ color: 'var(--bad)' }}>{imageError}</p>}
        </div>

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
          <div className="spec-row">
            <span className="label">Needs fixing</span>
            <input type="checkbox" checked={project.needsReview} onChange={(e) => patch({ needsReview: e.target.checked })} />
          </div>
          {project.patternFree && <div className="spec-row"><span className="label">Free pattern</span><span>yes</span></div>}
          <div className="spec-row">
            <span className="label">Category</span>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Cardigan, Socks, ..." style={{ textAlign: 'right' }} />
          </div>
          <div className="spec-row">
            <span className="label">Craft</span>
            <select value={craft} onChange={(e) => setCraft(e.target.value)}>
              <option value="">—</option>
              <option value="Knitting">Knitting</option>
              <option value="Crochet">Crochet</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <div className="spec-row">
            <span className="label">Designer</span>
            <input value={designer} onChange={(e) => setDesigner(e.target.value)} style={{ textAlign: 'right' }} />
          </div>
          <div className="spec-row">
            <span className="label">Weight</span>
            <select value={weightClass ?? ''} onChange={(e) => setWeightClass(e.target.value === '' ? null : Number(e.target.value))}>
              <option value="">—</option>
              {WEIGHT_CLASS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="spec-row">
            <span className="label">Yardage</span>
            <span style={{ display: 'flex', gap: 6 }}>
              <input type="number" value={yardageMin ?? ''} onChange={(e) => setYardageMin(e.target.value === '' ? null : Number(e.target.value))} placeholder="min" style={{ width: 70 }} />
              <input type="number" value={yardageMax ?? ''} onChange={(e) => setYardageMax(e.target.value === '' ? null : Number(e.target.value))} placeholder="max" style={{ width: 70 }} />
            </span>
          </div>
          <div className="spec-row">
            <span className="label">Sizes available</span>
            <input value={sizesAvailable} onChange={(e) => setSizesAvailable(e.target.value)} style={{ textAlign: 'right' }} />
          </div>
          <div className="spec-row">
            <span className="label">Needle size(s)</span>
            <input value={needleSizes} onChange={(e) => setNeedleSizes(e.target.value)} style={{ textAlign: 'right' }} />
          </div>
          <div className="spec-row">
            <span className="label">Hook size(s)</span>
            <input value={hookSizes} onChange={(e) => setHookSizes(e.target.value)} style={{ textAlign: 'right' }} />
          </div>
          <div className="spec-row"><span className="label">Gauge</span><span>{project.gauge ?? '—'}</span></div>
          <div className="spec-row">
            <span className="label">Suggested yarn</span>
            <input value={suggestedYarn} onChange={(e) => setSuggestedYarn(e.target.value)} style={{ textAlign: 'right' }} />
          </div>
          {project.ravelryUrl && (
            <div className="spec-row">
              <span className="label">Ravelry</span>
              <a href={project.ravelryUrl} target="_blank" rel="noreferrer">open on Ravelry ↗</a>
            </div>
          )}
          {project.patternUrl && project.patternUrl !== project.ravelryUrl && (
            <div className="spec-row">
              <span className="label">Pattern link</span>
              <a href={project.patternUrl} target="_blank" rel="noreferrer">open pattern ↗</a>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <h2>Gauge</h2>
        <input value={gauge} onChange={(e) => setGauge(e.target.value)} style={{ width: '100%' }} />
      </div>

      <div className="section">
        <h2>Pattern link</h2>
        <input
          value={patternUrl}
          onChange={(e) => setPatternUrl(e.target.value)}
          style={{ width: '100%' }}
          placeholder="designer's site, PDF shop, etc."
        />
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

      {components.length > 0 && (
        <div className="section">
          <h2>Yarn held together — per strand</h2>
          <p className="muted">
            This pattern is worked with multiple strands held together. Fill in the yardage each strand needs (usually
            in the designer's materials text, not a structured field) to match each one against stash separately.
          </p>
          {components.map((c, i) => (
            <div key={i} className="spec-row" style={{ alignItems: 'center' }}>
              <span className="label">
                {c.weightLabel ?? 'Unknown weight'} {c.yarnName ? `(${c.yarnName})` : ''}
              </span>
              <span style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  value={c.yardageMin ?? ''}
                  onChange={(e) => updateComponent(i, { yardageMin: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="min yd"
                  style={{ width: 80 }}
                />
                <input
                  type="number"
                  value={c.yardageMax ?? ''}
                  onChange={(e) => updateComponent(i, { yardageMax: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="max yd"
                  style={{ width: 80 }}
                />
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="section">
        <h2>Notes</h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: '100%' }} />
      </div>

      <div className="section" style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        {project.ravelryUrl && (
          <button className="secondary" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh from Ravelry'}
          </button>
        )}
        <button className="secondary" onClick={handleDelete}>
          Delete project
        </button>
      </div>

      <div className="section">
        <h2>
          {weightClassLabel(project.weightClass)} — yarn that could work ({project.yarnMatches.length})
        </h2>
        {project.weightClass == null && <p className="muted">No weight set — can't match against stash.</p>}
        {project.weightClass != null && <MatchTable matches={project.yarnMatches} />}
      </div>

      {project.componentMatches.map((c, i) => (
        <div className="section" key={i}>
          <h2>
            {c.weightLabel ?? 'Unknown weight'} strand — yarn that could work ({c.matches.length})
          </h2>
          {c.weightClass == null ? (
            <p className="muted">No weight on this strand — can't match against stash.</p>
          ) : (
            <MatchTable matches={c.matches} />
          )}
        </div>
      ))}
    </div>
  );
}

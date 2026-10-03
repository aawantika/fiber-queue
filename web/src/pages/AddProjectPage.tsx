import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addManualProject, addProjectFromRavelry } from '../api/client';
import { ManualProjectInput } from '../api/types';
import { WEIGHT_CLASS_OPTIONS } from '../weightClass';

export default function AddProjectPage() {
  const navigate = useNavigate();
  const [ravelryUrl, setRavelryUrl] = useState('');
  const [ravelryBusy, setRavelryBusy] = useState(false);
  const [ravelryError, setRavelryError] = useState<string | null>(null);

  const [manual, setManual] = useState<ManualProjectInput>({
    name: '',
    patternStatus: 'need_to_buy',
    status: 'queue'
  });
  const [manualBusy, setManualBusy] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  async function handleRavelrySubmit(e: FormEvent) {
    e.preventDefault();
    setRavelryBusy(true);
    setRavelryError(null);
    try {
      const project = await addProjectFromRavelry(ravelryUrl);
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setRavelryError(err instanceof Error ? err.message : 'Failed to add from Ravelry');
    } finally {
      setRavelryBusy(false);
    }
  }

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    setManualBusy(true);
    setManualError(null);
    try {
      const project = await addManualProject({
        ...manual,
        imageSourceUrl: manual.imageSourceUrl || null,
        patternUrl: manual.patternUrl || null
      });
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setManualError(err instanceof Error ? err.message : 'Failed to add project');
    } finally {
      setManualBusy(false);
    }
  }

  function field<K extends keyof ManualProjectInput>(key: K, value: ManualProjectInput[K]) {
    setManual((m) => ({ ...m, [key]: value }));
  }

  return (
    <div>
      <h1>Add project</h1>

      <section className="section">
        <h2>From a Ravelry link</h2>
        <p className="muted">Pulls name, category, craft, yardage, weight, needle/hook size, and photo automatically.</p>
        <form onSubmit={handleRavelrySubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            type="url"
            placeholder="https://www.ravelry.com/patterns/library/..."
            value={ravelryUrl}
            onChange={(e) => setRavelryUrl(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={ravelryBusy}>
            {ravelryBusy ? 'Fetching…' : 'Fetch'}
          </button>
        </form>
        {ravelryError && <p className="muted" style={{ color: 'var(--bad)' }}>{ravelryError}</p>}
      </section>

      <section className="section">
        <h2>Manual entry</h2>
        <p className="muted">For patterns that aren't on Ravelry at all.</p>
        <form onSubmit={handleManualSubmit} className="form-grid">
          <label className="full">
            Name
            <input value={manual.name} onChange={(e) => field('name', e.target.value)} required />
          </label>
          <label>
            Category
            <input value={manual.category ?? ''} onChange={(e) => field('category', e.target.value)} />
          </label>
          <label>
            Craft
            <select value={manual.craft ?? ''} onChange={(e) => field('craft', e.target.value || null)}>
              <option value="">—</option>
              <option value="Knitting">Knitting</option>
              <option value="Crochet">Crochet</option>
              <option value="Both">Both</option>
            </select>
          </label>
          <label>
            Designer
            <input value={manual.designer ?? ''} onChange={(e) => field('designer', e.target.value)} />
          </label>
          <label>
            Weight
            <select
              value={manual.weightClass ?? ''}
              onChange={(e) => field('weightClass', e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">—</option>
              {WEIGHT_CLASS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Yardage min
            <input
              type="number"
              value={manual.yardageMin ?? ''}
              onChange={(e) => field('yardageMin', e.target.value === '' ? null : Number(e.target.value))}
            />
          </label>
          <label>
            Yardage max
            <input
              type="number"
              value={manual.yardageMax ?? ''}
              onChange={(e) => field('yardageMax', e.target.value === '' ? null : Number(e.target.value))}
            />
          </label>
          <label>
            Needle size(s)
            <input value={manual.needleSizes ?? ''} onChange={(e) => field('needleSizes', e.target.value)} />
          </label>
          <label>
            Hook size(s)
            <input value={manual.hookSizes ?? ''} onChange={(e) => field('hookSizes', e.target.value)} />
          </label>
          <label>
            Gauge
            <input
              value={manual.gauge ?? ''}
              onChange={(e) => field('gauge', e.target.value)}
              placeholder="18 sts and 26 rows = 4 inches"
            />
          </label>
          <label className="full">
            Pattern link
            <input
              value={manual.patternUrl ?? ''}
              onChange={(e) => field('patternUrl', e.target.value)}
              placeholder="designer's site, PDF shop, etc."
            />
          </label>
          <label>
            Sizes available
            <input value={manual.sizesAvailable ?? ''} onChange={(e) => field('sizesAvailable', e.target.value)} />
          </label>
          <label>
            Pattern status
            <select value={manual.patternStatus} onChange={(e) => field('patternStatus', e.target.value as any)}>
              <option value="have">Have it</option>
              <option value="need_to_buy">Need to buy</option>
            </select>
          </label>
          <label className="full">
            Reference image URL
            <input value={manual.imageSourceUrl ?? ''} onChange={(e) => field('imageSourceUrl', e.target.value)} />
          </label>
          <label className="full">
            Notes
            <textarea value={manual.notes ?? ''} onChange={(e) => field('notes', e.target.value)} rows={3} />
          </label>
          <div className="full">
            <button type="submit" disabled={manualBusy}>
              {manualBusy ? 'Saving…' : 'Add project'}
            </button>
          </div>
        </form>
        {manualError && <p className="muted" style={{ color: 'var(--bad)' }}>{manualError}</p>}
      </section>
    </div>
  );
}

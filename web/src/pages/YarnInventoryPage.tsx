import { useEffect, useState } from 'react';
import { deleteYarnNote, getYarnNotes, getYarnSheetUrl, getYarns, saveYarnNote, syncYarns } from '../api/client';
import { Yarn, YarnNote } from '../api/types';
import { weightClassLabel } from '../weightClass';

function findNote(notes: YarnNote[], brand: string, colorName: string | null): YarnNote | null {
  return notes.find((n) => n.brand === brand && n.colorName === colorName) ?? notes.find((n) => n.brand === brand && n.colorName === null) ?? null;
}

export default function YarnInventoryPage() {
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [notes, setNotes] = useState<YarnNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

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

  function startEdit(y: Yarn) {
    const existing = findNote(notes, y.brand, y.colorName);
    setEditingKey(`${y.brand}::${y.colorName ?? ''}`);
    setEditText(existing?.note ?? '');
    setEditWholeBrand(existing ? existing.colorName === null : true);
  }

  async function handleSaveNote(y: Yarn) {
    setSaving(true);
    try {
      await saveYarnNote(y.brand, editWholeBrand ? null : y.colorName, editText);
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

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="muted">Error: {error}</p>;

  return (
    <div>
      <h1>Yarn inventory ({yarns.length})</h1>
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

      <table>
        <thead>
          <tr>
            <th>Brand</th>
            <th>Colorway</th>
            <th>Color</th>
            <th>Weight</th>
            <th>Fiber</th>
            <th>Yards</th>
            <th>Meters</th>
            <th>Suggested use</th>
          </tr>
        </thead>
        <tbody>
          {yarns.map((y) => {
            const key = `${y.brand}::${y.colorName ?? ''}`;
            const note = findNote(notes, y.brand, y.colorName);
            const isEditing = editingKey === key;
            return (
              <tr key={y.id}>
                <td>{y.brand}</td>
                <td>{y.colorName ?? '—'}</td>
                <td>{y.color ?? '—'}</td>
                <td>{weightClassLabel(y.weightClass)}</td>
                <td>{y.fiber ?? '—'}</td>
                <td>{y.yards != null ? Math.round(y.yards) : '—'}</td>
                <td>{y.yards != null ? Math.round(y.yards * 0.9144) : '—'}</td>
                <td style={{ minWidth: 220 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        placeholder="e.g. runs warm — prefer cardigans/open-front over pullovers"
                        style={{ width: '100%' }}
                      />
                      <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" checked={editWholeBrand} onChange={(e) => setEditWholeBrand(e.target.checked)} />
                        apply to all {y.brand} colorways
                      </label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleSaveNote(y)} disabled={saving || !editText.trim()}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="muted">{note?.note ?? '—'}</span>
                      <button className="secondary" onClick={() => startEdit(y)}>
                        {note ? 'Edit' : '+ Add'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

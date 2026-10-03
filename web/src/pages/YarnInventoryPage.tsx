import { useEffect, useState } from 'react';
import { getYarnSheetUrl, getYarns, syncYarns } from '../api/client';
import { Yarn } from '../api/types';
import { weightClassLabel } from '../weightClass';

export default function YarnInventoryPage() {
  const [yarns, setYarns] = useState<Yarn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);

  function load() {
    setLoading(true);
    getYarns()
      .then(setYarns)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);
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
          </tr>
        </thead>
        <tbody>
          {yarns.map((y) => (
            <tr key={y.id}>
              <td>{y.brand}</td>
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
    </div>
  );
}

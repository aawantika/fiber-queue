import { Link } from 'react-router-dom';
import { Project } from '../api/types';
import { deriveSectionName } from '../section';
import { weightClassLabel } from '../weightClass';

// Not alphabetical — "Uncategorized" always trails, and the rest follows a
// fixed preference order (garments roughly biggest/most-queued first).
// Anything that shows up later and isn't in the list falls in alphabetically
// before "Uncategorized" rather than disappearing.
const SECTION_ORDER = ['Tops', 'Cardigan', 'Pullover', 'Socks', 'Household'];

function sectionRank(name: string): number {
  if (name === 'Uncategorized') return Infinity;
  const i = SECTION_ORDER.indexOf(name);
  return i === -1 ? SECTION_ORDER.length : i;
}

export default function ProjectSections({ projects }: { projects: Project[] }) {
  const grouped = new Map<string, Project[]>();
  for (const p of projects) {
    const section = deriveSectionName(p.category);
    grouped.set(section, [...(grouped.get(section) ?? []), p]);
  }
  for (const items of grouped.values()) items.sort((a, b) => a.name.localeCompare(b.name));
  const sections = Array.from(grouped.entries()).sort(([a], [b]) => {
    const rankDiff = sectionRank(a) - sectionRank(b);
    return rankDiff !== 0 ? rankDiff : a.localeCompare(b);
  });

  if (projects.length === 0) return <p className="muted">Nothing here.</p>;

  return (
    <>
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
                    {p.status !== 'queue' && <span className="badge">{p.status.replace('_', ' ')}</span>}
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
    </>
  );
}

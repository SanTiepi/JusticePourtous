import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data', 'fiches');

// Load all domaines dynamically from JSON files
const domaines = readdirSync(dataDir)
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''));
const fichesMap = new Map();
const fichesByDomaine = new Map();

for (const d of domaines) {
  const raw = readFileSync(join(dataDir, `${d}.json`), 'utf-8');
  const fiches = JSON.parse(raw);
  fichesByDomaine.set(d, fiches);
  for (const f of fiches) {
    fichesMap.set(f.id, f);
  }
}

export function getAllFiches() {
  return [...fichesMap.values()];
}

export function getFicheById(id) {
  return fichesMap.get(id) || null;
}

export function getFichesByDomaine(domaine) {
  return fichesByDomaine.get(domaine) || [];
}

export function searchFiches(domaine, tags) {
  const fiches = getFichesByDomaine(domaine);
  if (!fiches.length) return [];
  if (!tags || !tags.length) return fiches;

  const normalizedTags = tags.map(t => t.toLowerCase());

  const scored = fiches.map(f => {
    const ficheTags = f.tags.map(t => t.toLowerCase());
    let score = 0;
    for (const tag of normalizedTags) {
      for (const ft of ficheTags) {
        if (ft.includes(tag) || tag.includes(ft)) {
          score++;
        }
      }
    }
    return { fiche: f, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).map(s => s.fiche);
}

export function getDomaines() {
  return domaines;
}

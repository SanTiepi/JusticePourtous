import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const statsPath = join(__dirname, '..', 'data', 'statistiques', 'stats-procedures.json');
const statsData = JSON.parse(readFileSync(statsPath, 'utf-8'));

/**
 * Retourne toutes les statistiques de procedures juridiques.
 */
export function getAllStatistiques() {
  return { status: 200, data: { statistiques: statsData, total: statsData.length } };
}

/**
 * Retourne les statistiques filtrees par domaine.
 * @param {string} domaine - Le domaine juridique (bail, travail, famille, etc.)
 */
export function getStatistiquesByDomaine(domaine) {
  const filtered = statsData.filter(s => s.domaine === domaine);
  if (filtered.length === 0) {
    const domaines = [...new Set(statsData.map(s => s.domaine))];
    return {
      status: 404,
      error: `Aucune statistique trouvee pour le domaine "${domaine}". Domaines disponibles: ${domaines.join(', ')}`
    };
  }
  return { status: 200, data: { statistiques: filtered, domaine, total: filtered.length } };
}

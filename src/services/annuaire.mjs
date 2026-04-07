import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, '..', 'data', 'annuaire.json');
const annuaire = JSON.parse(readFileSync(dataPath, 'utf-8'));

export function getServicesByCanton(canton) {
  if (!canton) return [];
  const key = canton.toUpperCase();
  return annuaire[key] || [];
}

export function getAllCantons() {
  return Object.keys(annuaire);
}

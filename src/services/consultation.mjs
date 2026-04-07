import { searchFiches, getFichesByDomaine } from './fiches.mjs';

const VALID_DOMAINES = ['bail', 'travail', 'famille', 'dettes', 'etrangers'];
const VALID_CANTONS = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR',
  'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG',
  'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH'
];

export function consulter({ domaine, reponses, canton }) {
  if (!domaine || !VALID_DOMAINES.includes(domaine)) {
    return { error: 'Domaine invalide', status: 400 };
  }

  if (!reponses || !Array.isArray(reponses) || reponses.length === 0) {
    return { error: 'Reponses manquantes', status: 400 };
  }

  if (canton && !VALID_CANTONS.includes(canton.toUpperCase())) {
    return { error: 'Canton invalide', status: 400 };
  }

  const normalizedCanton = canton ? canton.toUpperCase() : null;

  // Extract tags from responses for matching
  const tags = reponses
    .filter(r => r && typeof r === 'string')
    .map(r => r.toLowerCase().replace(/[^a-z0-9\u00e0-\u00ff ]/g, '').trim())
    .filter(Boolean);

  let results = searchFiches(domaine, tags);

  // If no match by tags, return first fiche of domaine
  if (results.length === 0) {
    results = getFichesByDomaine(domaine);
  }

  if (results.length === 0) {
    return { error: 'Aucune fiche trouvee', status: 404 };
  }

  const fiche = results[0];

  // Filter services by canton if provided
  let services = fiche.reponse.services || [];
  if (normalizedCanton) {
    const cantonServices = services.filter(s => s.canton === normalizedCanton);
    if (cantonServices.length > 0) {
      services = cantonServices;
    }
  }

  return {
    status: 200,
    data: {
      fiche: {
        ...fiche,
        reponse: {
          ...fiche.reponse,
          services
        }
      },
      alternatives: results.slice(1, 4).map(f => ({ id: f.id, domaine: f.domaine, tags: f.tags }))
    }
  };
}

export function getQuestionsForDomaine(domaineId) {
  if (!VALID_DOMAINES.includes(domaineId)) {
    return { error: 'Domaine invalide', status: 400 };
  }

  const fiches = getFichesByDomaine(domaineId);
  if (fiches.length === 0) {
    return { error: 'Aucune fiche pour ce domaine', status: 404 };
  }

  // Use questions from the first fiche as template for the domaine
  const questions = fiches[0].questions;

  return {
    status: 200,
    data: { domaine: domaineId, questions }
  };
}

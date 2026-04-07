import { getFicheById } from './fiches.mjs';

const VALID_TYPES = ['mise_en_demeure', 'contestation', 'opposition', 'resiliation', 'plainte'];

const DISCLAIMER = "AVERTISSEMENT : Cette lettre est generee automatiquement a titre de modele. Elle ne constitue PAS un document juridique definitif. Faites-la relire par un professionnel du droit avant envoi. JusticePourtous decline toute responsabilite.";

const TYPE_LABELS = {
  mise_en_demeure: 'Mise en demeure',
  contestation: 'Contestation',
  opposition: 'Opposition',
  resiliation: 'Resiliation',
  plainte: 'Plainte'
};

function formatDate() {
  const d = new Date();
  const months = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function fillPlaceholders(template, userContext) {
  let text = template;
  const ctx = userContext || {};

  text = text.replace(/\[adresse\]/gi, ctx.adresse || '[votre adresse]');
  text = text.replace(/\[date\]/gi, ctx.dateEvenement || '[date de l\'evenement]');
  text = text.replace(/\[source\]/gi, ctx.source || '[source du probleme]');
  text = text.replace(/\[description[^\]]*\]/gi, ctx.description || '[description detaillee]');
  text = text.replace(/\[Signature\]/gi, ctx.nom || '[Votre nom et prenom]');
  text = text.replace(/\[nom[^\]]*\]/gi, ctx.nom || '[Votre nom]');

  return text;
}

function buildSwissLetterFormat({ nom, adresse, lieu, destinataire, objet, corps, type }) {
  const dateStr = formatDate();
  const senderName = nom || '[Votre nom et prenom]';
  const senderAddress = adresse || '[Votre adresse]\n[NPA Localite]';
  const dest = destinataire || '[Nom du destinataire]\n[Adresse du destinataire]\n[NPA Localite]';
  const locationStr = lieu || '[Localite]';

  return `${senderName}
${senderAddress}

${dest}

${locationStr}, le ${dateStr}

Envoi en recommande

Objet : ${objet || TYPE_LABELS[type] || type}

${corps}

Dans l'attente de votre reponse, je vous prie d'agreer, Madame, Monsieur, mes salutations distinguees.

${senderName}

---
${DISCLAIMER}`;
}

function generateTemplateFromFiche(fiche, userContext, type) {
  const modele = fiche.reponse.modeleLettre || '';
  const articles = fiche.reponse.articles || [];

  if (modele) {
    // Use existing template, fill placeholders
    const corps = fillPlaceholders(modele, userContext);
    // Extract the "Objet" line from the template if present
    const objetMatch = corps.match(/Objet\s*:\s*(.+)/);
    const objet = objetMatch ? objetMatch[1].trim() : `${TYPE_LABELS[type]} — ${fiche.sousDomaine}`;
    // Remove the Objet line from corps since we put it in the header
    const corpsClean = corps.replace(/Objet\s*:.+\n?/, '').trim();

    return buildSwissLetterFormat({
      nom: userContext?.nom,
      adresse: userContext?.adresse,
      lieu: userContext?.lieu,
      destinataire: userContext?.destinataire,
      objet,
      corps: corpsClean,
      type
    });
  }

  // No template in fiche — generate a generic one
  const articlesStr = articles.map(a => `${a.ref} (${a.titre})`).join(', ');
  const corps = `Par la presente, je me permets de vous adresser cette ${TYPE_LABELS[type].toLowerCase()} concernant ${fiche.sousDomaine} dans le domaine ${fiche.domaine}.

${userContext?.description || '[Description de votre situation]'}

Conformement aux dispositions legales applicables${articlesStr ? ' (' + articlesStr + ')' : ''}, je vous demande de bien vouloir donner suite a la presente dans un delai de 30 jours.

Je me reserve le droit de saisir les autorites competentes en cas d'absence de reponse.`;

  return buildSwissLetterFormat({
    nom: userContext?.nom,
    adresse: userContext?.adresse,
    lieu: userContext?.lieu,
    destinataire: userContext?.destinataire,
    objet: `${TYPE_LABELS[type]} — ${fiche.domaine} / ${fiche.sousDomaine}`,
    corps,
    type
  });
}

async function callClaudeForLetter(fiche, userContext, type) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `Tu es un redacteur juridique suisse. Tu rediges des lettres formelles en francais selon le format suisse standard.

FICHE DE REFERENCE :
Domaine: ${fiche.domaine}
Explication: ${fiche.reponse.explication}
Articles: ${fiche.reponse.articles.map(a => `${a.ref}: ${a.titre}`).join(', ')}

MODELE DE BASE :
${fiche.reponse.modeleLettre || 'Aucun modele disponible'}

REGLES :
- Format lettre suisse (expediteur, destinataire, lieu/date, objet, corps, salutations)
- Cite les articles de loi pertinents
- Ton formel et professionnel
- Pas de jargon inutile`;

  const userPrompt = `Redige une lettre de type "${TYPE_LABELS[type]}" pour cette situation :
${JSON.stringify(userContext)}

Retourne UNIQUEMENT le corps de la lettre (sans en-tete ni signature, je les ajouterai).`;

  const body = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body
  });

  if (!resp.ok) {
    throw new Error(`Anthropic API error ${resp.status}`);
  }

  const data = await resp.json();
  return data.content[0].text;
}

/**
 * Generate a personalized letter.
 * @param {Object} params
 * @param {string} params.ficheId - Fiche ID
 * @param {Object} params.userContext - User details (nom, adresse, lieu, destinataire, description, dateEvenement)
 * @param {string} params.type - Letter type (mise_en_demeure, contestation, opposition, resiliation, plainte)
 * @returns {Promise<{lettre: string, type: string, cost: number, disclaimer: string}>}
 */
export async function generateLetter({ ficheId, userContext, type }) {
  if (!ficheId) throw new Error('ficheId requis');
  if (!type || !VALID_TYPES.includes(type)) {
    throw new Error(`Type invalide. Types acceptes : ${VALID_TYPES.join(', ')}`);
  }

  const fiche = getFicheById(ficheId);
  if (!fiche) throw new Error(`Fiche "${ficheId}" introuvable`);

  // With API key → Claude-personalized letter
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const corps = await callClaudeForLetter(fiche, userContext || {}, type);
      const lettre = buildSwissLetterFormat({
        nom: userContext?.nom,
        adresse: userContext?.adresse,
        lieu: userContext?.lieu,
        destinataire: userContext?.destinataire,
        objet: `${TYPE_LABELS[type]} — ${fiche.sousDomaine}`,
        corps,
        type
      });
      return { lettre, type, cost: 5, disclaimer: DISCLAIMER, mode: 'api' };
    } catch {
      // Fallback to template
    }
  }

  // No API key or API failed → template mode
  const lettre = generateTemplateFromFiche(fiche, userContext || {}, type);
  return { lettre, type, cost: 5, disclaimer: DISCLAIMER, mode: 'template' };
}

export { VALID_TYPES, DISCLAIMER };

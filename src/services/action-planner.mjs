/**
 * Action Planner — Génère un plan d'action concret
 *
 * Transforme une fiche enrichie en guide étape par étape :
 * "Voici votre situation. Voici quoi faire. Dans cet ordre. Avec ces documents.
 *  Attention à ces pièges. Voici les contacts."
 *
 * C'est ce qui nous différencie de Swisslex (encyclopédie) et ChatGPT (réponse vague).
 */

/**
 * Generate an action plan from enriched fiche data
 * @param {object} enriched - Result from knowledge-engine queryComplete
 * @param {string} canton - User's canton for localized services
 * @returns {object} Structured action plan
 */
export function generateActionPlan(enriched, canton) {
  if (!enriched?.fiche) return null;

  const { fiche, articles, jurisprudence, templates, delais, antiErreurs,
          patterns, preuves, escalade, cascades, confiance, lacunes } = enriched;

  // Find the most relevant pattern for this situation
  const pattern = patterns[0]; // First match by domain

  // Build the action plan
  const plan = {
    titre: `Plan d'action : ${fiche.reponse?.explication?.slice(0, 80)}...`,
    domaine: fiche.domaine,
    confiance,
    canton: canton || null,

    // 1. Diagnostic
    diagnostic: {
      situation: fiche.reponse?.explication?.slice(0, 300),
      qualification: `Domaine : ${fiche.domaine}. Sous-domaine : ${fiche.sousDomaine || '-'}.`,
      baseLegale: (fiche.reponse?.articles || []).map(a => `${a.ref} — ${a.titre || ''}`),
      jurisprudenceCle: jurisprudence.slice(0, 3).map(j => ({
        ref: j.signature,
        principe: j.principeCle || j.resume?.slice(0, 150),
        resultat: j.resultat,
        montant: j.montant
      }))
    },

    // 2. Étapes (ordonnées)
    etapes: buildSteps(fiche, pattern, delais, preuves, templates, canton),

    // 3. Pièges à éviter
    pieges: antiErreurs.slice(0, 5).map(ae => ({
      erreur: ae.erreur,
      gravite: ae.gravite,
      consequence: ae.consequence,
      correction: ae.correction
    })),

    // 4. Documents à réunir
    documents: buildDocumentList(preuves, fiche.domaine),

    // 5. Délais critiques
    delaisCritiques: delais
      .filter(d => d.domaine === fiche.domaine)
      .slice(0, 5)
      .map(d => ({
        procedure: d.procedure,
        delai: d.delai,
        consequence: d.consequence,
        attention: d.attention
      })),

    // 6. Contacts utiles
    contacts: buildContacts(escalade, canton),

    // 7. Templates disponibles
    lettresDisponibles: templates.slice(0, 5).map(t => ({
      id: t.id,
      titre: t.titre,
      type: t.type
    })),

    // 8. Ce qui peut suivre (cascade)
    cascadePotentielle: cascades.length > 0 ? {
      avertissement: "Attention : cette situation peut entraîner d'autres problèmes juridiques",
      etapesSuivantes: cascades[0].etapes?.map(e => ({
        probleme: e.probleme,
        delai: e.delai,
        fiches: e.fichesConcernees
      }))
    } : null,

    // 9. Ce qu'on ne sait pas
    limites: [
      ...lacunes.map(l => l.message),
      'Cette analyse ne remplace pas un conseil juridique personnalisé.',
      confiance === 'variable' ? 'La jurisprudence varie selon le canton et le juge.' : null,
      confiance === 'incertain' ? 'Peu de jurisprudence disponible — consultez un professionnel.' : null,
    ].filter(Boolean),

    // Meta
    _meta: {
      ficheId: fiche.id,
      generatedAt: new Date().toISOString(),
      sourcesCount: articles.length + jurisprudence.length,
      confianceLevel: confiance
    }
  };

  return plan;
}

function buildSteps(fiche, pattern, delais, preuves, templates, canton) {
  const steps = [];
  let stepNum = 1;

  // If pattern has strategieOptimale, use it as base
  if (pattern?.strategieOptimale) {
    for (const action of pattern.strategieOptimale) {
      steps.push({
        numero: stepNum++,
        action,
        type: 'strategie',
        source: 'Expérience praticien'
      });
    }
  } else {
    // Generate generic steps from fiche data
    // Step 1: Document
    steps.push({
      numero: stepNum++,
      action: 'Rassemblez toutes les preuves et documents (photos datées, courriers, contrats)',
      type: 'preparation',
      source: 'Procédure standard'
    });

    // Step 2: Check deadlines
    const relevantDeadline = delais.find(d => d.domaine === fiche.domaine);
    if (relevantDeadline) {
      steps.push({
        numero: stepNum++,
        action: `Vérifiez le délai : ${relevantDeadline.procedure} — ${relevantDeadline.delai}. ${relevantDeadline.attention || ''}`,
        type: 'delai',
        source: relevantDeadline.base_legale
      });
    }

    // Step 3: Written notice
    const template = templates.find(t => t.type === 'mise_en_demeure' || t.type === 'contestation');
    if (template) {
      steps.push({
        numero: stepNum++,
        action: `Envoyez un courrier recommandé (modèle disponible : "${template.titre}")`,
        type: 'action',
        templateId: template.id,
        source: template.baseLegale
      });
    }

    // Step 4: Contact help
    steps.push({
      numero: stepNum++,
      action: 'Contactez une association spécialisée pour un avis gratuit (voir contacts ci-dessous)',
      type: 'escalade',
      source: 'Recommandation'
    });

    // Step 5: Legal procedure
    steps.push({
      numero: stepNum++,
      action: 'Si aucune solution amiable : déposez une requête auprès de l\'autorité compétente (conciliation ou tribunal)',
      type: 'procedure',
      source: 'Procédure légale'
    });
  }

  // Add "never do" warnings from pattern
  if (pattern?.neJamaisFaire?.length > 0) {
    steps.push({
      numero: stepNum++,
      action: `⚠ NE FAITES SURTOUT PAS : ${pattern.neJamaisFaire[0]}`,
      type: 'avertissement',
      source: 'Erreur fréquente'
    });
  }

  return steps;
}

function buildDocumentList(preuves, domaine) {
  const relevantPreuves = preuves.filter(p => p.domaine === domaine);
  if (relevantPreuves.length === 0) {
    return [{
      categorie: 'Documents de base',
      items: ['Pièce d\'identité', 'Contrat/bail/document principal', 'Correspondance échangée']
    }];
  }

  return relevantPreuves.slice(0, 3).map(p => ({
    procedure: p.procedure,
    necessaires: p.preuves_necessaires?.slice(0, 5) || [],
    utiles: p.preuves_utiles?.slice(0, 3) || [],
    attention: p.attention
  }));
}

function buildContacts(escalade, canton) {
  let contacts = escalade;

  // Filter by canton if specified
  if (canton) {
    const c = canton.toUpperCase();
    contacts = contacts.filter(e =>
      e.cantons?.includes(c) || !e.cantons?.length
    );
  }

  return contacts.slice(0, 5).map(e => ({
    nom: e.nom,
    type: e.type,
    gratuit: e.gratuit,
    conditions: e.conditions,
    contact: e.contact,
    delaiReponse: e.delaiReponse
  }));
}

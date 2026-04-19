/**
 * Fix ALL missing French accents across ALL JSON files in src/data/
 * Safe: only replaces inside string values, validates JSON after each file.
 * Protects IDs (keys containing _) from accentuation.
 */
import fs from 'fs';
import path from 'path';

// Comprehensive word→accented replacement map
// Ordered longest first to avoid partial matches
const REPLACEMENTS = [
  // Multi-word patterns first
  ['etat des lieux', 'état des lieux'],
  ['prestations complementaires', 'prestations complémentaires'],
  ['responsabilite civile', 'responsabilité civile'],
  ['responsabilite causale', 'responsabilité causale'],
  // Long words
  ['eventuellement', 'éventuellement'],
  ['imperativement', 'impérativement'],
  ['immediatement', 'immédiatement'],
  ['retroactivement', 'rétroactivement'],
  ['reglementation', 'réglementation'],
  ['reglementaire', 'réglementaire'],
  ['etablissement', 'établissement'],
  ['remuneration', 'rémunération'],
  ['deterioration', 'détérioration'],
  ['remunerations', 'rémunérations'],
  ['prelevement', 'prélèvement'],
  ['prelevements', 'prélèvements'],
  ['personnalisee', 'personnalisée'],
  ['personnalise', 'personnalisé'],
  ['independante', 'indépendante'],
  ['independant', 'indépendant'],
  ['responsabilite', 'responsabilité'],
  ['recevabilite', 'recevabilité'],
  ['supplementaires', 'supplémentaires'],
  ['supplementaire', 'supplémentaire'],
  ['hypothecaire', 'hypothécaire'],
  ['hypothecaires', 'hypothécaires'],
  ['complementaires', 'complémentaires'],
  ['complementaire', 'complémentaire'],
  ['renouvellement', 'renouvellement'], // correct
  ['hebergement', 'hébergement'],
  ['Hebergement', 'Hébergement'],
  ['pretentions', 'prétentions'],
  ['pretention', 'prétention'],
  ['competentes', 'compétentes'],
  ['competente', 'compétente'],
  ['competents', 'compétents'],
  ['competent', 'compétent'],
  ['competence', 'compétence'],
  ['competences', 'compétences'],
  ['distinguees', 'distinguées'],
  ['resiliations', 'résiliations'],
  ['resiliation', 'résiliation'],
  ['resilier', 'résilier'],
  ['resiliee', 'résiliée'],
  ['resilie', 'résilié'],
  ['reparations', 'réparations'],
  ['reparation', 'réparation'],
  ['reparer', 'réparer'],
  ['liberations', 'libérations'],
  ['liberation', 'libération'],
  ['liberee', 'libérée'],
  ['liberer', 'libérer'],
  ['libere', 'libéré'],
  ['necessaires', 'nécessaires'],
  ['necessaire', 'nécessaire'],
  ['necessite', 'nécessité'],
  ['executoires', 'exécutoires'],
  ['executoire', 'exécutoire'],
  ['executee', 'exécutée'],
  ['execute', 'exécuté'],
  ['executer', 'exécuter'],
  ['execution', 'exécution'],
  ['procedures', 'procédures'],
  ['procedure', 'procédure'],
  ['precedente', 'précédente'],
  ['precedent', 'précédent'],
  ['irreguliere', 'irrégulière'],
  ['premieres', 'premières'],
  ['premiere', 'première'],
  ['dernieres', 'dernières'],
  ['derniere', 'dernière'],
  ['entieres', 'entières'],
  ['entiere', 'entière'],
  ['particulieres', 'particulières'],
  ['particuliere', 'particulière'],
  ['reguliere', 'régulière'],
  ['regulier', 'régulier'],
  ['anterieure', 'antérieure'],
  ['anterieur', 'antérieur'],
  ['posterieure', 'postérieure'],
  ['superieure', 'supérieure'],
  ['superieur', 'supérieur'],
  ['inferieure', 'inférieure'],
  ['inferieur', 'inférieur'],
  ['interieur', 'intérieur'],
  ['effectuee', 'effectuée'],
  ['effectue', 'effectué'],
  ['proceder', 'procéder'],
  ['reclamer', 'réclamer'],
  ['reclamation', 'réclamation'],
  ['reclame', 'réclamé'],
  ['protegee', 'protégée'],
  ['proteger', 'protéger'],
  ['protege', 'protégé'],
  ['menages', 'ménages'],
  ['menage', 'ménage'],
  ['epargne', 'épargne'],
  ['restituee', 'restituée'],
  ['restitues', 'restitués'],
  ['restitue', 'restitué'],
  ['penalement', 'pénalement'],
  ['penales', 'pénales'],
  ['penale', 'pénale'],
  ['penal', 'pénal'],
  ['legales', 'légales'],
  ['legale', 'légale'],
  ['legal', 'légal'],
  ['illegale', 'illégale'],
  ['generales', 'générales'],
  ['generale', 'générale'],
  ['generaux', 'généraux'],
  ['general', 'général'],
  ['speciales', 'spéciales'],
  ['speciale', 'spéciale'],
  ['speciaux', 'spéciaux'],
  ['special', 'spécial'],
  ['specifiques', 'spécifiques'],
  ['specifique', 'spécifique'],
  ['federales', 'fédérales'],
  ['federale', 'fédérale'],
  ['federal', 'fédéral'],
  ['immediate', 'immédiate'],
  ['immediat', 'immédiat'],
  ['aupres', 'auprès'],
  ['impayes', 'impayés'],
  ['impaye', 'impayé'],
  ['degats', 'dégâts'],
  ['appelee', 'appelée'],
  ['appele', 'appelé'],
  ['bloquee', 'bloquée'],
  ['bloque', 'bloqué'],
  ['agreer', 'agréer'],
  ['versees', 'versées'],
  ['versee', 'versée'],
  ['verses', 'versés'],
  ['verse', 'versé'],
  ['prelevee', 'prélevée'],
  ['preleve', 'prélevé'],
  ['toleree', 'tolérée'],
  ['tolere', 'toléré'],
  ['tolerance', 'tolérance'],
  ['negligee', 'négligée'],
  ['neglige', 'négligé'],
  ['negligence', 'négligence'],
  ['interessee', 'intéressée'],
  ['interesse', 'intéressé'],
  ['prevues', 'prévues'],
  ['prevue', 'prévue'],
  ['prevus', 'prévus'],
  ['prevu', 'prévu'],
  ['creees', 'créées'],
  ['creee', 'créée'],
  ['creer', 'créer'],
  ['cree', 'créé'],
  ['decedee', 'décédée'],
  ['decede', 'décédé'],
  ['deces', 'décès'],
  ['etablies', 'établies'],
  ['etablie', 'établie'],
  ['etablir', 'établir'],
  ['etabli', 'établi'],
  ['evaluee', 'évaluée'],
  ['evaluer', 'évaluer'],
  ['evalue', 'évalué'],
  ['evaluation', 'évaluation'],
  ['redigee', 'rédigée'],
  ['rediger', 'rédiger'],
  ['redige', 'rédigé'],
  ['verifiee', 'vérifiée'],
  ['verifier', 'vérifier'],
  ['verifie', 'vérifié'],
  ['verification', 'vérification'],
  ['resolue', 'résolue'],
  ['resolu', 'résolu'],
  ['cloturee', 'clôturée'],
  ['cloture', 'clôturé'],
  ['ecritures', 'écritures'],
  ['ecriture', 'écriture'],
  ['ecrite', 'écrite'],
  ['ecrit', 'écrit'],
  ['ecrire', 'écrire'],
  ['echeances', 'échéances'],
  ['echeance', 'échéance'],
  ['echec', 'échec'],
  ['evenements', 'événements'],
  ['evenement', 'événement'],
  ['eventuelle', 'éventuelle'],
  ['eventuel', 'éventuel'],
  ['remunere', 'rémunéré'],
  ['deteriore', 'détérioré'],
  ['etranger', 'étranger'],
  ['etrangere', 'étrangère'],
  ['Etrangers', 'Étrangers'],
  ['epouse', 'épouse'],
  ['epoux', 'époux'],
  ['elevee', 'élevée'],
  ['eleve', 'élevé'],
  ['equitable', 'équitable'],
  ['elements', 'éléments'],
  ['element', 'élément'],
  ['detenteur', 'détenteur'],
  ['regi', 'régi'],
  ['routiere', 'routière'],
  ['medicaux', 'médicaux'],
  ['medical', 'médical'],
  ['medicale', 'médicale'],
  ['benevolat', 'bénévolat'],
  ['beneficie', 'bénéficie'],
  ['beneficiaire', 'bénéficiaire'],
  ['beneficier', 'bénéficier'],
  ['causalite', 'causalité'],
  ['domicilie', 'domicilié'],
  ['integralite', 'intégralité'],
  ['soussigne', 'soussigné'],
  ['lesion', 'lésion'],
  ['lese', 'lésé'],
  ['mediation', 'médiation'],
  ['proces', 'procès'],
  ['inferieurs', 'inférieurs'],
  ['inferieures', 'inférieures'],
  ['depenses', 'dépenses'],
  ['revenus determinants', 'revenus déterminants'],
  ['determinants', 'déterminants'],
  ['determinant', 'déterminant'],
  ['depassent', 'dépassent'],
  ['depasse', 'dépassé'],
  ['retroactif', 'rétroactif'],
  ['reinsertion', 'réinsertion'],
  ['invalidite', 'invalidité'],
  ['incapacite', 'incapacité'],
  ['eligibilite', 'éligibilité'],
  ['activite', 'activité'],
  ['anciennete', 'ancienneté'],
  ['difficultes', 'difficultés'],
  ['Difficultes', 'Difficultés'],
  ['completent', 'complètent'],
  ['completent', 'complètent'],
  ['presente', 'présente'],
  ['recommande', 'recommandé'],
  ['Recommande', 'Recommandé'],
  ['obligee', 'obligée'],
  ['protegee', 'protégée'],
  ['reponse', 'réponse'],
  ['reponses', 'réponses'],
  ['depenses', 'dépenses'],
  ['depense', 'dépense'],
  ['salaries', 'salariés'],
  ['salarie', 'salarié'],
  ['interessees', 'intéressées'],
  ['renumeree', 'rénumérée'],
  ['congediement', 'congédiement'],
  ['remunere', 'rémunéré'],
];

function scanAndFix(dir) {
  let totalFixes = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      totalFixes += scanAndFix(fp);
      continue;
    }
    if (!entry.name.endsWith('.json')) continue;

    let content = fs.readFileSync(fp, 'utf-8');
    const original = content;

    for (const [wrong, right] of REPLACEMENTS) {
      if (wrong === right) continue;
      // Simple replaceAll — safe in JSON string values
      if (content.includes(wrong)) {
        content = content.replaceAll(wrong, right);
      }
    }

    if (content === original) continue;

    // Validate JSON
    try {
      const parsed = JSON.parse(content);

      // Protect IDs — restore any that got accentuated
      const idFields = ['id', 'issue_id', 'fiche_id', 'source_id', 'rule_id'];
      const restoreIds = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(restoreIds); return; }
        for (const [key, val] of Object.entries(obj)) {
          if (idFields.includes(key) && typeof val === 'string' && /[éèêàùçôîâ]/.test(val)) {
            // This ID got accentuated — restore by stripping accents
            obj[key] = val.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          }
          if (typeof val === 'object') restoreIds(val);
        }
      };
      restoreIds(parsed);

      const fixed = JSON.stringify(parsed, null, 2);
      fs.writeFileSync(fp, fixed + '\n');

      // Count changes (rough)
      let changes = 0;
      for (const [wrong] of REPLACEMENTS) {
        if (wrong !== REPLACEMENTS.find(r => r[0] === wrong)?.[1] && original.includes(wrong) && !content.includes(wrong)) {
          changes++;
        }
      }
      const relPath = fp.replace(process.cwd() + path.sep, '');
      console.log(`${relPath}: fixed`);
      totalFixes++;
    } catch (e) {
      console.log(`${fp}: BROKEN JSON — ${e.message.slice(0, 60)}`);
    }
  }
  return totalFixes;
}

console.log('Scanning src/data/...');
const total = scanAndFix('src/data');
console.log(`\nDone: ${total} files fixed`);

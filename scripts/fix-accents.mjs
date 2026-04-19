import fs from 'fs';
import path from 'path';

const REPLACEMENTS = [
  ['imperativement', 'impérativement'],
  ['immediatement', 'immédiatement'],
  ['eventuellement', 'éventuellement'],
  ['deterioration', 'détérioration'],
  ['remunerations', 'rémunérations'],
  ['remuneration', 'rémunération'],
  ['prelevement', 'prélèvement'],
  ['prelevements', 'prélèvements'],
  ['reglementation', 'réglementation'],
  ['reglementaire', 'réglementaire'],
  ['etablissement', 'établissement'],
  ['etablissements', 'établissements'],
  ['pretentions', 'prétentions'],
  ['pretention', 'prétention'],
  ['competentes', 'compétentes'],
  ['competente', 'compétente'],
  ['competents', 'compétents'],
  ['competent', 'compétent'],
  ['competence', 'compétence'],
  ['competences', 'compétences'],
  ['independante', 'indépendante'],
  ['independant', 'indépendant'],
  ['distinguees', 'distinguées'],
  ['distinguee', 'distinguée'],
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
  ['irregulier', 'irrégulier'],
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
  ['posterieur', 'postérieur'],
  ['interieure', 'intérieure'],
  ['interieur', 'intérieur'],
  ['superieure', 'supérieure'],
  ['superieur', 'supérieur'],
  ['inferieure', 'inférieure'],
  ['inferieur', 'inférieur'],
  ['effectuee', 'effectuée'],
  ['effectue', 'effectué'],
  ['proceder', 'procéder'],
  ['reclamer', 'réclamer'],
  ['reclamation', 'réclamation'],
  ['reclamee', 'réclamée'],
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
  ['specifique', 'spécifique'],
  ['specifiques', 'spécifiques'],
  ['federales', 'fédérales'],
  ['federale', 'fédérale'],
  ['federal', 'fédéral'],
  ['immediate', 'immédiate'],
  ['immediat', 'immédiat'],
  ['aupres', 'auprès'],
  ['impayes', 'impayés'],
  ['impayee', 'impayée'],
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
  ['ecrites', 'écrites'],
  ['ecrite', 'écrite'],
  ['ecrit', 'écrit'],
  ['ecrire', 'écrire'],
  ['echeances', 'échéances'],
  ['echeance', 'échéance'],
  ['echec', 'échec'],
  ['evenements', 'événements'],
  ['evenement', 'événement'],
  ['eventuelles', 'éventuelles'],
  ['eventuelle', 'éventuelle'],
  ['eventuel', 'éventuel'],
  ['remunere', 'rémunéré'],
  ['remuneree', 'rémunérée'],
  ['deteriore', 'détérioré'],
  ['repertorie', 'répertorié'],
  ['etranger', 'étranger'],
  ['etrangere', 'étrangère'],
  ['etrangers', 'étrangers'],
  ['etrangeres', 'étrangères'],
  ['epouse', 'épouse'],
  ['epoux', 'époux'],
  ['eleve', 'élevé'],
  ['elevee', 'élevée'],
  ['equitable', 'équitable'],
  ['element', 'élément'],
  ['elements', 'éléments'],
];

// IDs that must NOT be accentuated
const PROTECTED_IDS = new Set();

const dir = 'src/data/fiches';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
let totalFixes = 0;

for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf-8');
  let fixes = 0;

  // Collect all IDs to protect
  const data = JSON.parse(content);
  for (const fiche of data) {
    if (fiche.id) PROTECTED_IDS.add(fiche.id);
  }

  for (const [wrong, right] of REPLACEMENTS) {
    if (wrong === right) continue;
    // Match word boundaries using lookbehind/lookahead for non-alphanumeric
    const re = new RegExp(`(?<=[" ,.;:!?'(\\-/]|^)${wrong}(?=[" ,.;:!?'()\\-/\\\\n]|$)`, 'g');
    const before = content;
    content = content.replace(re, right);
    if (content !== before) {
      fixes++;
    }
  }

  if (fixes > 0) {
    // Restore protected IDs
    for (const id of PROTECTED_IDS) {
      // Check if the ID got accidentally changed
      const accentedId = id; // original is unaccented, we need to check if replacement broke it
    }

    try {
      const parsed = JSON.parse(content);
      // Verify IDs are still unaccented
      let idBroken = false;
      for (const fiche of parsed) {
        if (fiche.id && /[éèêàùçôîâ]/.test(fiche.id)) {
          console.log(`  WARNING: ID accentuated in ${file}: ${fiche.id}`);
          idBroken = true;
        }
      }
      if (!idBroken) {
        fs.writeFileSync(fp, content);
        console.log(`${file}: ${fixes} pattern groups fixed`);
        totalFixes += fixes;
      } else {
        console.log(`${file}: NOT SAVED - broken IDs`);
      }
    } catch (e) {
      console.log(`${file}: BROKEN JSON - ${e.message.slice(0, 80)}`);
    }
  } else {
    console.log(`${file}: no changes`);
  }
}

console.log(`\nTotal: ${totalFixes} pattern groups fixed`);

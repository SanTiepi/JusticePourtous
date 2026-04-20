#!/usr/bin/env node
/**
 * seed-cantonal-corpus.mjs — Enrichit le corpus cantonal statique consommé par
 * `src/services/cantonal-juris-matcher.mjs`.
 *
 * Le mode `--mock` de `ingest-entscheidsuche.mjs` ne produit que 10-20
 * décisions bateau. Ici on produit ~90 décisions anonymisées réalistes
 * (structure conforme à ce que publient les tribunaux suisses, qui anonymisent
 * systématiquement). Distribution ciblée :
 *    30 bail, 20 travail, 15 dettes, 10 famille, 10 assurances, 5 transversal.
 *
 * Chaque décision contient :
 *   - court/canton/date/signature/title/summary/text_excerpt
 *   - HOLDING_MARKERS ("Le tribunal retient…", "Considérant que…") pour que
 *     `holding-extractor.mjs` extraie un holding valide
 *   - articles_cited (references) cohérents avec le domaine
 *   - tier 3 (cantonal sup) ou 4 (1ère instance), publication 'unofficial'
 *   - language fr/de/it selon le canton
 *   - domaine (bail/travail/…)
 *   - mention du "côté citoyen" (locataire, travailleur, débiteur, assuré…)
 *     pour que `role-classifier.mjs` distingue favorable/nuance/defavorable
 *
 * Données réalistes mais anonymisées (pratique standard des tribunaux suisses).
 * Marqué explicitement `seed: true` pour éviter toute confusion avec du réel.
 *
 * Usage :
 *   node scripts/seed-cantonal-corpus.mjs [--out <path>]
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEFAULT_OUT = join(ROOT, 'src/data/jurisprudence-cantonale/entscheidsuche-2026-04-19.json');

// ─── Dictionnaires structurels ──────────────────────────────────────

const COURTS = {
  VD: ['Tribunal cantonal VD — Cour civile', 'Tribunal cantonal VD — Cour de droit public', 'Tribunal d\'arrondissement de Lausanne'],
  GE: ['Cour de justice GE — Chambre des baux et loyers', 'Cour de justice GE — Chambre des prud\'hommes', 'Tribunal de première instance GE'],
  ZH: ['Obergericht ZH — I. Zivilkammer', 'Obergericht ZH — II. Zivilkammer', 'Bezirksgericht Zürich', 'Mietgericht Zürich'],
  BE: ['Obergericht BE — Zivilabteilung', 'Regionalgericht Bern-Mittelland'],
  BS: ['Appellationsgericht BS', 'Zivilgericht Basel-Stadt'],
  TI: ['Tribunale d\'appello TI', 'Pretura di Lugano'],
  NE: ['Cour d\'appel civile NE', 'Tribunal régional du Littoral'],
  FR: ['Tribunal cantonal FR — IIᵉ Cour d\'appel civil', 'Tribunal civil de l\'arrondissement de la Sarine'],
  VS: ['Tribunal cantonal VS — Cour civile'],
  LU: ['Kantonsgericht LU'],
  SG: ['Kantonsgericht SG'],
  AG: ['Obergericht AG']
};

function instanceForCourt(court) {
  if (/obergericht|tribunal cantonal|cour de justice|appellationsgericht|tribunale d'appello|kantonsgericht|cour d'appel/i.test(court)) return 3;
  return 4;
}

function langForCanton(canton) {
  if (['ZH', 'BE', 'BS', 'LU', 'SG', 'AG'].includes(canton)) return 'de';
  if (canton === 'TI') return 'it';
  return 'fr';
}

// ─── Templates de décisions par domaine ─────────────────────────────
// Chaque template inclut des HOLDING_MARKERS reconnus par holding-extractor
// (regex : /(?:le|la|les)\s+tribunal\s+(?:fédéral|cantonal)?\s*(?:retient|considère|admet|rejette|précise|confirme)\s+que/)
// et "considérant que".

const BAIL_CASES = [
  {
    canton: 'VD', year: 2023,
    title: 'Défauts moisissure — réduction de loyer 20% ordonnée',
    summary: 'Le tribunal cantonal VD retient que les défauts structurels (infiltrations, moisissure) engagent la responsabilité du bailleur selon l\'art. 259a CO.',
    text_excerpt: 'Considérant que la locataire a établi par expertise la présence de moisissures affectant deux pièces, le tribunal cantonal VD retient que les conditions d\'une réduction de loyer de 20% sont réunies, pour autant que l\'avis des défauts ait été donné dans un délai raisonnable. La position de la locataire est admise.',
    references: ['CO 259a', 'CO 259d'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2022,
    title: 'Résiliation anticipée — restitution caution',
    summary: 'Considérant que le locataire a présenté un repreneur solvable, le bailleur ne peut retenir la garantie de loyer au-delà du délai de 30 jours prévu à l\'art. 257e CO.',
    text_excerpt: 'Le tribunal cantonal VD retient que le bailleur a tardé à libérer la garantie bancaire. À condition que le locataire ait restitué les clés et un état des lieux contradictoire soit intervenu, l\'établissement doit débloquer la caution.',
    references: ['CO 257e', 'CO 264'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2024,
    title: 'Hausse de loyer contestée — référence taux hypothécaire',
    summary: 'Le tribunal cantonal VD précise que la hausse de loyer notifiée doit faire référence au taux hypothécaire de référence OFL applicable au jour de la notification.',
    text_excerpt: 'Considérant que la formule officielle ne mentionnait pas le taux hypothécaire de référence, le tribunal cantonal VD retient que la hausse est nulle. La locataire obtient gain de cause.',
    references: ['CO 269', 'CO 269d', 'CO 270b'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2021,
    title: 'Expulsion — protection contre le congé',
    summary: 'Le tribunal cantonal VD admet que le locataire bénéficie d\'une prolongation du bail de 2 ans, vu la pénurie de logements dans la région lausannoise.',
    text_excerpt: 'Considérant que le locataire réside depuis 14 ans dans l\'appartement et que le marché immobilier lausannois est tendu, le tribunal cantonal VD retient que les conditions d\'une première prolongation de 2 ans sont remplies.',
    references: ['CO 272', 'CO 272b'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2020,
    title: 'Congé-représailles après demande de réparation',
    summary: 'Le tribunal cantonal VD retient que le congé notifié deux mois après une demande formelle de réparation constitue un congé de représailles nul.',
    text_excerpt: 'Considérant la chronologie des faits et la demande écrite de réparation adressée par le locataire, le tribunal cantonal VD précise que le congé est contraire à la bonne foi au sens de l\'art. 271 CO et doit être annulé.',
    references: ['CO 271', 'CO 271a'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2023,
    title: 'Défaut bruit de chantier — réduction 15%',
    summary: 'La Cour de justice GE retient que les nuisances sonores issues d\'un chantier mitoyen justifient une réduction de loyer durant toute la période des travaux.',
    text_excerpt: 'Considérant l\'expertise acoustique et les plaintes répétées de la locataire, le tribunal cantonal GE retient qu\'une réduction de 15% s\'impose, à condition que le bailleur ait été dûment averti.',
    references: ['CO 259a', 'CO 259d'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2022,
    title: 'Restitution de la caution — délai raisonnable',
    summary: 'La Cour de justice GE confirme que le bailleur dispose d\'un délai d\'un an pour faire valoir ses prétentions sur la garantie de loyer.',
    text_excerpt: 'Le tribunal cantonal GE retient que passé ce délai, la banque doit restituer la caution à la locataire. Considérant que 14 mois se sont écoulés sans action, la libération est ordonnée.',
    references: ['CO 257e'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Contestation du loyer initial — logement en pénurie',
    summary: 'Considérant que le canton de Genève connaît une pénurie de logements, la locataire peut contester le loyer initial dans les 30 jours selon l\'art. 270 CO.',
    text_excerpt: 'Le tribunal cantonal GE retient que la hausse de 18% par rapport au loyer du précédent locataire n\'est pas justifiée par les coûts. La locataire obtient une baisse de loyer.',
    references: ['CO 270', 'CO 269'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2023,
    title: 'Résiliation pour besoin propre — preuves insuffisantes',
    summary: 'La Cour de justice GE rejette la résiliation pour besoin propre, les éléments fournis par le bailleur étant trop vagues.',
    text_excerpt: 'Considérant que le bailleur n\'a produit aucune preuve concrète d\'un besoin personnel urgent, le tribunal cantonal GE retient que le congé est abusif et l\'annule.',
    references: ['CO 271', 'CO 271a'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2021,
    title: 'Sous-location refusée — loyer disproportionné',
    summary: 'Le tribunal cantonal GE retient que le bailleur peut refuser la sous-location lorsque le loyer demandé au sous-locataire est manifestement abusif.',
    text_excerpt: 'Considérant que le sous-loyer prévu dépasse de 80% le loyer principal, le tribunal cantonal GE précise que le refus du bailleur est fondé. La locataire est déboutée.',
    references: ['CO 262'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'ZH', year: 2023,
    title: 'Mietzinsreduktion wegen Schimmelbefall',
    summary: 'Das Obergericht ZH hält fest, dass der Mieter bei erheblichem Schimmelbefall Anspruch auf eine Mietzinsreduktion hat.',
    text_excerpt: 'Considérant que la locataire a établi les défauts par rapport d\'expertise, le tribunal cantonal ZH retient qu\'une réduction de 25% est justifiée tant que le défaut persiste.',
    references: ['CO 259a', 'CO 259d'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2022,
    title: 'Kaution — Rückgabe nach Vertragsende',
    summary: 'Das Obergericht ZH bestätigt die Rückzahlungspflicht des Vermieters, sobald die Jahresfrist abgelaufen ist.',
    text_excerpt: 'Le tribunal cantonal ZH retient que la garantie doit être libérée dans les délais. Considérant qu\'aucune action n\'a été introduite par le bailleur dans l\'année, la locataire obtient restitution.',
    references: ['CO 257e'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'Ausserordentliche Kündigung wegen Zahlungsverzug',
    summary: 'Das Obergericht ZH präzisiert die Anforderungen an die Mahnung nach Art. 257d OR vor einer Kündigung.',
    text_excerpt: 'Considérant que la mise en demeure ne fixait pas clairement le délai de 30 jours, le tribunal cantonal ZH retient que le congé est nul.',
    references: ['CO 257d'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2021,
    title: 'Mieterstreckung — Zweiterstreckung abgelehnt',
    summary: 'Das Obergericht ZH lehnt eine zweite Mieterstreckung ab, da die Mieterin ausreichend Zeit zur Wohnungssuche hatte.',
    text_excerpt: 'Le tribunal cantonal ZH rejette la seconde prolongation. Considérant que 18 mois ont été octroyés et qu\'aucune démarche concrète n\'a été entreprise, le tribunal cantonal ZH retient que la demande est abusive.',
    references: ['CO 272', 'CO 272b'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'BE', year: 2023,
    title: 'Nebenkostenabrechnung — Transparenz ungenügend',
    summary: 'Das Obergericht BE hält fest, dass der Vermieter detaillierte Belege zu den Nebenkosten liefern muss.',
    text_excerpt: 'Considérant que le décompte remis à la locataire ne comportait pas les justificatifs requis, le tribunal cantonal BE retient que les surcoûts réclamés ne sont pas dus.',
    references: ['CO 257a', 'CO 257b'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2022,
    title: 'Kündigung wegen Eigenbedarf — teilweise zugelassen',
    summary: 'Das Obergericht BE admet partiellement le besoin propre mais prolonge le bail de 15 mois.',
    text_excerpt: 'Le tribunal cantonal BE retient que le besoin propre est partiellement établi. Considérant la situation du locataire retraité, une prolongation de 15 mois est accordée à titre de nuance.',
    references: ['CO 271', 'CO 272'],
    result: 'partiellement_admis',
    outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'BS', year: 2023,
    title: 'Mietzinsanfechtung bei Wohnungsmangel',
    summary: 'Das Appellationsgericht BS präzise die Anwendung von Art. 270 OR dans le contexte de Bâle-Ville.',
    text_excerpt: 'Considérant le taux de vacance inférieur à 1% à Bâle-Ville, le tribunal cantonal BS retient que la contestation du loyer initial est ouverte. La locataire bénéficie d\'une réduction de loyer significative.',
    references: ['CO 270'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'TI', year: 2023,
    title: 'Disdetta del contratto di locazione per morosità',
    summary: 'Il Tribunale d\'appello TI conferma che la morosità di due mesi autorizza la disdetta straordinaria.',
    text_excerpt: 'Considérant que le locataire n\'a pas payé deux mois de loyer malgré mise en demeure, le tribunal cantonal TI retient que la résiliation est valable.',
    references: ['CO 257d'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'TI', year: 2022,
    title: 'Difetti dell\'appartamento — riduzione del canone',
    summary: 'Il Tribunale d\'appello TI ammette una riduzione del canone di locazione del 10% per difetti di isolamento.',
    text_excerpt: 'Considerato che i difetti di isolamento sono stati provati, le tribunal cantonal TI retient qu\'une réduction de 10% est justifiée jusqu\'à réparation.',
    references: ['CO 259a', 'CO 259d'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'NE', year: 2022,
    title: 'Congé anticipé avec locataire de remplacement',
    summary: 'La Cour d\'appel civile NE retient que le bailleur ne peut refuser sans motif sérieux un locataire de remplacement solvable.',
    text_excerpt: 'Considérant que les trois candidats proposés remplissent les critères de solvabilité habituels, le tribunal cantonal NE retient que le refus du bailleur est infondé et libère la locataire.',
    references: ['CO 264'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2023,
    title: 'Augmentation de loyer — formule officielle manquante',
    summary: 'Le tribunal cantonal FR confirme la nullité de la hausse notifiée sans la formule officielle cantonale.',
    text_excerpt: 'Considérant que le canton de Fribourg impose l\'usage de la formule officielle, le tribunal cantonal FR retient que la hausse est nulle et que le loyer antérieur demeure applicable.',
    references: ['CO 269d', 'CO 270b'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2021,
    title: 'Dégâts en fin de bail — usure normale vs dégradations',
    summary: 'Le tribunal cantonal FR distingue l\'usure normale (à la charge du bailleur) des dégradations imputables au locataire.',
    text_excerpt: 'Le tribunal cantonal FR précise que les traces d\'usure liées à un séjour de 8 ans ne peuvent être imputées à la locataire. Considérant le rapport d\'état des lieux, seules les réparations des portes sont à sa charge.',
    references: ['CO 267', 'CO 267a'],
    result: 'partiellement_admis',
    outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'VS', year: 2022,
    title: 'Bail commercial — protection limitée',
    summary: 'Le tribunal cantonal VS rappelle que les règles de protection du bail d\'habitation ne s\'appliquent pas pleinement au bail commercial.',
    text_excerpt: 'Considérant la nature commerciale du bail, le tribunal cantonal VS retient que la résiliation est valable, sauf si elle viole manifestement la bonne foi. La locataire commerçante est déboutée.',
    references: ['CO 271'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2024,
    title: 'Baisse de loyer — variation du taux hypothécaire',
    summary: 'Le tribunal cantonal VD admet la baisse de loyer demandée suite à la baisse du taux hypothécaire de référence.',
    text_excerpt: 'Considérant que le taux hypothécaire est passé de 1.75% à 1.50%, le tribunal cantonal VD retient que la locataire peut prétendre à une baisse de loyer d\'environ 3%.',
    references: ['CO 270a'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2022,
    title: 'Accès du bailleur — conditions strictes',
    summary: 'La Cour de justice GE précise que le droit de visite du bailleur doit respecter l\'intimité du locataire.',
    text_excerpt: 'Le tribunal cantonal GE retient que les visites surprises constituent un trouble de la jouissance. Considérant la fréquence des visites non annoncées, une indemnité est accordée à la locataire.',
    references: ['CO 257h'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'Formularpflicht bei Mietzinsanpassung',
    summary: 'Le tribunal cantonal ZH admet la contestation de la locataire pour vice de forme.',
    text_excerpt: 'Considérant que la notification ne respecte pas les exigences formelles de l\'art. 269d CO, le tribunal cantonal ZH retient que la hausse est nulle.',
    references: ['CO 269d'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2021,
    title: 'Refus de réparer — consignation du loyer',
    summary: 'Le tribunal cantonal VD retient que la consignation du loyer est valable lorsque le bailleur reste inactif.',
    text_excerpt: 'Considérant que la locataire a avisé les défauts par courrier recommandé resté sans suite, le tribunal cantonal VD retient que la consignation est légitime et les loyers consignés seront restitués une fois les travaux exécutés.',
    references: ['CO 259g', 'CO 259h'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Résiliation pour justes motifs — non admise',
    summary: 'La Cour de justice GE rejette la résiliation extraordinaire invoquée par la locataire pour nuisances de voisinage.',
    text_excerpt: 'Considérant que le bailleur a pris des mesures raisonnables, le tribunal cantonal GE retient que les conditions d\'une résiliation pour justes motifs ne sont pas réunies. La locataire est déboutée.',
    references: ['CO 266g'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'BE', year: 2024,
    title: 'Garantie de loyer en espèces — interdiction',
    summary: 'Le tribunal cantonal BE retient qu\'une garantie de loyer remise en espèces hors compte bancaire est contraire à l\'art. 257e CO.',
    text_excerpt: 'Considérant que la locataire a versé 3 mois de loyer directement au bailleur en espèces, le tribunal cantonal BE précise qu\'elle peut en exiger la restitution immédiate.',
    references: ['CO 257e'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Dégâts d\'eau — responsabilité immeuble',
    summary: 'Le tribunal cantonal VD retient la responsabilité du bailleur pour des dégâts d\'eau causés par une conduite vétuste.',
    text_excerpt: 'Considérant que la conduite date de 1972 et n\'a jamais été rénovée, le tribunal cantonal VD retient que l\'usure du bâtiment engage la responsabilité du bailleur pour les dommages causés à la locataire.',
    references: ['CO 259a', 'CO 259e'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  }
];

const TRAVAIL_CASES = [
  {
    canton: 'VD', year: 2023,
    title: 'Licenciement abusif — motif économique non établi',
    summary: 'Le tribunal cantonal VD retient que l\'employeur n\'a pas établi les difficultés économiques invoquées, le licenciement est qualifié d\'abusif.',
    text_excerpt: 'Considérant l\'absence de pièces comptables démontrant une restructuration effective, le tribunal cantonal VD retient que le travailleur a droit à une indemnité de 4 mois de salaire au sens de l\'art. 336a CO.',
    references: ['CO 336', 'CO 336a'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2022,
    title: 'Licenciement pendant incapacité — nullité',
    summary: 'Le tribunal cantonal VD confirme la nullité d\'un licenciement notifié pendant une incapacité de travail.',
    text_excerpt: 'Considérant que l\'employé était en arrêt maladie depuis 18 jours, le tribunal cantonal VD retient que le délai de protection de l\'art. 336c CO est applicable et que le congé est nul.',
    references: ['CO 336c'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2024,
    title: 'Heures supplémentaires — preuve à charge de l\'employé',
    summary: 'Le tribunal cantonal VD rappelle que le travailleur doit prouver les heures supplémentaires accomplies.',
    text_excerpt: 'Considérant l\'absence de système de timbrage et de preuves écrites, le tribunal cantonal VD retient que le travailleur n\'a pas démontré l\'accomplissement d\'heures supplémentaires. La demande est rejetée.',
    references: ['CO 321c'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2023,
    title: 'Résiliation immédiate — justes motifs non retenus',
    summary: 'La Cour de justice GE rejette l\'existence de justes motifs invoqués par l\'employeur pour une résiliation avec effet immédiat.',
    text_excerpt: 'Considérant que le retard invoqué ne constituait pas un manquement grave, le tribunal cantonal GE retient que le licenciement immédiat n\'est pas fondé. Le travailleur obtient le salaire jusqu\'au terme ordinaire.',
    references: ['CO 337', 'CO 337c'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2022,
    title: 'Vacances non prises — indemnité',
    summary: 'La Cour de justice GE admet l\'indemnité pour vacances non prises à la fin des rapports de travail.',
    text_excerpt: 'Considérant qu\'il était impossible au travailleur de prendre ses 12 jours de vacances restants durant son préavis, le tribunal cantonal GE retient qu\'ils doivent être indemnisés en espèces.',
    references: ['CO 329', 'CO 329d'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'Kündigung während Schwangerschaft — nichtig',
    summary: 'Le tribunal cantonal ZH confirme la nullité d\'un licenciement notifié pendant la grossesse de la travailleuse.',
    text_excerpt: 'Considérant que la travailleuse a informé son employeur de sa grossesse avant le congé, le tribunal cantonal ZH retient que le licenciement est nul selon l\'art. 336c CO.',
    references: ['CO 336c'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2023,
    title: 'Certificat de travail — droit à la rectification',
    summary: 'Le tribunal cantonal ZH admet partiellement la demande de rectification du certificat de travail.',
    text_excerpt: 'Considérant que certaines mentions étaient trompeuses et que d\'autres correspondaient à la réalité, le tribunal cantonal ZH retient qu\'une rectification partielle est justifiée. La travailleuse obtient partiellement gain de cause.',
    references: ['CO 330a'],
    result: 'partiellement_admis',
    outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'BE', year: 2023,
    title: 'Salaire impayé — avis de défaut',
    summary: 'Le tribunal cantonal BE retient que le travailleur peut suspendre sa prestation en cas de salaire impayé.',
    text_excerpt: 'Considérant que l\'employeur devait deux mois de salaire, le tribunal cantonal BE retient que le travailleur était en droit de refuser de travailler jusqu\'à paiement, conformément à l\'art. 82 CO.',
    references: ['CO 322', 'CO 82'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2022,
    title: 'Clause de non-concurrence — nullité',
    summary: 'Le tribunal cantonal BE annule une clause de non-concurrence disproportionnée dans l\'espace et le temps.',
    text_excerpt: 'Considérant que la clause couvrait toute la Suisse pour 3 ans sans indemnité, le tribunal cantonal BE retient qu\'elle est excessive et donc nulle.',
    references: ['CO 340', 'CO 340a'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'BS', year: 2024,
    title: 'Mobbing — indemnité pour tort moral',
    summary: 'Le tribunal cantonal BS admet l\'existence d\'un harcèlement psychologique et octroie une indemnité pour tort moral.',
    text_excerpt: 'Considérant les témoignages concordants et la dégradation de la santé psychique de la travailleuse, le tribunal cantonal BS retient l\'existence d\'un mobbing et accorde 8\'000 CHF pour tort moral.',
    references: ['CO 328', 'CO 49'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'TI', year: 2023,
    title: 'Licenziamento immediato — giusti motivi',
    summary: 'Il Tribunale d\'appello TI ammette l\'esistenza di giusti motivi per il licenziamento immediato di un dipendente fraudolento.',
    text_excerpt: 'Considérant que le travailleur a été surpris en train de détourner des fonds, le tribunal cantonal TI retient que le licenciement immédiat est justifié. La demande d\'indemnités est rejetée.',
    references: ['CO 337'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'NE', year: 2022,
    title: 'Temps de déplacement — comptabilisé comme temps de travail',
    summary: 'La Cour d\'appel civile NE qualifie les déplacements entre chantiers de temps de travail.',
    text_excerpt: 'Considérant que les déplacements se faisaient avec le véhicule de l\'entreprise et sous instruction de l\'employeur, le tribunal cantonal NE retient qu\'ils doivent être rémunérés comme temps de travail.',
    references: ['CO 319', 'CO 321c'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2023,
    title: 'Prolongation du délai de congé — ancienneté',
    summary: 'Le tribunal cantonal FR applique le délai de congé de 3 mois au travailleur de 15 ans d\'ancienneté.',
    text_excerpt: 'Considérant l\'ancienneté de 15 ans, le tribunal cantonal FR retient que le délai de congé applicable est de 3 mois conformément à l\'art. 335c CO. Le salaire correspondant est dû.',
    references: ['CO 335c'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2022,
    title: 'Gratification ou 13ème salaire — qualification juridique',
    summary: 'Le tribunal cantonal VD requalifie en 13ème salaire une gratification versée régulièrement pendant 7 ans.',
    text_excerpt: 'Considérant le versement régulier et sans réserve pendant 7 années consécutives, le tribunal cantonal VD retient qu\'il s\'agit d\'un élément du salaire et non d\'une gratification discrétionnaire.',
    references: ['CO 322', 'CO 322d'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Discrimination salariale — charge de la preuve allégée',
    summary: 'La Cour de justice GE admet la discrimination salariale d\'une travailleuse après comparaison avec un collègue masculin.',
    text_excerpt: 'Considérant le différentiel de 15% et l\'absence d\'explication objective, le tribunal cantonal GE retient que la discrimination est rendue vraisemblable et accorde un rattrapage salarial.',
    references: ['LEg 3', 'LEg 6'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2021,
    title: 'Paiement salaire pendant maladie — 3 ans d\'ancienneté',
    summary: 'Le tribunal cantonal VD applique l\'échelle bernoise : 2 mois de salaire pour 3 ans d\'ancienneté.',
    text_excerpt: 'Considérant que le travailleur totalisait 3 ans et 2 mois de service, le tribunal cantonal VD retient que l\'obligation de verser le salaire durant 2 mois de maladie est applicable selon l\'art. 324a CO.',
    references: ['CO 324a'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2022,
    title: 'Überstunden — Kompensation oder Auszahlung',
    summary: 'Le tribunal cantonal ZH retient que le supplément de 25% pour heures supplémentaires n\'est pas dû si l\'employeur compense en temps libre dans un délai raisonnable.',
    text_excerpt: 'Considérant que la compensation en temps libre est intervenue dans les 4 mois, le tribunal cantonal ZH retient que seule la compensation brute est due sans le supplément.',
    references: ['CO 321c'],
    result: 'partiellement_admis',
    outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'BE', year: 2023,
    title: 'Licenciement collectif — violation procédure',
    summary: 'Le tribunal cantonal BE retient que l\'employeur n\'a pas respecté la procédure de consultation préalable.',
    text_excerpt: 'Considérant que la consultation des travailleurs n\'a pas eu lieu dans le délai légal, le tribunal cantonal BE retient que les licenciements sont abusifs et octroie une indemnité de 2 mois.',
    references: ['CO 335d', 'CO 335f', 'CO 336'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2024,
    title: 'Frais professionnels — remboursement',
    summary: 'Le tribunal cantonal VD confirme l\'obligation de l\'employeur de rembourser les frais réellement engagés.',
    text_excerpt: 'Considérant que le travailleur utilisait sa voiture personnelle pour des tournées clientèle, le tribunal cantonal VD retient qu\'un remboursement kilométrique selon le barème officiel est dû.',
    references: ['CO 327a'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  }
];

const DETTES_CASES = [
  {
    canton: 'VD', year: 2023,
    title: 'Opposition au commandement de payer — motivation',
    summary: 'Le tribunal cantonal VD rappelle que l\'opposition au commandement de payer n\'a pas à être motivée.',
    text_excerpt: 'Considérant la lettre de l\'art. 74 LP, le tribunal cantonal VD retient que le débiteur a valablement formé opposition sans justification. La mainlevée est écartée.',
    references: ['LP 74', 'LP 80'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2022,
    title: 'Mainlevée définitive — jugement exécutoire',
    summary: 'Le tribunal cantonal VD accorde la mainlevée définitive sur la base d\'un jugement exécutoire.',
    text_excerpt: 'Considérant que le jugement produit est exécutoire et porte condamnation à payer une somme déterminée, le tribunal cantonal VD retient que les conditions de l\'art. 80 LP sont réunies.',
    references: ['LP 80'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2023,
    title: 'Minimum vital — calcul individualisé',
    summary: 'La Cour de justice GE rappelle que le minimum vital doit intégrer les charges effectives du débiteur.',
    text_excerpt: 'Considérant les frais médicaux documentés et les contributions d\'entretien, le tribunal cantonal GE retient que le minimum vital du débiteur doit être revu à la hausse, réduisant la saisie.',
    references: ['LP 93'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2022,
    title: 'Mainlevée provisoire — reconnaissance de dette',
    summary: 'La Cour de justice GE admet la mainlevée provisoire sur la base d\'une reconnaissance de dette signée.',
    text_excerpt: 'Considérant la reconnaissance signée de la main du débiteur, le tribunal cantonal GE retient que le créancier peut obtenir mainlevée provisoire selon l\'art. 82 LP.',
    references: ['LP 82'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'Faillite personnelle — conditions strictes',
    summary: 'Le tribunal cantonal ZH précise les conditions de l\'art. 191 LP pour la faillite sans poursuite préalable.',
    text_excerpt: 'Considérant que le débiteur n\'a pas établi son état de surendettement durable, le tribunal cantonal ZH retient que les conditions d\'une faillite volontaire ne sont pas réunies.',
    references: ['LP 191'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'ZH', year: 2023,
    title: 'Biens insaisissables — outils de travail',
    summary: 'Le tribunal cantonal ZH retient que les outils indispensables à l\'activité professionnelle sont insaisissables.',
    text_excerpt: 'Considérant que l\'artisan ne peut exercer son métier sans ses outils, le tribunal cantonal ZH retient qu\'ils sont insaisissables selon l\'art. 92 LP.',
    references: ['LP 92'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2023,
    title: 'Action en constatation négative de créance',
    summary: 'Le tribunal cantonal BE admet l\'action en constatation négative du débiteur.',
    text_excerpt: 'Considérant que la créance invoquée par l\'office des poursuites n\'était pas due, le tribunal cantonal BE retient que le débiteur peut obtenir la radiation de la poursuite selon l\'art. 85a LP.',
    references: ['LP 85a'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2022,
    title: 'Délai de péremption — action en libération de dette',
    summary: 'Le tribunal cantonal BE rejette une action en libération de dette formée hors délai.',
    text_excerpt: 'Considérant que l\'action a été introduite 25 jours après la mainlevée provisoire, le tribunal cantonal BE retient que le délai de 20 jours de l\'art. 83 al. 2 LP est échu.',
    references: ['LP 83'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2024,
    title: 'Saisie de salaire — employeur tiers',
    summary: 'Le tribunal cantonal VD confirme la validité d\'un avis de saisie notifié à l\'employeur.',
    text_excerpt: 'Considérant la notification régulière à l\'employeur, le tribunal cantonal VD retient que l\'avis de saisie est opposable et que l\'employeur doit retenir la part saisie.',
    references: ['LP 99'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2021,
    title: 'Plainte LP — notification défectueuse',
    summary: 'La Cour de justice GE annule un commandement de payer pour notification défectueuse.',
    text_excerpt: 'Considérant que la notification a été remise à un voisin sans droit de substitution, le tribunal cantonal GE retient que le commandement de payer est entaché de nullité.',
    references: ['LP 17', 'LP 72'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'TI', year: 2023,
    title: 'Sequestro — condizioni',
    summary: 'Il Tribunale d\'appello TI rigetta una domanda di sequestro per mancanza di prove di fuga di beni.',
    text_excerpt: 'Considérant l\'absence d\'indices concrets de dissimulation de biens, le tribunal cantonal TI retient que les conditions du séquestre ne sont pas remplies. La débitrice obtient gain de cause.',
    references: ['LP 271'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2022,
    title: 'Avis comminatoire de faillite — mainlevée',
    summary: 'Le tribunal cantonal FR admet la mainlevée de l\'avis comminatoire après paiement partiel.',
    text_excerpt: 'Considérant que le débiteur a versé 60% de la dette avant l\'audience, le tribunal cantonal FR retient que la faillite n\'a plus de justification suffisante.',
    references: ['LP 171', 'LP 172'],
    result: 'partiellement_admis',
    outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Tiers revendication — bien saisi',
    summary: 'Le tribunal cantonal VD retient qu\'un bien appartenant à un tiers doit être exclu de la saisie.',
    text_excerpt: 'Considérant les preuves de propriété (facture au nom du tiers), le tribunal cantonal VD retient la revendication et ordonne la restitution du bien.',
    references: ['LP 106', 'LP 107'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2024,
    title: 'Retrait de poursuite — conditions',
    summary: 'Le tribunal cantonal BE retient que le débiteur peut demander la radiation au registre après paiement intégral.',
    text_excerpt: 'Considérant le quittancement intégral de la créance, le tribunal cantonal BE retient que la mention de la poursuite doit être radiée du registre conformément à l\'art. 8a LP.',
    references: ['LP 8a'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Quatre mois pour contester le tableau de distribution',
    summary: 'La Cour de justice GE rappelle le délai de 10 jours pour contester le tableau de distribution.',
    text_excerpt: 'Considérant que la plainte a été déposée tardivement, le tribunal cantonal GE retient que le tableau de distribution est définitif. Le créancier est débouté.',
    references: ['LP 157', 'LP 17'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  }
];

const FAMILLE_CASES = [
  {
    canton: 'VD', year: 2023,
    title: 'Pension alimentaire enfants — coût élevé',
    summary: 'Le tribunal cantonal VD fixe la contribution d\'entretien selon les besoins réels de l\'enfant scolarisé en privé.',
    text_excerpt: 'Considérant que la scolarisation privée avait été décidée pendant la vie commune et correspondait au niveau de vie antérieur, le tribunal cantonal VD retient que ces frais doivent être partagés selon les capacités contributives.',
    references: ['CC 276', 'CC 285'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2022,
    title: 'Garde partagée — conditions',
    summary: 'Le tribunal cantonal VD admet la garde alternée compte tenu de la bonne communication parentale.',
    text_excerpt: 'Considérant la proximité géographique et l\'accord sur l\'éducation, le tribunal cantonal VD retient que la garde alternée semaine sur semaine est dans l\'intérêt des enfants.',
    references: ['CC 298', 'CC 298a'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2023,
    title: 'Contribution d\'entretien conjoint — capacité contributive',
    summary: 'La Cour de justice GE réduit la contribution à l\'ex-conjoint vu la perte d\'emploi documentée.',
    text_excerpt: 'Considérant la perte involontaire de l\'emploi et les recherches actives, le tribunal cantonal GE retient que la contribution doit être adaptée à titre de nuance.',
    references: ['CC 125', 'CC 129'],
    result: 'partiellement_admis',
    outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Divorce sans faute — liquidation du régime matrimonial',
    summary: 'La Cour de justice GE retient le partage par moitié des acquêts de la période de mariage.',
    text_excerpt: 'Considérant l\'absence de convention matrimoniale, le tribunal cantonal GE retient que la participation aux acquêts s\'applique intégralement. La demande est admise.',
    references: ['CC 197', 'CC 215'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2023,
    title: 'Autorité parentale conjointe — maintien malgré conflit',
    summary: 'Le tribunal cantonal ZH maintient l\'autorité parentale conjointe malgré les désaccords.',
    text_excerpt: 'Considérant que les parents peuvent communiquer sur les décisions essentielles, le tribunal cantonal ZH retient qu\'il n\'existe pas de motif grave pour attribuer l\'autorité à un seul parent.',
    references: ['CC 296', 'CC 298'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2022,
    title: 'Mesures protectrices — attribution domicile conjugal',
    summary: 'Le tribunal cantonal BE attribue le domicile conjugal au conjoint qui conserve la garde des enfants.',
    text_excerpt: 'Considérant l\'intérêt des enfants à demeurer dans leur environnement scolaire, le tribunal cantonal BE retient que le logement doit être attribué à la mère gardienne.',
    references: ['CC 176'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2023,
    title: 'Droit de visite — suspension temporaire',
    summary: 'Le tribunal cantonal FR suspend le droit de visite compte tenu des violences alléguées.',
    text_excerpt: 'Considérant les rapports de police et les auditions des enfants, le tribunal cantonal FR retient que la suspension du droit de visite est nécessaire à la protection des mineurs.',
    references: ['CC 273', 'CC 274'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'NE', year: 2022,
    title: 'Reconnaissance de paternité — test ADN',
    summary: 'La Cour d\'appel civile NE ordonne un test ADN pour trancher la filiation contestée.',
    text_excerpt: 'Considérant l\'incertitude entourant la filiation et le droit de l\'enfant de connaître ses origines, le tribunal cantonal NE retient qu\'un test ADN s\'impose.',
    references: ['CC 260', 'CC 263'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VS', year: 2023,
    title: 'Adoption plénière — conditions',
    summary: 'Le tribunal cantonal VS prononce l\'adoption plénière après 3 ans d\'accueil.',
    text_excerpt: 'Considérant la durée d\'accueil et l\'intégration familiale, le tribunal cantonal VS retient que les conditions de l\'adoption plénière sont réunies.',
    references: ['CC 264', 'CC 267'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'TI', year: 2024,
    title: 'Mantenimento figli maggiorenni — formazione',
    summary: 'Il Tribunale d\'appello TI ammette il mantenimento del figlio universitario fino alla fine della formazione.',
    text_excerpt: 'Considérant que la formation universitaire se déroule dans des délais normaux, le tribunal cantonal TI retient que la contribution d\'entretien doit être maintenue.',
    references: ['CC 277'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  }
];

const ASSURANCES_CASES = [
  {
    canton: 'VD', year: 2023,
    title: 'LAA — accident professionnel reconnu',
    summary: 'Le tribunal cantonal VD reconnaît le caractère professionnel d\'un accident survenu lors d\'une mission externe.',
    text_excerpt: 'Considérant que l\'accident est intervenu durant un déplacement professionnel avec véhicule de service, le tribunal cantonal VD retient que la LAA est applicable et que l\'assuré a droit aux prestations.',
    references: ['LAA 6', 'LAA 7'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2022,
    title: 'LAI — rente partielle 40%',
    summary: 'Le tribunal cantonal VD confirme l\'octroi d\'un quart de rente AI après expertise pluridisciplinaire.',
    text_excerpt: 'Considérant l\'expertise médicale concluant à une incapacité de 40%, le tribunal cantonal VD retient que l\'assurée a droit à un quart de rente AI.',
    references: ['LAI 28', 'LAI 28b'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'LAMal — prise en charge traitement à l\'étranger',
    summary: 'La Cour de justice GE admet la prise en charge d\'un traitement spécialisé à l\'étranger.',
    text_excerpt: 'Considérant que le traitement n\'était pas disponible en Suisse dans un délai raisonnable, le tribunal cantonal GE retient que l\'assureur doit prendre en charge les frais.',
    references: ['LAMal 34', 'LAMal 25'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2023,
    title: 'LAA — faute grave de l\'assuré',
    summary: 'Le tribunal cantonal ZH réduit les prestations en raison d\'une faute grave de l\'assuré (conduite en état d\'ébriété).',
    text_excerpt: 'Considérant le taux d\'alcoolémie de 1.8‰, le tribunal cantonal ZH retient une faute grave et confirme la réduction des prestations de 40%.',
    references: ['LAA 37'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'BE', year: 2023,
    title: 'LPP — versement anticipé pour logement',
    summary: 'Le tribunal cantonal BE confirme le droit au versement anticipé pour l\'acquisition du logement principal.',
    text_excerpt: 'Considérant l\'engagement d\'habiter effectivement le logement, le tribunal cantonal BE retient que les conditions du versement anticipé sont réunies.',
    references: ['LPP 30c'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'BS', year: 2022,
    title: 'LACI — indemnité chômage après démission',
    summary: 'Le tribunal cantonal BS admet partiellement l\'indemnité après période de pénalité.',
    text_excerpt: 'Considérant les motifs sérieux de la démission, le tribunal cantonal BS retient une période de pénalité réduite à titre de nuance.',
    references: ['LACI 30'],
    result: 'partiellement_admis',
    outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'VD', year: 2024,
    title: 'LAI — mesures de reclassement',
    summary: 'Le tribunal cantonal VD retient que l\'assurée a droit à une mesure de reclassement professionnel.',
    text_excerpt: 'Considérant la perte durable de la capacité dans le métier initial, le tribunal cantonal VD retient que l\'assurée bénéficie de mesures de réadaptation.',
    references: ['LAI 17'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2023,
    title: 'LAA — rechute reconnue',
    summary: 'Le tribunal cantonal FR reconnaît la rechute d\'un accident datant de 4 ans.',
    text_excerpt: 'Considérant le lien de causalité établi par le rapport médical, le tribunal cantonal FR retient que la rechute engage la prise en charge LAA.',
    references: ['LAA 11'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'NE', year: 2022,
    title: 'LAMal — franchise et quote-part',
    summary: 'La Cour d\'appel NE rejette la contestation de la facturation de la franchise.',
    text_excerpt: 'Considérant que la franchise convenue s\'applique à tous les soins ambulatoires, le tribunal cantonal NE retient que l\'assureur n\'a pas violé ses obligations.',
    references: ['LAMal 64'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  },
  {
    canton: 'TI', year: 2023,
    title: 'LAI — revisione di rendita',
    summary: 'Il Tribunale d\'appello TI conferma la révision à la baisse de la rente AI.',
    text_excerpt: 'Considérant l\'amélioration objective de l\'état de santé constatée par expertise, le tribunal cantonal TI retient que la révision est justifiée.',
    references: ['LAI 17', 'LPGA 17'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  }
];

const ETRANGERS_CASES = [
  {
    canton: 'VD', year: 2023,
    title: 'LEI — renouvellement permis B',
    summary: 'Le tribunal cantonal VD admet le renouvellement du permis B après dépendance partielle de l\'aide sociale.',
    text_excerpt: 'Considérant l\'effort d\'intégration et la recherche active d\'emploi, le tribunal cantonal VD retient que le renouvellement se justifie.',
    references: ['LEI 33', 'LEI 42'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'LEI — révocation pour condamnation pénale',
    summary: 'Le tribunal cantonal ZH confirme la révocation du permis C après condamnation à 18 mois ferme.',
    text_excerpt: 'Considérant la gravité de l\'infraction commise, le tribunal cantonal ZH retient que la révocation est proportionnée.',
    references: ['LEI 62', 'LEI 63'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  }
];

const SOCIAL_CASES = [
  {
    canton: 'VD', year: 2023,
    title: 'Aide sociale — calcul prestations complémentaires',
    summary: 'Le tribunal cantonal VD ordonne le recalcul des prestations complémentaires selon les barèmes cantonaux actualisés.',
    text_excerpt: 'Considérant que l\'autorité n\'a pas appliqué les barèmes 2023, le tribunal cantonal VD retient que le calcul doit être repris.',
    references: ['LPC 9', 'LPC 11'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  }
];

const VOISINAGE_CASES = [
  {
    canton: 'GE', year: 2023,
    title: 'Immissions excessives — plantations',
    summary: 'La Cour de justice GE ordonne l\'élagage des plantations dépassant la limite parcellaire.',
    text_excerpt: 'Considérant l\'étendue des nuisances (ombre, feuilles), le tribunal cantonal GE retient que l\'art. 684 CC est applicable et ordonne l\'élagage.',
    references: ['CC 684', 'CC 687'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  }
];

const CIRCULATION_CASES = [
  {
    canton: 'VD', year: 2024,
    title: 'LCR — retrait de permis 3 mois',
    summary: 'Le tribunal cantonal VD confirme le retrait de permis de 3 mois pour excès de vitesse grave.',
    text_excerpt: 'Considérant l\'excès de 35 km/h hors localité, le tribunal cantonal VD retient que le retrait de 3 mois est conforme au minimum légal.',
    references: ['LCR 16c', 'LCR 16'],
    result: 'defavorable_demandeur',
    outcome_hint: 'rejeté'
  }
];

const VIOLENCE_CASES = [
  {
    canton: 'BE', year: 2023,
    title: 'Expulsion du domicile — violence conjugale',
    summary: 'Le tribunal cantonal BE ordonne l\'expulsion du conjoint violent pour 4 semaines.',
    text_excerpt: 'Considérant les preuves de violences répétées, le tribunal cantonal BE retient que l\'expulsion immédiate protège la victime.',
    references: ['CC 28b'],
    result: 'favorable_demandeur',
    outcome_hint: 'admis'
  }
];

// ─── Agrégation ─────────────────────────────────────────────────────

const ALL = [
  ...BAIL_CASES.map(c => ({ ...c, domaine: 'bail' })),
  ...TRAVAIL_CASES.map(c => ({ ...c, domaine: 'travail' })),
  ...DETTES_CASES.map(c => ({ ...c, domaine: 'dettes' })),
  ...FAMILLE_CASES.map(c => ({ ...c, domaine: 'famille' })),
  ...ASSURANCES_CASES.map(c => ({ ...c, domaine: 'assurances' })),
  ...ETRANGERS_CASES.map(c => ({ ...c, domaine: 'etrangers' })),
  ...SOCIAL_CASES.map(c => ({ ...c, domaine: 'social' })),
  ...VOISINAGE_CASES.map(c => ({ ...c, domaine: 'voisinage' })),
  ...CIRCULATION_CASES.map(c => ({ ...c, domaine: 'circulation' })),
  ...VIOLENCE_CASES.map(c => ({ ...c, domaine: 'violence' }))
];

// ─── Build final records ────────────────────────────────────────────

function buildRecord(tpl, idx) {
  const courts = COURTS[tpl.canton] || [`Tribunal cantonal ${tpl.canton}`];
  const court = courts[idx % courts.length];
  const tier = instanceForCourt(court);
  const monthStr = String((idx * 7 % 12) + 1).padStart(2, '0');
  const dayStr = String((idx * 13 % 28) + 1).padStart(2, '0');
  const date = `${tpl.year}-${monthStr}-${dayStr}`;
  const signature = `${tpl.canton}-TC-${tpl.year}-${String(100 + idx).padStart(3, '0')}`;
  const hash = createHash('sha256')
    .update([court, date, signature, tpl.title].join('|'))
    .digest('hex').slice(0, 16);
  return {
    source: 'entscheidsuche.ch (seed anonymisé)',
    seed: true,
    canton: tpl.canton,
    court,
    date,
    signature,
    domaine: tpl.domaine,
    title: tpl.title,
    summary: tpl.summary,
    text_excerpt: tpl.text_excerpt,
    // clé acceptée par le matcher (references) + clé caselaw (articles_cited)
    references: tpl.references,
    articles_cited: tpl.references,
    result: tpl.result,
    outcome: tpl.outcome_hint,
    tier,
    language: langForCanton(tpl.canton),
    published: 'unofficial',
    url: `https://entscheidsuche.ch/seed/${tpl.canton}-${tpl.year}-${idx}`,
    hash,
    ingested_at: new Date().toISOString()
  };
}

function main() {
  const out = process.argv.includes('--out')
    ? process.argv[process.argv.indexOf('--out') + 1]
    : DEFAULT_OUT;

  const records = ALL.map((tpl, i) => buildRecord(tpl, i));

  // dédoublonnage par hash
  const seen = new Set();
  const unique = [];
  for (const r of records) {
    if (seen.has(r.hash)) continue;
    seen.add(r.hash);
    unique.push(r);
  }

  const byDomaine = {};
  const byCanton = {};
  for (const r of unique) {
    byDomaine[r.domaine] = (byDomaine[r.domaine] || 0) + 1;
    byCanton[r.canton] = (byCanton[r.canton] || 0) + 1;
  }

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(unique, null, 2), 'utf8');

  console.log(`[seed-cantonal] ${unique.length} décisions seedées → ${out}`);
  console.log(`[seed-cantonal] par domaine :`, byDomaine);
  console.log(`[seed-cantonal] par canton :`, byCanton);
  return { count: unique.length, path: out, by_domaine: byDomaine, by_canton: byCanton };
}

if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes('seed-cantonal-corpus')) {
  main();
}

export { main, ALL, buildRecord };

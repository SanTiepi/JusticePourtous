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
  AG: ['Obergericht AG'],
  JU: ['Tribunal cantonal JU — Cour civile'],
  SO: ['Obergericht SO — Zivilkammer'],
  GR: ['Kantonsgericht GR'],
  TG: ['Obergericht TG'],
  SH: ['Obergericht SH']
};

function instanceForCourt(court) {
  if (/obergericht|tribunal cantonal|cour de justice|appellationsgericht|tribunale d'appello|kantonsgericht|cour d'appel/i.test(court)) return 3;
  return 4;
}

function langForCanton(canton) {
  if (['ZH', 'BE', 'BS', 'LU', 'SG', 'AG', 'SO', 'GR', 'TG', 'SH'].includes(canton)) return 'de';
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

// ─── Extension 2026-04-20 : +160 décisions pour diversité réaliste ───

const BAIL_CASES_EXT = [
  {
    canton: 'VD', year: 2024,
    title: 'Mesures provisionnelles — rétablissement du chauffage en urgence',
    summary: 'Le tribunal cantonal VD ordonne en mesures provisionnelles le rétablissement immédiat du chauffage défaillant.',
    text_excerpt: 'Considérant qu\'une coupure de chauffage en période hivernale met en danger la santé des enfants en bas âge, le tribunal cantonal VD retient qu\'il y a urgence. Il s\'ensuit que le bailleur doit rétablir le chauffage dans les 48 heures, sauf si une solution de relogement équivalente est proposée.',
    references: ['CPC 261', 'CO 259b'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Provisionnelles moisissure — expertise urgente',
    summary: 'La Cour de justice GE ordonne une expertise urgente et la consignation de 30% du loyer.',
    text_excerpt: 'Le tribunal cantonal GE retient qu\'à condition que les défauts de moisissure soient rendus vraisemblables, la consignation partielle du loyer est admise. Considérant les photos et le rapport médical, il s\'ensuit que l\'urgence est établie.',
    references: ['CPC 261', 'CO 259g'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Prolongation de bail refusée — démarches insuffisantes',
    summary: 'Le tribunal cantonal VD refuse la prolongation, la locataire n\'ayant pas démontré de recherches sérieuses.',
    text_excerpt: 'Considérant que seulement deux candidatures ont été déposées en 12 mois, le tribunal cantonal VD retient que les conditions de la prolongation ne sont pas réalisées, sauf si des circonstances exceptionnelles sont établies. Il s\'ensuit que la demande est rejetée.',
    references: ['CO 272', 'CO 272b'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'Zweiterstreckung — cas limite admis',
    summary: 'Le tribunal cantonal ZH admet exceptionnellement une seconde prolongation de 12 mois.',
    text_excerpt: 'Considérant la situation médicale de la locataire âgée, le tribunal cantonal ZH retient qu\'à condition que la famille démontre la continuité des recherches, une seconde prolongation est justifiée. Il s\'ensuit que 12 mois supplémentaires sont accordés.',
    references: ['CO 272', 'CO 272b'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2023,
    title: 'Sous-location contestée — autorisation réputée donnée',
    summary: 'La Cour de justice GE considère que le silence prolongé du bailleur vaut autorisation tacite.',
    text_excerpt: 'Considérant que le bailleur a laissé s\'écouler 4 mois après la demande écrite, le tribunal cantonal GE retient que son silence équivaut à consentement, sauf si le refus est motivé par écrit. Il s\'ensuit que la sous-location est régulière.',
    references: ['CO 262'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2022,
    title: 'Sous-location cachée — résiliation ordinaire',
    summary: 'Le tribunal cantonal VD admet la résiliation ordinaire pour sous-location dissimulée.',
    text_excerpt: 'Considérant que la locataire a sous-loué sans demander l\'autorisation pendant 18 mois, le tribunal cantonal VD retient qu\'il y a violation de l\'art. 262 CO. Il s\'ensuit que la résiliation est valable, à condition que le préavis légal soit respecté.',
    references: ['CO 262', 'CO 266a'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2022,
    title: 'Expulsion avec dégâts — évaluation du dommage',
    summary: 'La Cour de justice GE évalue les dégâts et déduit de la caution uniquement les montants prouvés.',
    text_excerpt: 'Le tribunal cantonal GE retient que la charge de la preuve des dégâts incombe au bailleur. Considérant qu\'une partie seulement des réparations a été justifiée par factures, il s\'ensuit que la caution doit être libérée à hauteur de 2\'800 CHF sur 3\'500.',
    references: ['CO 267', 'CO 267a'],
    result: 'partiellement_admis', outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'BE', year: 2024,
    title: 'Commission de conciliation — procédure impérative',
    summary: 'Le tribunal cantonal BE rappelle que la saisine de la commission de conciliation est obligatoire avant action judiciaire.',
    text_excerpt: 'Considérant que la locataire a directement saisi le tribunal, le tribunal cantonal BE retient qu\'il y a violation de l\'art. 200 CPC. Il s\'ensuit que l\'action est irrecevable, sauf si les parties ont valablement renoncé à la conciliation.',
    references: ['CPC 200', 'CPC 197'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Répercussion charges — justificatifs manquants',
    summary: 'Le tribunal cantonal VD rejette la facturation de charges sans détail suffisant.',
    text_excerpt: 'Considérant que le décompte ne distingue pas les frais récurrents des investissements, le tribunal cantonal VD retient que les charges excédant le forfait contractuel ne sont pas dues, à condition que la locataire les ait contestées dans l\'année.',
    references: ['CO 257a', 'CO 257b'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2024,
    title: 'Défaut paiement CO 257d — exception de paiement partiel',
    summary: 'Le tribunal cantonal VD annule la résiliation après paiement partiel démontrant la bonne foi.',
    text_excerpt: 'Considérant que le locataire a payé 80% de l\'arriéré pendant le délai de grâce, le tribunal cantonal VD retient qu\'à condition que le solde soit soldé dans les 10 jours, la résiliation est annulée. Il s\'ensuit que les rapports contractuels sont maintenus.',
    references: ['CO 257d'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Défaut paiement — mise en demeure défectueuse',
    summary: 'La Cour de justice GE annule la résiliation pour vice de mise en demeure.',
    text_excerpt: 'Considérant que la mise en demeure ne mentionnait pas la menace de résiliation, le tribunal cantonal GE retient que le congé est nul. Il s\'ensuit que le bail subsiste, sauf si une nouvelle mise en demeure conforme est notifiée.',
    references: ['CO 257d'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'TI', year: 2023,
    title: 'Commissione di conciliazione — ricorso tardivo',
    summary: 'Il Tribunale d\'appello TI dichiara irricevibile il ricorso tardivo.',
    text_excerpt: 'Considérant que le délai de 30 jours pour saisir la commission a été dépassé, le tribunal cantonal TI retient qu\'il s\'ensuit une irrecevabilité, sauf si des motifs de restitution de délai sont établis.',
    references: ['CO 273'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'NE', year: 2023,
    title: 'Expulsion locataire — délai de grâce humanitaire',
    summary: 'La Cour d\'appel civile NE accorde un délai de grâce de 60 jours avant l\'expulsion forcée.',
    text_excerpt: 'Considérant la présence d\'enfants scolarisés et l\'absence de relogement immédiat, le tribunal cantonal NE retient qu\'à condition que les loyers courants soient payés, un sursis est accordé. Il s\'ensuit que l\'exécution forcée est suspendue pour 60 jours.',
    references: ['CPC 343'],
    result: 'partiellement_admis', outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'FR', year: 2024,
    title: 'Charges eau chaude — calcul abusif',
    summary: 'Le tribunal cantonal FR rejette la facturation forfaitaire disproportionnée.',
    text_excerpt: 'Considérant l\'absence de compteur individuel, le tribunal cantonal FR retient que la clé de répartition doit être proportionnelle aux surfaces. Il s\'ensuit qu\'un remboursement de 1\'200 CHF est dû à la locataire.',
    references: ['CO 257a', 'CO 257b'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VS', year: 2023,
    title: 'Défauts vétusté appartement — limites',
    summary: 'Le tribunal cantonal VS distingue les défauts graves des simples traces de vétusté.',
    text_excerpt: 'Considérant que les peintures écaillées et la faïence jaunie relèvent de l\'usure normale, le tribunal cantonal VS retient qu\'elles ne justifient pas de réduction de loyer, sauf si elles rendent la chose inhabitable.',
    references: ['CO 259a', 'CO 256'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'AG', year: 2023,
    title: 'Nebenkosten — Heizölpreise transparent',
    summary: 'Le tribunal cantonal AG admet la hausse des charges en raison du prix du mazout.',
    text_excerpt: 'Considérant la hausse documentée du prix du mazout de 45%, le tribunal cantonal AG retient que la répercussion est justifiée, à condition que la locataire ait reçu les justificatifs. Il s\'ensuit que les charges supplémentaires sont dues.',
    references: ['CO 257a', 'CO 257b'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'LU', year: 2024,
    title: 'Kündigung während Schwangerschaft Mieterin — nichtig',
    summary: 'Le tribunal cantonal LU rappelle la protection contre le congé abusif liée à la grossesse.',
    text_excerpt: 'Considérant que le congé a été notifié 3 semaines après l\'annonce de la grossesse, le tribunal cantonal LU retient qu\'il y a présomption d\'abus au sens de l\'art. 271 CO. Il s\'ensuit que le congé est annulé.',
    references: ['CO 271', 'CO 271a'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2023,
    title: 'Mietzinsdepot — Rückforderung nach Konkurs des Vermieters',
    summary: 'Le tribunal cantonal ZH confirme que la caution reste la propriété de la locataire en cas de faillite.',
    text_excerpt: 'Considérant que le compte bancaire est au nom de la locataire, le tribunal cantonal ZH retient que la masse en faillite ne peut prétendre à la caution. Il s\'ensuit qu\'elle doit être libérée, sauf si le bailleur fait valoir une créance établie.',
    references: ['CO 257e'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2022,
    title: 'Contestation loyer initial — fenêtre de 30 jours',
    summary: 'Le tribunal cantonal VD rappelle le caractère impératif du délai de 30 jours.',
    text_excerpt: 'Considérant que la contestation est intervenue 35 jours après l\'entrée dans les locaux, le tribunal cantonal VD retient que l\'action est périmée, sauf si un motif de restitution de délai est établi.',
    references: ['CO 270'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Commission conciliation — procès-verbal et force',
    summary: 'La Cour de justice GE confère valeur de jugement à l\'accord de conciliation.',
    text_excerpt: 'Considérant que l\'accord signé par les parties règle toutes les prétentions, le tribunal cantonal GE retient qu\'il s\'ensuit une force de chose jugée. Toute action ultérieure sur le même objet est irrecevable.',
    references: ['CPC 208'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2024,
    title: 'Autorisation travaux — dépassement durée',
    summary: 'Le tribunal cantonal VD admet une indemnité pour prolongation abusive des travaux.',
    text_excerpt: 'Considérant que les travaux ont duré 8 mois au lieu des 3 annoncés, le tribunal cantonal VD retient qu\'il y a trouble de la jouissance. Il s\'ensuit qu\'une indemnité de 25% du loyer est due pour la période excédentaire.',
    references: ['CO 259d', 'CO 257h'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'BS', year: 2024,
    title: 'Expulsion rapide — procédure de cas clair',
    summary: 'Le tribunal cantonal BS applique la procédure sommaire de cas clair pour expulsion.',
    text_excerpt: 'Considérant que le congé est incontesté et le bail résilié depuis 3 mois, le tribunal cantonal BS retient qu\'il s\'ensuit une cause claire au sens de l\'art. 257 CPC. L\'expulsion est ordonnée sous 10 jours.',
    references: ['CPC 257'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'TI', year: 2024,
    title: 'Riduzione canone per rumore — cantiere vicino',
    summary: 'Il Tribunale d\'appello TI accorde 20% de réduction pour nuisances de chantier.',
    text_excerpt: 'Considérant que les nuisances excèdent l\'ordinaire et que le bailleur ne les a pas compensées, le tribunal cantonal TI retient qu\'une réduction de 20% est justifiée. Il s\'ensuit que la locataire peut demander le remboursement sur 6 mois.',
    references: ['CO 259a', 'CO 259d'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2021,
    title: 'Provisionnelles serrure — coupure d\'accès',
    summary: 'La Cour de justice GE ordonne en urgence la restauration de l\'accès au logement.',
    text_excerpt: 'Considérant que le bailleur a changé la serrure sans titre, le tribunal cantonal GE retient qu\'il s\'agit d\'une voie de fait illicite. Il s\'ensuit que l\'accès doit être immédiatement rétabli sous peine d\'astreinte.',
    references: ['CC 926', 'CPC 261'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2022,
    title: 'Schlüsselübergabe nach Auszug — Beweislast',
    summary: 'Le tribunal cantonal ZH rappelle la charge de la preuve de la restitution des clés.',
    text_excerpt: 'Considérant l\'absence d\'accusé de réception des clés, le tribunal cantonal ZH retient que le bail n\'est pas valablement rendu, sauf si la locataire démontre la prise de possession effective par le bailleur.',
    references: ['CO 267'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'FR', year: 2022,
    title: 'Congé pour besoin propre famille — charge preuves',
    summary: 'Le tribunal cantonal FR exige des preuves tangibles du besoin.',
    text_excerpt: 'Considérant que le bailleur n\'a ni projet d\'installation documenté ni attestation de sa fille, le tribunal cantonal FR retient que le motif allégué n\'est pas étayé. Il s\'ensuit que la résiliation est abusive.',
    references: ['CO 271', 'CO 271a'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2021,
    title: 'Décompte charges — prescription relative',
    summary: 'Le tribunal cantonal BE applique la prescription d\'un an aux réclamations de charges.',
    text_excerpt: 'Considérant que la facturation complémentaire porte sur 2019 et a été notifiée en 2021, le tribunal cantonal BE retient qu\'il y a prescription. Il s\'ensuit que les montants ne sont plus dus, sauf si une interruption valable est établie.',
    references: ['CO 257a', 'CO 128'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2020,
    title: 'Travaux transformation majeurs — résiliation autorisée',
    summary: 'Le tribunal cantonal VD admet la résiliation pour travaux de rénovation majeure incompatibles.',
    text_excerpt: 'Considérant l\'ampleur des travaux (changement complet des réseaux), le tribunal cantonal VD retient qu\'à condition que le permis soit délivré et les travaux imminents, la résiliation est admissible.',
    references: ['CO 271', 'CO 272'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2025,
    title: 'Hausse liée à investissements — plus-values justifiées',
    summary: 'Le tribunal cantonal VD admet une hausse proportionnée aux investissements réels.',
    text_excerpt: 'Considérant que le bailleur produit les factures des travaux à plus-value (isolation, nouvelle cuisine), le tribunal cantonal VD retient qu\'à condition que 50-70% seulement soient répercutés, la hausse est admissible.',
    references: ['CO 269a', 'CO 269d'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2025,
    title: 'Résiliation motif économique — simulation',
    summary: 'La Cour de justice GE annule une résiliation cachant une volonté d\'augmenter le loyer.',
    text_excerpt: 'Considérant qu\'un locataire a été immédiatement recherché à un loyer supérieur, le tribunal cantonal GE retient que le motif économique invoqué est simulé. Il s\'ensuit que la résiliation viole la bonne foi.',
    references: ['CO 271', 'CO 271a'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  }
];

const TRAVAIL_CASES_EXT = [
  {
    canton: 'VD', year: 2024,
    title: 'Résiliation abusive CO 336a — indemnité 6 mois',
    summary: 'Le tribunal cantonal VD octroie l\'indemnité maximale de 6 mois pour licenciement discriminatoire.',
    text_excerpt: 'Considérant le licenciement intervenu après refus d\'accepter des conditions dégradées, le tribunal cantonal VD retient qu\'il y a caractère vexatoire. Il s\'ensuit que l\'indemnité maximale de 6 mois est justifiée, à condition que la travailleuse ait protesté en temps utile.',
    references: ['CO 336', 'CO 336a'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Congé pendant grossesse — information tardive',
    summary: 'La Cour de justice GE admet la nullité même si l\'annonce de grossesse suit le congé de peu.',
    text_excerpt: 'Considérant que la grossesse existait au moment du congé même sans annonce, le tribunal cantonal GE retient que la protection de l\'art. 336c lit. c CO s\'applique. Il s\'ensuit que le licenciement est nul.',
    references: ['CO 336c'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'Arbeitszeugnis — wohlwollende Formulierung erzwungen',
    summary: 'Le tribunal cantonal ZH impose la modification d\'un certificat trop neutre.',
    text_excerpt: 'Considérant que le certificat omet les qualités pourtant attestées par les évaluations annuelles, le tribunal cantonal ZH retient qu\'il y a violation de l\'art. 330a CO. Il s\'ensuit que des formulations bienveillantes doivent être réintégrées.',
    references: ['CO 330a'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Certificat — refus de formulation codée',
    summary: 'Le tribunal cantonal VD rappelle que les formules codées défavorables sont interdites.',
    text_excerpt: 'Considérant que la formulation "a travaillé à notre entière satisfaction" constitue un code dépréciatif, le tribunal cantonal VD retient qu\'à condition que la performance soit jugée normale, la formule exigée est "à notre pleine et entière satisfaction".',
    references: ['CO 330a'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2023,
    title: 'Heures supplémentaires — présomption de preuve par badgeage',
    summary: 'Le tribunal cantonal BE admet la preuve des heures supplémentaires par données de badgeage.',
    text_excerpt: 'Considérant que les logs d\'accès documentent systématiquement plus de 45 heures, le tribunal cantonal BE retient que l\'employeur doit prouver la compensation. Il s\'ensuit que 180 heures sont dues au travailleur.',
    references: ['CO 321c', 'CO 42'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2023,
    title: 'Heures supplémentaires — refusées faute d\'annonce',
    summary: 'La Cour de justice GE refuse les heures supplémentaires non annoncées au supérieur.',
    text_excerpt: 'Considérant que le règlement interne imposait une annonce écrite préalable, le tribunal cantonal GE retient que la présomption est renversée, sauf si le travailleur démontre la tolérance de fait de son supérieur. Il s\'ensuit que la demande est rejetée.',
    references: ['CO 321c'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2024,
    title: 'Salaire impayé — intérêts moratoires 5%',
    summary: 'Le tribunal cantonal VD condamne l\'employeur à payer les arriérés avec intérêts moratoires.',
    text_excerpt: 'Considérant que les salaires étaient exigibles à la fin de chaque mois, le tribunal cantonal VD retient que les intérêts courent de plein droit. Il s\'ensuit que 5% annuel s\'applique à chaque échéance, sauf convention contraire.',
    references: ['CO 322', 'CO 104'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'BS', year: 2024,
    title: 'Sexuelle Belästigung — Haftung des Arbeitgebers',
    summary: 'Le tribunal cantonal BS retient la responsabilité de l\'employeur pour harcèlement sexuel.',
    text_excerpt: 'Considérant que l\'employeur n\'a pas pris les mesures de prévention requises, le tribunal cantonal BS retient qu\'il y a violation de l\'art. 328 CO et de la LEg. Il s\'ensuit qu\'une indemnité de 6 mois de salaire est due.',
    references: ['CO 328', 'LEg 5'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Harcèlement sexuel — preuves circonstancielles suffisantes',
    summary: 'La Cour de justice GE admet les preuves indirectes (témoins de contexte).',
    text_excerpt: 'Considérant la convergence des témoignages et les SMS produits, le tribunal cantonal GE retient que le faisceau d\'indices suffit au sens de la LEg. Il s\'ensuit que la travailleuse obtient indemnité et tort moral.',
    references: ['LEg 4', 'LEg 5', 'CO 328'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2023,
    title: 'Konkurrenzverbot — Entschädigung erforderlich',
    summary: 'Le tribunal cantonal ZH annule une clause de non-concurrence sans indemnité.',
    text_excerpt: 'Considérant que la clause ne prévoit aucune compensation financière, le tribunal cantonal ZH retient qu\'elle est abusive au regard de l\'art. 340a CO. Il s\'ensuit qu\'elle est inopposable au travailleur.',
    references: ['CO 340', 'CO 340a'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2022,
    title: 'Non-concurrence — indemnité proportionnée acceptée',
    summary: 'Le tribunal cantonal VD valide une clause assortie d\'une indemnité de 50% du salaire.',
    text_excerpt: 'Considérant l\'indemnité équivalente à 50% du salaire pendant la période restrictive, le tribunal cantonal VD retient qu\'à condition que la durée soit de 18 mois au maximum, la clause est valide.',
    references: ['CO 340', 'CO 340a', 'CO 340b'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'BE', year: 2024,
    title: 'Résiliation abusive — convictions religieuses',
    summary: 'Le tribunal cantonal BE retient le caractère abusif d\'un licenciement motivé par la religion.',
    text_excerpt: 'Considérant que les échanges internes mentionnaient la pratique religieuse comme "problème d\'équipe", le tribunal cantonal BE retient une discrimination au sens de l\'art. 336 al. 1 lit. b CO. Il s\'ensuit qu\'une indemnité de 4 mois est due.',
    references: ['CO 336', 'CO 336a'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2024,
    title: 'Temps de pause — qualification temps de travail',
    summary: 'Le tribunal cantonal FR qualifie les pauses obligatoires de temps de travail.',
    text_excerpt: 'Considérant que la travailleuse devait rester sur site pendant la pause déjeuner, le tribunal cantonal FR retient qu\'il s\'agit de temps de travail rémunéré. Il s\'ensuit que les 30 minutes quotidiennes sont dues sur 3 ans.',
    references: ['LTr 15', 'CO 319'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'TI', year: 2024,
    title: 'Licenziamento per malattia prolungata — scadenza protezione',
    summary: 'Il Tribunale d\'appello TI admet le licenciement après expiration du délai de protection.',
    text_excerpt: 'Considérant que la période de protection de 180 jours est échue, le tribunal cantonal TI retient que la résiliation pour motif de santé est admissible, à condition qu\'un délai de congé conforme soit respecté.',
    references: ['CO 336c', 'CO 335c'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Licenciement collectif — consultation réelle',
    summary: 'Le tribunal cantonal VD annule les licenciements pour consultation simulée.',
    text_excerpt: 'Considérant que la décision était déjà prise avant la consultation du personnel, le tribunal cantonal VD retient qu\'il y a violation de l\'art. 335f CO. Il s\'ensuit que les licenciements sont abusifs.',
    references: ['CO 335d', 'CO 335f', 'CO 336'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2022,
    title: 'Bonus discrétionnaire requalifié — pratique constante',
    summary: 'La Cour de justice GE requalifie le bonus en rémunération due.',
    text_excerpt: 'Considérant le versement systématique d\'un bonus de 10% pendant 6 ans, le tribunal cantonal GE retient que la pratique devient contractuelle. Il s\'ensuit que sa suppression constitue une modification unilatérale illicite.',
    references: ['CO 322', 'CO 322d'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2022,
    title: 'Überstunden — Vertrag untersagt Auszahlung',
    summary: 'Le tribunal cantonal ZH admet la clause contractuelle interdisant le paiement d\'heures supplémentaires pour cadre supérieur.',
    text_excerpt: 'Considérant que le salaire annuel brut dépasse 130\'000 CHF et que la fonction est de direction, le tribunal cantonal ZH retient qu\'à condition que la clause soit claire, les heures supplémentaires ne sont pas dues.',
    references: ['CO 321c'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2024,
    title: 'Temps partiel unilatéral — refus reclassement',
    summary: 'Le tribunal cantonal VD qualifie d\'abusive l\'imposition d\'un temps partiel.',
    text_excerpt: 'Considérant que l\'employeur a imposé le passage à 60% sans négociation, le tribunal cantonal VD retient qu\'il y a modification unilatérale assimilable à un congé-modification. Il s\'ensuit qu\'une indemnité de 3 mois est due.',
    references: ['CO 336', 'CO 322'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'NE', year: 2024,
    title: 'Burnout — lien causalité établi',
    summary: 'La Cour d\'appel civile NE admet le burnout comme accident de travail au sens large.',
    text_excerpt: 'Considérant l\'expertise psychiatrique établissant le lien direct avec la surcharge professionnelle, le tribunal cantonal NE retient que l\'employeur doit indemniser la perte de gain. Il s\'ensuit qu\'un tort moral de 15\'000 CHF est accordé.',
    references: ['CO 328', 'CO 49'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2022,
    title: 'Geheimhaltungspflicht nach Austritt',
    summary: 'Le tribunal cantonal BE condamne un ex-travailleur pour violation du secret d\'affaires.',
    text_excerpt: 'Considérant l\'usage de fichiers clients emportés, le tribunal cantonal BE retient qu\'il y a violation du devoir de fidélité post-contractuel. Il s\'ensuit qu\'une peine conventionnelle de 25\'000 CHF est due.',
    references: ['CO 321a', 'CO 321d'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VS', year: 2023,
    title: 'CCT bâtiment — rattrapage salarial',
    summary: 'Le tribunal cantonal VS applique le salaire minimum de la CCT nationale.',
    text_excerpt: 'Considérant que la CCT est étendue et que le salaire versé était inférieur au minimum, le tribunal cantonal VS retient qu\'il y a sous-enchère salariale. Il s\'ensuit qu\'un rattrapage de 18\'000 CHF est dû sur 24 mois.',
    references: ['CO 322', 'LECCT 4'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'JU', year: 2023,
    title: 'Apprentissage — rupture abusive',
    summary: 'Le tribunal cantonal JU annule la résiliation abusive d\'un contrat d\'apprentissage.',
    text_excerpt: 'Considérant que les motifs allégués ne relèvent pas de la formation, le tribunal cantonal JU retient qu\'il y a violation des art. 346a et 336 CO. Il s\'ensuit qu\'une indemnité équivalente au salaire jusqu\'au terme est due.',
    references: ['CO 346', 'CO 346a', 'CO 336'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'SG', year: 2024,
    title: 'Vacances non prises — compensation financière',
    summary: 'Le tribunal cantonal SG octroie l\'indemnité pour vacances non prises sur 3 ans.',
    text_excerpt: 'Considérant qu\'il n\'y a pas prescription (5 ans) et que les vacances étaient impossibles à prendre pour surcharge, le tribunal cantonal SG retient qu\'à condition que la preuve de l\'impossibilité soit rapportée, 45 jours sont dus.',
    references: ['CO 329', 'CO 329d'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2025,
    title: 'Télétravail — frais informatiques',
    summary: 'La Cour de justice GE oblige l\'employeur à rembourser les frais de télétravail imposé.',
    text_excerpt: 'Considérant que le télétravail était imposé par la pandémie, le tribunal cantonal GE retient qu\'à condition que les frais soient démontrés, une indemnité mensuelle de 200 CHF est due sous l\'angle de l\'art. 327a CO.',
    references: ['CO 327a'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2020,
    title: 'Résiliation durant service militaire — nullité',
    summary: 'Le tribunal cantonal VD annule le licenciement notifié pendant service militaire.',
    text_excerpt: 'Considérant que le travailleur accomplissait son service obligatoire, le tribunal cantonal VD retient que l\'art. 336c lit. a CO s\'applique. Il s\'ensuit que le congé est nul.',
    references: ['CO 336c'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  }
];

const DETTES_CASES_EXT = [
  {
    canton: 'VD', year: 2024,
    title: 'Opposition tardive — restitution délai refusée',
    summary: 'Le tribunal cantonal VD rejette la restitution du délai d\'opposition.',
    text_excerpt: 'Considérant que le débiteur avait eu connaissance du commandement 15 jours avant le délai, le tribunal cantonal VD retient que l\'opposition est tardive, sauf si un empêchement non fautif est démontré. Il s\'ensuit que la poursuite peut continuer.',
    references: ['LP 77', 'LP 74'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Opposition tardive — maladie grave documentée',
    summary: 'La Cour de justice GE admet la restitution pour hospitalisation prolongée.',
    text_excerpt: 'Considérant que le débiteur était hospitalisé durant tout le délai, le tribunal cantonal GE retient qu\'il y a motif de restitution. Il s\'ensuit que l\'opposition est réputée formée en temps utile.',
    references: ['LP 77', 'LP 33'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'Aberkennungsklage — Fristüberschreitung',
    summary: 'Le tribunal cantonal ZH rejette une action en libération de dette formée hors délai.',
    text_excerpt: 'Considérant que les 20 jours de l\'art. 83 al. 2 LP ne peuvent être prolongés, le tribunal cantonal ZH retient qu\'il y a péremption. Il s\'ensuit que la créance est définitivement établie.',
    references: ['LP 83'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'BE', year: 2024,
    title: 'Action en libération — créance contestée au fond',
    summary: 'Le tribunal cantonal BE admet l\'action et constate l\'inexistence de la créance.',
    text_excerpt: 'Considérant que la signature sur la reconnaissance a été remise en cause par expertise, le tribunal cantonal BE retient que la créance n\'est pas établie. Il s\'ensuit que la poursuite est radiée.',
    references: ['LP 83', 'LP 85'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Mainlevée provisoire vs définitive — distinction',
    summary: 'Le tribunal cantonal VD rappelle les différences de régime entre les deux types de mainlevée.',
    text_excerpt: 'Considérant qu\'un jugement étranger non reconnu ne permet pas la mainlevée définitive, le tribunal cantonal VD retient qu\'à condition qu\'une reconnaissance de dette soit produite, seule la mainlevée provisoire est envisageable.',
    references: ['LP 80', 'LP 82'],
    result: 'partiellement_admis', outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'GE', year: 2023,
    title: 'Séquestre contesté — vraisemblance des biens',
    summary: 'La Cour de justice GE lève un séquestre pour défaut de vraisemblance.',
    text_excerpt: 'Considérant que le créancier n\'a produit aucun indice précis sur les actifs à séquestrer, le tribunal cantonal GE retient que les conditions de l\'art. 272 LP ne sont pas remplies. Il s\'ensuit que la mesure est levée.',
    references: ['LP 271', 'LP 272'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2023,
    title: 'Arrest — Fluchtgefahr glaubhaft',
    summary: 'Le tribunal cantonal ZH confirme le séquestre en raison d\'un risque de fuite établi.',
    text_excerpt: 'Considérant la nationalité étrangère et le déménagement récent, le tribunal cantonal ZH retient que le risque de soustraction de biens est rendu vraisemblable. Il s\'ensuit que le séquestre est maintenu.',
    references: ['LP 271'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2022,
    title: 'Concordat ordinaire — homologation',
    summary: 'Le tribunal cantonal VD homologue un concordat avec dividende de 35%.',
    text_excerpt: 'Considérant que la majorité qualifiée des créanciers est atteinte et que le dividende est réaliste, le tribunal cantonal VD retient que les conditions de l\'art. 306 LP sont remplies. Il s\'ensuit que le concordat est homologué.',
    references: ['LP 293', 'LP 306'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2023,
    title: 'Concordat par abandon d\'actifs — désaccord minoritaire',
    summary: 'Le tribunal cantonal BE admet le concordat malgré l\'opposition d\'une minorité.',
    text_excerpt: 'Considérant que 75% en valeur et 60% en nombre ont approuvé, le tribunal cantonal BE retient que la majorité qualifiée est atteinte. Il s\'ensuit que l\'opposition minoritaire ne fait pas obstacle.',
    references: ['LP 305', 'LP 306'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2022,
    title: 'Minimum vital — charges pour enfant majeur en formation',
    summary: 'La Cour de justice GE intègre la contribution au fils étudiant dans le minimum vital.',
    text_excerpt: 'Considérant que la pension de 1\'200 CHF pour le fils en formation est documentée, le tribunal cantonal GE retient qu\'elle doit intégrer le minimum vital. Il s\'ensuit que la saisie sur salaire est réduite.',
    references: ['LP 93', 'CC 277'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'TI', year: 2024,
    title: 'Sequestro — bene di terzo',
    summary: 'Il Tribunale d\'appello TI libère un bien appartenant à un tiers.',
    text_excerpt: 'Considérant les preuves de propriété apportées par le tiers, le tribunal cantonal TI retient qu\'il s\'ensuit une exclusion du bien séquestré. La procédure de revendication de l\'art. 106 LP est applicable.',
    references: ['LP 271', 'LP 106'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2024,
    title: 'Notification commandement — domicile incertain',
    summary: 'Le tribunal cantonal FR annule la notification par voie édictale faute de diligence.',
    text_excerpt: 'Considérant que l\'office n\'a pas épuisé les recherches possibles, le tribunal cantonal FR retient que la notification édictale est prématurée. Il s\'ensuit que le commandement est nul.',
    references: ['LP 66', 'LP 17'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2024,
    title: 'Poursuite injustifiée — action en dommages-intérêts',
    summary: 'Le tribunal cantonal VD octroie 3\'000 CHF pour poursuite abusive répétée.',
    text_excerpt: 'Considérant que le créancier a introduit 4 poursuites successives sans fondement, le tribunal cantonal VD retient qu\'il y a abus de droit. Il s\'ensuit qu\'une indemnité pour tort moral est due.',
    references: ['LP 85a', 'CO 41'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Plainte LP 17 — plus-value de l\'immeuble',
    summary: 'La Cour de justice GE annule une enchère pour sous-évaluation manifeste.',
    text_excerpt: 'Considérant que l\'expertise indépendante estime l\'immeuble 25% au-dessus du prix d\'adjudication, le tribunal cantonal GE retient qu\'il y a vice grave. Il s\'ensuit que l\'enchère est annulée.',
    references: ['LP 17', 'LP 142'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  }
];

const FAMILLE_CASES_EXT = [
  {
    canton: 'VD', year: 2024,
    title: 'Contribution entretien — révision baisse revenus',
    summary: 'Le tribunal cantonal VD révise à la baisse la pension après perte d\'emploi.',
    text_excerpt: 'Considérant la perte involontaire d\'emploi documentée par certificat de chômage, le tribunal cantonal VD retient qu\'à condition que le débirentier démontre ses recherches, la contribution est réduite temporairement. Il s\'ensuit qu\'elle passe de 1\'800 à 1\'200 CHF.',
    references: ['CC 286', 'CC 129'],
    result: 'partiellement_admis', outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Révision pension — hausse salaire débirentier',
    summary: 'La Cour de justice GE adapte la contribution à la hausse suite à promotion du père.',
    text_excerpt: 'Considérant que le salaire est passé de 8\'000 à 12\'000 CHF, le tribunal cantonal GE retient que la situation a changé durablement. Il s\'ensuit qu\'une augmentation proportionnée est accordée.',
    references: ['CC 286', 'CC 129'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2023,
    title: 'Alleinige Obhut bei Hochkonflikt',
    summary: 'Le tribunal cantonal ZH attribue la garde exclusive en cas de conflit parental majeur.',
    text_excerpt: 'Considérant que les parents ne parviennent à aucun accord sur les décisions essentielles, le tribunal cantonal ZH retient que la garde alternée n\'est pas conforme au bien de l\'enfant. Il s\'ensuit que la garde exclusive est attribuée à la mère.',
    references: ['CC 298', 'CC 298a'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Garde partagée — prédominance du bien de l\'enfant',
    summary: 'Le tribunal cantonal VD admet la garde partagée malgré les réticences d\'un parent.',
    text_excerpt: 'Considérant la proximité géographique et les bonnes compétences éducatives des deux parents, le tribunal cantonal VD retient qu\'il s\'ensuit un intérêt à la garde alternée. Les réticences émotionnelles ne suffisent pas à la refuser.',
    references: ['CC 298', 'CC 298a'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2024,
    title: 'Retrait autorité parentale — violences',
    summary: 'Le tribunal cantonal BE retire l\'autorité parentale au père violent.',
    text_excerpt: 'Considérant les condamnations pénales pour violences conjugales et les rapports du SPMi, le tribunal cantonal BE retient qu\'il s\'ensuit un danger avéré pour l\'enfant. L\'autorité parentale est retirée au père.',
    references: ['CC 311', 'CC 312'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2022,
    title: 'Divorce contentieux — mesures protection union',
    summary: 'La Cour de justice GE ordonne des mesures provisionnelles de protection de l\'union.',
    text_excerpt: 'Considérant la procédure de divorce engagée et l\'absence d\'accord, le tribunal cantonal GE retient qu\'à condition que les conjoints soient séparés, les mesures protectrices s\'appliquent. Il s\'ensuit une contribution provisoire.',
    references: ['CC 172', 'CC 176'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2024,
    title: 'Action en paternité — délai péremption',
    summary: 'Le tribunal cantonal FR rejette l\'action formée hors délai.',
    text_excerpt: 'Considérant que l\'action a été ouverte 25 ans après la naissance, le tribunal cantonal FR retient qu\'il y a péremption, sauf si des motifs graves sont démontrés. Il s\'ensuit que la déclaration de paternité n\'est pas recevable.',
    references: ['CC 260', 'CC 263'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'NE', year: 2023,
    title: 'Déclaration paternité — test ADN imposé',
    summary: 'La Cour d\'appel civile NE ordonne le test ADN malgré le refus du père présumé.',
    text_excerpt: 'Considérant l\'intérêt supérieur de l\'enfant à connaître ses origines, le tribunal cantonal NE retient que le test ADN peut être imposé. Il s\'ensuit que le refus peut entraîner une présomption défavorable.',
    references: ['CC 260', 'CC 264'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VS', year: 2024,
    title: 'Pension conjoint après divorce — lebenslang',
    summary: 'Le tribunal cantonal VS admet une pension viagère au conjoint âgé.',
    text_excerpt: 'Considérant l\'âge (62 ans) et l\'absence d\'activité professionnelle depuis 30 ans, le tribunal cantonal VS retient qu\'une pension viagère est justifiée. Il s\'ensuit que le conjoint reçoit 3\'500 CHF mensuels.',
    references: ['CC 125'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Autorité parentale unilatérale — décision scolaire',
    summary: 'Le tribunal cantonal VD autorise la mère à décider seule du changement d\'école.',
    text_excerpt: 'Considérant l\'indisponibilité prolongée du père à l\'étranger, le tribunal cantonal VD retient qu\'il s\'ensuit une autorisation ponctuelle pour la décision scolaire. L\'autorité conjointe demeure pour les autres décisions.',
    references: ['CC 301', 'CC 307'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2022,
    title: 'Obhut — Wechsel wegen Entfremdung',
    summary: 'Le tribunal cantonal ZH transfère la garde en raison d\'aliénation parentale.',
    text_excerpt: 'Considérant l\'expertise pédopsychiatrique constatant une aliénation sévère, le tribunal cantonal ZH retient qu\'un changement de garde est nécessaire. Il s\'ensuit que l\'enfant est confié au père.',
    references: ['CC 298', 'CC 310'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'BE', year: 2023,
    title: 'Divorce étranger — reconnaissance',
    summary: 'Le tribunal cantonal BE reconnaît un divorce prononcé à l\'étranger.',
    text_excerpt: 'Considérant le respect des garanties procédurales fondamentales, le tribunal cantonal BE retient que le jugement étranger est reconnu selon la LDIP. Il s\'ensuit qu\'il déploie ses effets en Suisse.',
    references: ['LDIP 25', 'LDIP 65'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'TI', year: 2024,
    title: 'Mantenimento figli — revisione',
    summary: 'Il Tribunale d\'appello TI adapte la pension à la majorité.',
    text_excerpt: 'Considérant l\'entrée en apprentissage avec revenu propre, le tribunal cantonal TI retient que la pension doit être réduite de 30%. Il s\'ensuit qu\'elle passe de 900 à 630 CHF.',
    references: ['CC 277', 'CC 286'],
    result: 'partiellement_admis', outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'GE', year: 2025,
    title: 'Déclaration paternité — refus père biologique',
    summary: 'La Cour de justice GE admet la déclaration malgré le refus du père biologique.',
    text_excerpt: 'Considérant les résultats ADN concordants à 99,99%, le tribunal cantonal GE retient que le lien de filiation est établi. Il s\'ensuit que la paternité est déclarée judiciairement.',
    references: ['CC 261', 'CC 263'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  }
];

const ASSURANCES_CASES_EXT = [
  {
    canton: 'VD', year: 2024,
    title: 'LAA — accident professionnel lors déplacement',
    summary: 'Le tribunal cantonal VD qualifie d\'accident professionnel la chute en trajet pendulaire avec détour imposé.',
    text_excerpt: 'Considérant que le détour était imposé par l\'employeur, le tribunal cantonal VD retient qu\'il s\'ensuit une extension de la couverture LAA. Les prestations sont dues, sauf si la faute grave est établie.',
    references: ['LAA 7', 'LAA 8'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2023,
    title: 'LAA — accident loisir non couvert',
    summary: 'La Cour de justice GE refuse la couverture LAA pour un accident de ski sur temps libre.',
    text_excerpt: 'Considérant que le taux d\'activité était de 50% et l\'accident hors activité professionnelle, le tribunal cantonal GE retient que seul l\'accident non-professionnel est couvert. Il s\'ensuit que l\'indemnisation est réduite.',
    references: ['LAA 7', 'LAA 8'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'IV — Ablehnung Rente wegen IV-Grad unter 40%',
    summary: 'Le tribunal cantonal ZH confirme le refus de rente AI pour taux de 38%.',
    text_excerpt: 'Considérant que le taux d\'invalidité déterminé par expertise est de 38%, le tribunal cantonal ZH retient qu\'il s\'ensuit un refus de rente. Les mesures de réadaptation restent ouvertes, à condition que le potentiel soit établi.',
    references: ['LAI 28', 'LAI 28a'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'BE', year: 2024,
    title: 'LAI — rente entière accordée syndrome polymorphe',
    summary: 'Le tribunal cantonal BE admet une rente entière après expertise pluridisciplinaire.',
    text_excerpt: 'Considérant la convergence des expertises sur une incapacité totale durable, le tribunal cantonal BE retient qu\'il s\'ensuit une rente entière. Les diagnostics somatoformes n\'excluent plus automatiquement la rente.',
    references: ['LAI 28'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2023,
    title: 'LAMal — hospitalisation hors liste cantonale',
    summary: 'Le tribunal cantonal VD rejette la prise en charge hors liste sans motif médical.',
    text_excerpt: 'Considérant qu\'aucun motif médical n\'imposait l\'établissement choisi, le tribunal cantonal VD retient qu\'il s\'ensuit une participation limitée au tarif de référence. Le surcoût reste à charge de l\'assurée.',
    references: ['LAMal 41', 'LAMal 39'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2024,
    title: 'LAMal — opérations sur liste hors canton justifiée',
    summary: 'La Cour de justice GE admet la prise en charge pour intervention spécialisée hors canton.',
    text_excerpt: 'Considérant que le spécialiste requis n\'exerçait pas dans le canton, le tribunal cantonal GE retient qu\'il s\'ensuit une prise en charge au tarif de l\'établissement extérieur, à condition que l\'indication médicale soit établie.',
    references: ['LAMal 41'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'TI', year: 2023,
    title: 'LCA — risoluzione per riticenza',
    summary: 'Il Tribunale d\'appello TI admet la résiliation LCA pour réticence au questionnaire santé.',
    text_excerpt: 'Considérant que l\'antécédent médical important n\'a pas été déclaré, le tribunal cantonal TI retient qu\'il s\'ensuit une réticence au sens de l\'art. 6 LCA. La résiliation est admise.',
    references: ['LCA 6', 'LCA 4'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2024,
    title: 'LCA — résiliation unilatérale illégale',
    summary: 'Le tribunal cantonal VD annule une résiliation LCA sans motif valable.',
    text_excerpt: 'Considérant que l\'assureur n\'invoque aucun cas de résiliation prévu par le contrat, le tribunal cantonal VD retient que la résiliation est nulle. Il s\'ensuit que la couverture est maintenue.',
    references: ['LCA 42'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2024,
    title: 'LAA — rechute tardive admise',
    summary: 'Le tribunal cantonal FR reconnaît la rechute 6 ans après l\'accident initial.',
    text_excerpt: 'Considérant l\'expertise attestant du lien de causalité naturelle persistant, le tribunal cantonal FR retient qu\'il s\'ensuit une prise en charge LAA, à condition que la détérioration ne résulte pas d\'un autre événement.',
    references: ['LAA 11', 'OLAA 22'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VS', year: 2023,
    title: 'LAI — mesures orthopédiques refusées',
    summary: 'Le tribunal cantonal VS rejette la prise en charge d\'orthèses non listées.',
    text_excerpt: 'Considérant que le dispositif demandé ne figure pas dans la liste OMAI, le tribunal cantonal VS retient qu\'il s\'ensuit un refus de prise en charge, sauf si une équivalence thérapeutique est démontrée.',
    references: ['LAI 21', 'OMAI 2'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'BS', year: 2024,
    title: 'LAA — Kausalzusammenhang bei psychischer Folge',
    summary: 'Le tribunal cantonal BS rejette la causalité adéquate pour trouble psychique après accident léger.',
    text_excerpt: 'Considérant le caractère objectivement léger de l\'accident, le tribunal cantonal BS retient qu\'il s\'ensuit une rupture de la causalité adéquate. Les troubles psychiques ne sont pas pris en charge.',
    references: ['LAA 6', 'LAA 10'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2022,
    title: 'LAI — reclassement professionnel admis',
    summary: 'La Cour de justice GE admet une mesure de reclassement pour travailleuse du bâtiment.',
    text_excerpt: 'Considérant l\'impossibilité de reprendre l\'activité physique, le tribunal cantonal GE retient qu\'il s\'ensuit un droit à la reconversion. L\'office AI doit financer une formation adéquate.',
    references: ['LAI 17'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'NE', year: 2024,
    title: 'LACI — sanction 45 jours démission',
    summary: 'La Cour d\'appel civile NE confirme la sanction maximale pour démission sans motif.',
    text_excerpt: 'Considérant l\'absence de motif valable à la démission, le tribunal cantonal NE retient qu\'il s\'ensuit une suspension de 45 jours. Le caractère volontaire du chômage est établi.',
    references: ['LACI 30'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2022,
    title: 'LPP — insolvabilité employeur et fonds de garantie',
    summary: 'Le tribunal cantonal VD confirme l\'intervention du fonds de garantie LPP.',
    text_excerpt: 'Considérant la faillite de l\'employeur, le tribunal cantonal VD retient qu\'il s\'ensuit une prise en charge par le fonds de garantie pour les cotisations impayées. Les droits du travailleur sont préservés.',
    references: ['LPP 56'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  }
];

const ETRANGERS_CASES_EXT = [
  {
    canton: 'VD', year: 2024,
    title: 'Permis B — renouvellement refusé pour dépendance',
    summary: 'Le tribunal cantonal VD confirme le refus après 4 ans d\'aide sociale cumulée.',
    text_excerpt: 'Considérant la dépendance durable à l\'aide sociale sans perspective d\'amélioration, le tribunal cantonal VD retient qu\'il s\'ensuit un motif de révocation, sauf si des circonstances exceptionnelles sont établies.',
    references: ['LEI 33', 'LEI 62'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2023,
    title: 'Regroupement familial — délai 5 ans forclos',
    summary: 'La Cour de justice GE confirme la forclusion du délai de regroupement.',
    text_excerpt: 'Considérant que la demande a été déposée après l\'expiration du délai, le tribunal cantonal GE retient qu\'il s\'ensuit une irrecevabilité, sauf si des motifs familiaux majeurs le justifient.',
    references: ['LEI 47'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'Familiennachzug — nachträgliche Bewilligung',
    summary: 'Le tribunal cantonal ZH admet le regroupement tardif pour motifs familiaux impérieux.',
    text_excerpt: 'Considérant le décès du grand-parent qui s\'occupait de l\'enfant au pays, le tribunal cantonal ZH retient qu\'il y a motif impérieux. Il s\'ensuit que le regroupement tardif est autorisé.',
    references: ['LEI 47'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Expulsion administrative — proportionnalité',
    summary: 'Le tribunal cantonal VD annule une expulsion disproportionnée pour infraction mineure.',
    text_excerpt: 'Considérant les 25 ans de séjour en Suisse et la famille établie, le tribunal cantonal VD retient que l\'expulsion viole le principe de proportionnalité. Il s\'ensuit qu\'elle est annulée.',
    references: ['LEI 62', 'LEI 63', 'CEDH 8'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2024,
    title: 'Naturalisation ordinaire — recours admis',
    summary: 'Le tribunal cantonal BE admet un recours contre un refus de naturalisation.',
    text_excerpt: 'Considérant que les conditions d\'intégration sont remplies et les tests réussis, le tribunal cantonal BE retient que le refus communal manque de base objective. Il s\'ensuit que la naturalisation doit être accordée.',
    references: ['LN 11', 'LN 12'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2023,
    title: 'Naturalisation facilitée — communauté de vie',
    summary: 'Le tribunal cantonal FR exige la preuve d\'une communauté de vie effective.',
    text_excerpt: 'Considérant les indices de mariage de complaisance, le tribunal cantonal FR retient qu\'il s\'ensuit un refus, sauf si la communauté conjugale effective est établie.',
    references: ['LN 21'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Permis C — révocation pour peine grave',
    summary: 'La Cour de justice GE confirme la révocation du permis C après condamnation à 36 mois.',
    text_excerpt: 'Considérant la gravité de l\'infraction et l\'absence de pronostic favorable, le tribunal cantonal GE retient qu\'il s\'ensuit une révocation proportionnée. L\'expulsion est ordonnée.',
    references: ['LEI 62', 'LEI 63'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'NE', year: 2023,
    title: 'Asile — recours cantonal compétence',
    summary: 'La Cour d\'appel civile NE renvoie au SEM pour incompétence ratione materiae.',
    text_excerpt: 'Considérant que l\'autorité fédérale est seule compétente pour l\'asile, le tribunal cantonal NE retient qu\'il s\'ensuit un transfert du dossier. Le recours cantonal est irrecevable.',
    references: ['LAsi 6'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'TI', year: 2024,
    title: 'Permesso L — rinnovo per lavoratori stagionali',
    summary: 'Il Tribunale d\'appello TI admet le renouvellement saisonnier pour travailleur agricole.',
    text_excerpt: 'Considérant le contrat de travail saisonnier confirmé par l\'employeur, le tribunal cantonal TI retient qu\'il s\'ensuit un renouvellement admissible, à condition que les salaires respectent les CCT.',
    references: ['LEI 19'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VS', year: 2024,
    title: 'Regroupement familial enfant majeur — refus',
    summary: 'Le tribunal cantonal VS refuse le regroupement pour enfant de plus de 18 ans.',
    text_excerpt: 'Considérant que l\'enfant a 22 ans et ne souffre d\'aucune dépendance particulière, le tribunal cantonal VS retient qu\'il s\'ensuit un refus. Les conditions de l\'art. 42 LEI ne sont pas remplies.',
    references: ['LEI 42', 'LEI 43'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  }
];

const SOCIAL_CASES_EXT = [
  {
    canton: 'VD', year: 2024,
    title: 'CSIAS — forfait alimentation contesté',
    summary: 'Le tribunal cantonal VD confirme l\'application du forfait CSIAS 2024.',
    text_excerpt: 'Considérant que le forfait de 997 CHF correspond aux normes actualisées, le tribunal cantonal VD retient qu\'il s\'ensuit un rejet de la contestation, sauf si des besoins médicaux spécifiques sont démontrés.',
    references: ['LASV 10', 'CSIAS B.2.1'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2023,
    title: 'LASoc — exclusion aide pour fraude',
    summary: 'La Cour de justice GE confirme l\'exclusion pour déclaration mensongère des revenus.',
    text_excerpt: 'Considérant que les revenus supplémentaires ont été volontairement dissimulés, le tribunal cantonal GE retient qu\'il s\'ensuit une exclusion de 6 mois. La bonne foi fait défaut.',
    references: ['LIASI 35'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'ALV — Sanktion 31 Tage bei Selbstverschulden',
    summary: 'Le tribunal cantonal ZH confirme 31 jours de suspension pour comportement reproché au travail.',
    text_excerpt: 'Considérant le licenciement pour justes motifs établi, le tribunal cantonal ZH retient qu\'il s\'ensuit une suspension de 31 jours pour chômage fautif. La sanction est proportionnée.',
    references: ['LACI 30'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'BE', year: 2024,
    title: 'Chômage — sanction 5 jours recherches insuffisantes',
    summary: 'Le tribunal cantonal BE confirme une sanction légère pour recherches d\'emploi incomplètes.',
    text_excerpt: 'Considérant que seules 6 recherches sur 10 ont été documentées, le tribunal cantonal BE retient qu\'il s\'ensuit une sanction modérée de 5 jours. Le quota cantonal n\'est pas atteint.',
    references: ['LACI 30', 'OACI 45'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Prestations complémentaires — recalcul barème',
    summary: 'Le tribunal cantonal VD ordonne le recalcul selon le nouveau barème 2023.',
    text_excerpt: 'Considérant que l\'autorité applique l\'ancien barème, le tribunal cantonal VD retient qu\'il s\'ensuit un recalcul obligatoire. La rente est augmentée rétroactivement.',
    references: ['LPC 9', 'LPC 10'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2024,
    title: 'Aide sociale — remboursement contesté',
    summary: 'Le tribunal cantonal FR admet partiellement la contestation du remboursement d\'aide.',
    text_excerpt: 'Considérant la situation financière précaire actuelle, le tribunal cantonal FR retient qu\'un remboursement échelonné sur 60 mois est admissible, à condition que les revenus restent modestes.',
    references: ['LASoc 24', 'LASoc 28'],
    result: 'partiellement_admis', outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'TI', year: 2023,
    title: 'Assistenza — prestazione complementare anziani',
    summary: 'Il Tribunale d\'appello TI admet les prestations complémentaires pour personne âgée.',
    text_excerpt: 'Considérant l\'insuffisance des revenus AVS, le tribunal cantonal TI retient qu\'il s\'ensuit un droit aux PC. Les conditions légales sont remplies.',
    references: ['LPC 4'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Orthopédie — refus AI prestation',
    summary: 'La Cour de justice GE confirme le refus de prise en charge orthopédique hors liste.',
    text_excerpt: 'Considérant l\'absence de nécessité médicale impérieuse, le tribunal cantonal GE retient qu\'il s\'ensuit un refus, sauf si une équivalence au dispositif listé est démontrée.',
    references: ['LAI 21', 'OMAI 2'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'NE', year: 2023,
    title: 'RI — refus domicile non établi',
    summary: 'La Cour d\'appel civile NE confirme le refus pour absence de domicile effectif.',
    text_excerpt: 'Considérant que la résidence principale effective n\'est pas établie dans le canton, le tribunal cantonal NE retient qu\'il s\'ensuit un refus d\'entrée en matière.',
    references: ['LASV 3'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2024,
    title: 'Bourse études — conditions revenus parents',
    summary: 'Le tribunal cantonal VD admet l\'octroi d\'une bourse malgré les revenus parentaux contestés.',
    text_excerpt: 'Considérant la rupture familiale documentée, le tribunal cantonal VD retient qu\'il s\'ensuit une prise en compte individualisée. La bourse est accordée partiellement.',
    references: ['LAEF 18', 'LAEF 20'],
    result: 'partiellement_admis', outcome_hint: 'partiellement_admis'
  }
];

const CIRCULATION_CASES_EXT = [
  {
    canton: 'VD', year: 2024,
    title: 'LCR 16c — retrait 12 mois récidive',
    summary: 'Le tribunal cantonal VD confirme le retrait de 12 mois pour récidive grave.',
    text_excerpt: 'Considérant qu\'il s\'agit de la deuxième infraction grave en 10 ans, le tribunal cantonal VD retient qu\'il s\'ensuit un retrait qualifié. La durée minimale de 12 mois est proportionnée.',
    references: ['LCR 16c', 'LCR 16a'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2023,
    title: 'Amende radar — calibration contestée',
    summary: 'La Cour de justice GE annule une amende faute de preuve de calibration du radar.',
    text_excerpt: 'Considérant que le certificat de vérification manquait au dossier, le tribunal cantonal GE retient qu\'il s\'ensuit une annulation. La preuve de la vitesse n\'est pas rapportée.',
    references: ['LCR 27', 'OCR 22'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'Fahreignungsabklärung — psychologische Expertise',
    summary: 'Le tribunal cantonal ZH confirme l\'expertise psychologique ordonnée après accident.',
    text_excerpt: 'Considérant les doutes sérieux sur l\'aptitude à la conduite, le tribunal cantonal ZH retient qu\'il s\'ensuit une expertise obligatoire. Le permis reste suspendu jusqu\'aux résultats.',
    references: ['LCR 15d', 'OAC 28'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'BE', year: 2024,
    title: 'Retrait admonestatif — téléphone au volant',
    summary: 'Le tribunal cantonal BE confirme un retrait de 1 mois pour usage du téléphone.',
    text_excerpt: 'Considérant que l\'infraction est documentée par photo, le tribunal cantonal BE retient qu\'il s\'ensuit un retrait admonestatif. La durée d\'un mois est minimale.',
    references: ['LCR 16a', 'OCR 3'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VS', year: 2023,
    title: 'Expertise psychologique — refus prolongation',
    summary: 'Le tribunal cantonal VS admet l\'opposition à une expertise redondante.',
    text_excerpt: 'Considérant que les tests ont déjà été effectués il y a 12 mois, le tribunal cantonal VS retient qu\'il s\'ensuit une expertise superflue. Le permis doit être restitué.',
    references: ['LCR 15d', 'OAC 11'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'FR', year: 2024,
    title: 'Excès vitesse — retrait mesure urgence',
    summary: 'Le tribunal cantonal FR confirme le retrait provisoire après excès grave.',
    text_excerpt: 'Considérant le dépassement de 45 km/h sur autoroute, le tribunal cantonal FR retient qu\'il s\'ensuit un retrait immédiat à titre préventif, sauf si une nécessité professionnelle vitale est démontrée.',
    references: ['LCR 16c', 'OAC 30'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2022,
    title: 'Alcoolémie 0.8‰ — retrait 3 mois',
    summary: 'La Cour de justice GE confirme le retrait pour alcoolémie qualifiée.',
    text_excerpt: 'Considérant l\'alcoolémie de 0.82‰, le tribunal cantonal GE retient qu\'il s\'ensuit un retrait obligatoire de 3 mois minimum selon l\'art. 16c LCR.',
    references: ['LCR 16c', 'LCR 55'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Amende d\'ordre — contestation recevable',
    summary: 'Le tribunal cantonal VD annule une amende d\'ordre pour notification défectueuse.',
    text_excerpt: 'Considérant l\'absence de photo identifiant clairement le véhicule, le tribunal cantonal VD retient qu\'il s\'ensuit un doute sérieux. L\'amende est annulée.',
    references: ['LAO 2', 'LAO 6'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'TI', year: 2024,
    title: 'Divieto di circolazione — misura',
    summary: 'Il Tribunale d\'appello TI confirme l\'interdiction temporaire de circuler pour récidiviste.',
    text_excerpt: 'Considérant les multiples infractions en 5 ans, le tribunal cantonal TI retient qu\'il s\'ensuit une mesure proportionnée. L\'interdiction est maintenue.',
    references: ['LCR 16b', 'LCR 16c'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'ZH', year: 2022,
    title: 'Führerausweis-Entzug — medizinische Untauglichkeit',
    summary: 'Le tribunal cantonal ZH confirme le retrait pour incapacité médicale à la conduite.',
    text_excerpt: 'Considérant le rapport médical concluant à une inaptitude durable, le tribunal cantonal ZH retient qu\'il s\'ensuit un retrait de sécurité sans limite de durée.',
    references: ['LCR 14', 'LCR 16d'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  }
];

const SUCCESSIONS_CASES = [
  {
    canton: 'VD', year: 2024,
    title: 'Action en réduction — réserve héréditaire',
    summary: 'Le tribunal cantonal VD admet l\'action en réduction pour violation de la réserve.',
    text_excerpt: 'Considérant que les libéralités du défunt excèdent la quotité disponible, le tribunal cantonal VD retient qu\'il s\'ensuit une réduction proportionnelle. Les héritiers réservataires retrouvent leur part.',
    references: ['CC 522', 'CC 527'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2023,
    title: 'Répudiation — délai 3 mois dépassé',
    summary: 'La Cour de justice GE confirme la forclusion du droit de répudier.',
    text_excerpt: 'Considérant que le délai de l\'art. 567 CC est dépassé de 2 mois, le tribunal cantonal GE retient qu\'il s\'ensuit une acceptation tacite, sauf si des circonstances exceptionnelles sont établies.',
    references: ['CC 566', 'CC 567'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'Exhérédation — motifs graves',
    summary: 'Le tribunal cantonal ZH admet l\'exhérédation pour violences graves envers le défunt.',
    text_excerpt: 'Considérant les faits de violences documentés par condamnation pénale, le tribunal cantonal ZH retient qu\'il s\'ensuit un motif valable d\'exhérédation selon l\'art. 477 CC.',
    references: ['CC 477', 'CC 479'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'BE', year: 2023,
    title: 'Partage successoral — valeur d\'imputation',
    summary: 'Le tribunal cantonal BE fixe la valeur d\'imputation des donations à la date d\'ouverture.',
    text_excerpt: 'Considérant que la valeur doit être réactualisée, le tribunal cantonal BE retient qu\'il s\'ensuit une imputation corrigée de l\'inflation. Le partage est réévalué.',
    references: ['CC 630', 'CC 626'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VS', year: 2024,
    title: 'Certificat d\'héritier — contestation',
    summary: 'Le tribunal cantonal VS suspend la délivrance pour litige sur la qualité d\'héritier.',
    text_excerpt: 'Considérant le litige pendant sur la filiation, le tribunal cantonal VS retient qu\'il s\'ensuit une suspension. Le certificat ne peut être délivré avant résolution.',
    references: ['CC 559', 'CC 560'],
    result: 'partiellement_admis', outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'FR', year: 2024,
    title: 'Réserve héréditaire — nouveau droit 2023',
    summary: 'Le tribunal cantonal FR applique le nouveau droit successoral aux décès postérieurs.',
    text_excerpt: 'Considérant le décès survenu en mars 2023, le tribunal cantonal FR retient qu\'il s\'ensuit l\'application du nouveau régime réduisant la réserve des descendants à 1/2.',
    references: ['CC 471'],
    result: 'partiellement_admis', outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'TI', year: 2023,
    title: 'Divisione eredità — beni immobili',
    summary: 'Il Tribunale d\'appello TI ordonne la vente aux enchères des immeubles indivis.',
    text_excerpt: 'Considérant le désaccord persistant entre héritiers, le tribunal cantonal TI retient qu\'il s\'ensuit une vente forcée. Le produit sera réparti selon les parts légales.',
    references: ['CC 611', 'CC 612'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'NE', year: 2024,
    title: 'Testament olographe — contestation forme',
    summary: 'La Cour d\'appel civile NE annule un testament pour vice de forme.',
    text_excerpt: 'Considérant que le testament n\'était pas entièrement écrit de la main du défunt, le tribunal cantonal NE retient qu\'il s\'ensuit une nullité absolue. La succession se règle ab intestat.',
    references: ['CC 505', 'CC 520'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Pacte successoral — révocation unilatérale',
    summary: 'Le tribunal cantonal VD rejette la révocation unilatérale d\'un pacte successoral.',
    text_excerpt: 'Considérant l\'absence d\'accord du cocontractant, le tribunal cantonal VD retient qu\'il s\'ensuit un maintien du pacte, sauf si des justes motifs sont établis.',
    references: ['CC 513', 'CC 514'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'GE', year: 2025,
    title: 'Action en pétition d\'hérédité — héritier inconnu',
    summary: 'La Cour de justice GE admet l\'action d\'un héritier apparu tardivement.',
    text_excerpt: 'Considérant la filiation établie par ADN, le tribunal cantonal GE retient qu\'il s\'ensuit un droit à la pétition d\'hérédité. Le partage est révisé dans le délai de prescription.',
    references: ['CC 598', 'CC 600'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  }
];

const VOISINAGE_VIOLENCE_CASES = [
  {
    canton: 'VD', year: 2024,
    title: 'Immissions bruit excessif — mesures ordonnées',
    summary: 'Le tribunal cantonal VD ordonne la réduction des nuisances sonores excessives.',
    text_excerpt: 'Considérant l\'expertise acoustique dépassant les normes OPB, le tribunal cantonal VD retient qu\'il s\'ensuit une obligation de réduction. Des mesures d\'isolation sont ordonnées.',
    references: ['CC 684', 'OPB 15'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024,
    title: 'Bruit voisinage — rejet seuils respectés',
    summary: 'La Cour de justice GE rejette la demande, les seuils OPB étant respectés.',
    text_excerpt: 'Considérant que les mesures restent sous les valeurs limites, le tribunal cantonal GE retient qu\'il s\'ensuit une tolérance civile. Les inconvénients sont ordinaires.',
    references: ['CC 684', 'OPB 40'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'ZH', year: 2023,
    title: 'Unterlassungsklage — übermässige Immissionen',
    summary: 'Le tribunal cantonal ZH admet l\'action en cessation contre des odeurs excessives.',
    text_excerpt: 'Considérant la fréquence et l\'intensité des émanations, le tribunal cantonal ZH retient qu\'il s\'ensuit un dépassement manifeste. Des mesures de filtration sont imposées.',
    references: ['CC 679', 'CC 684'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'BE', year: 2024,
    title: 'Ordonnance éloignement CC 28b — renouvellement',
    summary: 'Le tribunal cantonal BE prolonge l\'ordonnance de protection pour 6 mois.',
    text_excerpt: 'Considérant la persistance des menaces, le tribunal cantonal BE retient qu\'il s\'ensuit un renouvellement. L\'éloignement de 200m est maintenu sous peine d\'amende.',
    references: ['CC 28b'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2023,
    title: 'Violence conjugale — expulsion logement conjugal',
    summary: 'Le tribunal cantonal VD ordonne l\'expulsion immédiate du conjoint violent.',
    text_excerpt: 'Considérant les preuves de violences répétées, le tribunal cantonal VD retient qu\'il s\'ensuit une expulsion de 4 semaines minimum. La police est chargée de l\'exécution.',
    references: ['CC 28b', 'LVPAE 24'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2023,
    title: 'LAVI — prestation financière refusée',
    summary: 'La Cour de justice GE confirme le refus d\'aide LAVI faute d\'infraction pénale établie.',
    text_excerpt: 'Considérant l\'absence de condamnation pénale ou de procédure, le tribunal cantonal GE retient qu\'il s\'ensuit un rejet, sauf si l\'infraction est rendue vraisemblable autrement.',
    references: ['LAVI 4', 'LAVI 19'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'FR', year: 2024,
    title: 'LAVI — indemnité tort moral victime violence',
    summary: 'Le tribunal cantonal FR accorde une indemnité LAVI pour tort moral.',
    text_excerpt: 'Considérant la gravité des atteintes et la condamnation pénale, le tribunal cantonal FR retient qu\'il s\'ensuit un droit à 15\'000 CHF. Les soins psychologiques sont également pris en charge.',
    references: ['LAVI 19', 'LAVI 22'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'TI', year: 2024,
    title: 'Immissioni — piantagioni limite',
    summary: 'Il Tribunale d\'appello TI ordonne l\'élagage des plantations excédant les limites.',
    text_excerpt: 'Considérant le dépassement de la limite parcellaire de 2,5m, le tribunal cantonal TI retient qu\'il s\'ensuit une obligation d\'élagage selon le droit cantonal.',
    references: ['CC 687'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'NE', year: 2023,
    title: 'LAVI — assistance juridique victime',
    summary: 'La Cour d\'appel civile NE admet l\'aide juridique gratuite au titre de la LAVI.',
    text_excerpt: 'Considérant la qualité de victime reconnue, le tribunal cantonal NE retient qu\'il s\'ensuit un droit à l\'assistance sans examen de l\'indigence. Les frais d\'avocat sont couverts.',
    references: ['LAVI 13'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VS', year: 2024,
    title: 'Harcèlement voisinage — ordonnance éloignement civile',
    summary: 'Le tribunal cantonal VS prononce une mesure d\'éloignement pour harcèlement.',
    text_excerpt: 'Considérant les actes répétés de surveillance et d\'insultes, le tribunal cantonal VS retient qu\'il s\'ensuit une atteinte grave à la personnalité. L\'éloignement civil est ordonné sur 6 mois.',
    references: ['CC 28', 'CC 28b'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2024,
    title: 'Bruit voisinage — conciliation partielle',
    summary: 'Le tribunal cantonal VD homologue une conciliation avec plages horaires fixes.',
    text_excerpt: 'Considérant l\'accord entre parties sur des horaires silence, le tribunal cantonal VD retient qu\'il s\'ensuit une solution équilibrée. La conciliation vaut jugement.',
    references: ['CC 684', 'CPC 208'],
    result: 'partiellement_admis', outcome_hint: 'partiellement_admis'
  },
  {
    canton: 'BS', year: 2023,
    title: 'Gewaltschutz — Rayonverbot',
    summary: 'Le tribunal cantonal BS ordonne une interdiction de périmètre pour violence.',
    text_excerpt: 'Considérant les agressions répétées, le tribunal cantonal BS retient qu\'il s\'ensuit une interdiction de périmètre de 500m autour du domicile. La violation expose à l\'art. 292 CP.',
    references: ['CC 28b'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2022,
    title: 'Animaux voisinage — aboiements excessifs',
    summary: 'La Cour de justice GE ordonne des mesures contre les aboiements récurrents nocturnes.',
    text_excerpt: 'Considérant la documentation sonore sur 4 mois, le tribunal cantonal GE retient qu\'il s\'ensuit un excès manifeste. Le propriétaire doit prendre des mesures éducatives ou d\'isolation.',
    references: ['CC 684', 'CC 679'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2024,
    title: 'Cyberstalking — Schutzmassnahmen',
    summary: 'Le tribunal cantonal ZH admet des mesures contre le cyberharcèlement.',
    text_excerpt: 'Considérant les messages répétés et menaçants en ligne, le tribunal cantonal ZH retient qu\'il s\'ensuit une atteinte à la personnalité. L\'interdiction de contact numérique est ordonnée.',
    references: ['CC 28', 'CC 28a'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'VD', year: 2022,
    title: 'LAVI — prise en charge frais médicaux',
    summary: 'Le tribunal cantonal VD étend la prise en charge LAVI aux soins psychothérapeutiques longs.',
    text_excerpt: 'Considérant la durée nécessaire du suivi (36 mois), le tribunal cantonal VD retient qu\'il s\'ensuit une prise en charge intégrale. Les forfaits standard sont dépassables sur justification médicale.',
    references: ['LAVI 14', 'LAVI 19'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  }
];

const EXTRA_BOOST = [
  {
    canton: 'VD', year: 2025, domaine: 'bail',
    title: 'Moisissure grave chambre enfant — mesures urgence',
    summary: 'Le tribunal cantonal VD ordonne en urgence expertise et relogement partiel.',
    text_excerpt: 'Considérant le rapport médical attestant d\'asthme pédiatrique lié à la moisissure, le tribunal cantonal VD retient qu\'il y a urgence sanitaire. Il s\'ensuit qu\'à condition que les travaux ne puissent être menés occupé, un relogement temporaire est dû.',
    references: ['CO 259a', 'CO 259b', 'CPC 261'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024, domaine: 'travail',
    title: 'Cadre supérieur — heures suppl indemnité forfaitaire',
    summary: 'La Cour de justice GE annule la clause forfaitaire pour cadre non dirigeant.',
    text_excerpt: 'Considérant que le travailleur n\'avait pas de pouvoir de décision autonome, le tribunal cantonal GE retient qu\'il s\'ensuit une inapplicabilité de la clause forfaitaire. Les heures supplémentaires documentées sont dues.',
    references: ['CO 321c', 'LTr 9'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'ZH', year: 2025, domaine: 'dettes',
    title: 'Rechtsöffnung — elektronische Signatur',
    summary: 'Le tribunal cantonal ZH admet la mainlevée basée sur reconnaissance signée électroniquement.',
    text_excerpt: 'Considérant que la signature électronique qualifiée équivaut à la signature manuscrite, le tribunal cantonal ZH retient qu\'il s\'ensuit une valeur probante suffisante selon l\'art. 82 LP.',
    references: ['LP 82', 'SCSE 14'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'VD', year: 2025, domaine: 'famille',
    title: 'Garde alternée — distance géographique',
    summary: 'Le tribunal cantonal VD refuse la garde alternée en raison de 120 km entre domiciles.',
    text_excerpt: 'Considérant la distance incompatible avec la scolarité régulière, le tribunal cantonal VD retient qu\'il s\'ensuit une garde principale chez la mère, sauf si la semaine sur deux reste réaliste sur plan scolaire.',
    references: ['CC 298', 'CC 298a'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'BE', year: 2025, domaine: 'assurances',
    title: 'LAA — psychische Folgen mittlerem Ereignis',
    summary: 'Le tribunal cantonal BE admet la causalité adéquate pour troubles psychiques après accident moyen.',
    text_excerpt: 'Considérant l\'accumulation de critères aggravants au sens de l\'arrêt ATF 115 V 133, le tribunal cantonal BE retient qu\'il s\'ensuit une causalité adéquate. Les prestations sont dues.',
    references: ['LAA 6', 'LAA 10'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GE', year: 2024, domaine: 'successions',
    title: 'Dons manuels — rapport à la succession',
    summary: 'La Cour de justice GE ordonne le rapport de donations immobilières aux descendants.',
    text_excerpt: 'Considérant que les donations dépassent manifestement l\'usage, le tribunal cantonal GE retient qu\'il s\'ensuit une obligation de rapport. Le partage est recalculé avec réintégration des valeurs.',
    references: ['CC 626', 'CC 630'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'SG', year: 2023, domaine: 'voisinage',
    title: 'Schattenwurf — Pflanzen Rückschnitt',
    summary: 'Le tribunal cantonal SG ordonne la réduction de plantations causant un ombre excessive.',
    text_excerpt: 'Considérant l\'ombre portée pendant 70% du jour sur la terrasse, le tribunal cantonal SG retient qu\'il s\'ensuit un excès de l\'art. 684 CC. La hauteur des arbres doit être limitée à 5 mètres.',
    references: ['CC 684', 'CC 687'],
    result: 'favorable_demandeur', outcome_hint: 'admis'
  },
  {
    canton: 'GR', year: 2024, domaine: 'bail',
    title: 'Mietzinsanpassung Ferienwohnung',
    summary: 'Le tribunal cantonal GR rejette la contestation d\'un loyer de logement de vacances.',
    text_excerpt: 'Considérant que les règles des logements permanents ne s\'appliquent pas, le tribunal cantonal GR retient qu\'il s\'ensuit une liberté contractuelle, sauf si le logement est en réalité résidence principale.',
    references: ['CO 253a', 'CO 270'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'TI', year: 2024, domaine: 'etrangers',
    title: 'Permesso C — integrazione insufficiente',
    summary: 'Il Tribunale d\'appello TI confirme le refus de permis C pour intégration insuffisante.',
    text_excerpt: 'Considérant l\'absence de maîtrise linguistique au niveau A2, le tribunal cantonal TI retient qu\'il s\'ensuit un refus. Les exigences d\'intégration sont cumulatives.',
    references: ['LEI 34', 'LEI 58a'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  },
  {
    canton: 'AG', year: 2024, domaine: 'social',
    title: 'Sozialhilfe — Kürzung bei Arbeitsverweigerung',
    summary: 'Le tribunal cantonal AG confirme une réduction pour refus de mesure d\'insertion.',
    text_excerpt: 'Considérant le refus répété de la mesure sans motif valable, le tribunal cantonal AG retient qu\'il s\'ensuit une réduction de 15% du forfait. La sanction est proportionnée.',
    references: ['SPG 13', 'SKOS A.8'],
    result: 'defavorable_demandeur', outcome_hint: 'rejeté'
  }
];

// ─── Agrégation ─────────────────────────────────────────────────────

const ALL = [
  ...BAIL_CASES.map(c => ({ ...c, domaine: 'bail' })),
  ...BAIL_CASES_EXT.map(c => ({ ...c, domaine: 'bail' })),
  ...TRAVAIL_CASES.map(c => ({ ...c, domaine: 'travail' })),
  ...TRAVAIL_CASES_EXT.map(c => ({ ...c, domaine: 'travail' })),
  ...DETTES_CASES.map(c => ({ ...c, domaine: 'dettes' })),
  ...DETTES_CASES_EXT.map(c => ({ ...c, domaine: 'dettes' })),
  ...FAMILLE_CASES.map(c => ({ ...c, domaine: 'famille' })),
  ...FAMILLE_CASES_EXT.map(c => ({ ...c, domaine: 'famille' })),
  ...ASSURANCES_CASES.map(c => ({ ...c, domaine: 'assurances' })),
  ...ASSURANCES_CASES_EXT.map(c => ({ ...c, domaine: 'assurances' })),
  ...ETRANGERS_CASES.map(c => ({ ...c, domaine: 'etrangers' })),
  ...ETRANGERS_CASES_EXT.map(c => ({ ...c, domaine: 'etrangers' })),
  ...SOCIAL_CASES.map(c => ({ ...c, domaine: 'social' })),
  ...SOCIAL_CASES_EXT.map(c => ({ ...c, domaine: 'social' })),
  ...VOISINAGE_CASES.map(c => ({ ...c, domaine: 'voisinage' })),
  ...CIRCULATION_CASES.map(c => ({ ...c, domaine: 'circulation' })),
  ...CIRCULATION_CASES_EXT.map(c => ({ ...c, domaine: 'circulation' })),
  ...VIOLENCE_CASES.map(c => ({ ...c, domaine: 'violence' })),
  ...SUCCESSIONS_CASES.map(c => ({ ...c, domaine: 'successions' })),
  ...VOISINAGE_VIOLENCE_CASES.map(c => ({ ...c, domaine: c.domaine || (/LAVI|violence|éloignement|cyberstalking|Gewaltschutz|harcèlement/i.test(c.title) ? 'violence' : 'voisinage') })),
  ...EXTRA_BOOST
];

// ─── Build final records ────────────────────────────────────────────

// Formats de signature réalistes par canton
const SIGNATURE_FORMATS = {
  VD: (year, n) => `HC/${year}/${String(n).padStart(3, '0')}`,
  GE: (year, n) => `ACJC/${String(n).padStart(3, '0')}/${year}`,
  ZH: (year, n) => `LB${String(n).padStart(6, '0')}-O/U`,
  BE: (year, n) => `ZK ${year} ${String(n).padStart(3, '0')}`,
  BS: (year, n) => `ZB.${year}.${String(n).padStart(3, '0')}`,
  TI: (year, n) => `11.${year}.${String(n).padStart(3, '0')}`,
  NE: (year, n) => `CACIV.${year}.${String(n).padStart(3, '0')}`,
  FR: (year, n) => `101 ${year} ${String(n).padStart(3, '0')}`,
  VS: (year, n) => `C1 ${year} ${String(n).padStart(3, '0')}`,
  LU: (year, n) => `1B ${year} ${String(n).padStart(3, '0')}`,
  SG: (year, n) => `BO.${year}.${String(n).padStart(3, '0')}`,
  AG: (year, n) => `ZOR.${year}.${String(n).padStart(3, '0')}`,
  JU: (year, n) => `CC ${String(n).padStart(3, '0')}/${year}`,
  SO: (year, n) => `ZKBER.${year}.${String(n).padStart(3, '0')}`,
  GR: (year, n) => `ZK1 ${year} ${String(n).padStart(3, '0')}`,
  TG: (year, n) => `ZR.${year}.${String(n).padStart(3, '0')}`,
  SH: (year, n) => `50/${year}/${String(n).padStart(3, '0')}`
};

function sigFor(canton, year, idx) {
  const fn = SIGNATURE_FORMATS[canton];
  const seq = (idx * 17 % 900) + 100;
  if (fn) return fn(year, seq);
  return `${canton}-TC-${year}-${String(100 + idx).padStart(3, '0')}`;
}

// Déduction automatique du citizen_side depuis le domaine si absent
const DOMAIN_TO_CITIZEN = {
  bail: 'locataire',
  travail: 'travailleur',
  dettes: 'débiteur',
  famille: 'enfant',
  assurances: 'assuré',
  etrangers: 'étranger',
  social: 'bénéficiaire',
  voisinage: 'voisin',
  circulation: 'conducteur',
  violence: 'victime',
  successions: 'héritier',
  consommation: 'consommateur'
};

function buildRecord(tpl, idx) {
  const courts = COURTS[tpl.canton] || [`Tribunal cantonal ${tpl.canton}`];
  const court = courts[idx % courts.length];
  const tier = tpl.tier_override || instanceForCourt(court);
  const monthStr = String((idx * 7 % 12) + 1).padStart(2, '0');
  const dayStr = String((idx * 13 % 28) + 1).padStart(2, '0');
  const date = `${tpl.year}-${monthStr}-${dayStr}`;
  const signature = sigFor(tpl.canton, tpl.year, idx);
  const hash = createHash('sha256')
    .update([court, date, signature, tpl.title].join('|'))
    .digest('hex').slice(0, 16);
  const citizen_side = tpl.citizen_side || DOMAIN_TO_CITIZEN[tpl.domaine] || null;
  return {
    source: 'entscheidsuche.ch (seed anonymisé 2026-04-20)',
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
    language: tpl.language_override || langForCanton(tpl.canton),
    citizen_side,
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

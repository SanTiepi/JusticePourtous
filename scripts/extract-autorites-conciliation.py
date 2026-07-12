#!/usr/bin/env python3
"""
⚠ LE PREMIER FICHIER DE LA NOUVELLE MÉTHODE (2026-07-12)

POURQUOI CE FICHIER EXISTE

Pendant trois ans, ce projet a fait ÉCRIRE ses adresses d'autorités par un LLM.
Résultat, mesuré : 17 cantons sur 26 sans aucune adresse postale (« Variable selon
le district »), et sur les 9 restantes, 2 vérifiées à la main, 2 fausses (Bâle :
« Bäumleingasse 5, 4001 » — la vraie est au 1, 4051 ; Saint-Gall : une adresse qui
appartient à une autre institution).

Or l'Office fédéral du logement PUBLIE la liste officielle — les ~140 autorités de
conciliation en matière de baux à loyer, les 26 cantons, avec adresse, NPA,
téléphone et e-mail. PDF gratuit, mis à jour le 8 juillet 2026.
Elle était là depuis le début. Personne ne l'a lue.

    Faire écrire une adresse par un LLM prend 3 secondes.
    Aller la chercher à la source prend une journée.
    Le chemin facile produisait du faux qui ressemblait au vrai.

CE SCRIPT NE GÉNÈRE RIEN. IL LIT.

Il extrait les champs par POSITION dans le tableau (colonnes à x fixe), pas par
heuristique de texte : une heuristique devine, une position lit. Tout champ qui ne
s'extrait pas avec certitude vaut None — JAMAIS une valeur plausible.

SOURCE (unique, officielle, citée dans chaque enregistrement produit) :
  https://www.bwo.admin.ch/fr/procedure-de-conciliation
  → PDF « Adresses des autorités de conciliation en matière de baux à loyer »

USAGE :
  python scripts/extract-autorites-conciliation.py <chemin_du_pdf> [--out fichier.json]
"""

import json
import re
import sys
from datetime import date
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    sys.exit("pdfplumber requis :  pip install pdfplumber")

SOURCE_PAGE = "https://www.bwo.admin.ch/fr/procedure-de-conciliation"
SOURCE_TITRE = "Adresses des autorités de conciliation en matière de baux à loyer (Office fédéral du logement)"

# Bornes des colonnes, relevées sur la ligne d'en-tête du PDF :
#   Canton x=41 | Désignation x=134 | Adresse x=293 | NPA/Localité x=389
#   Téléphone x=474 | Fax | E-Mail x=575
COLONNES = [
    ("canton", 0, 130),
    ("designation", 130, 290),
    ("adresse", 290, 386),
    ("npa_localite", 386, 470),
    ("telephone", 470, 545),
    ("fax", 545, 570),
    ("email", 570, 9999),
]

# Lignes de chapeau (titres, base légale trilingue, en-têtes) et liens hypertexte.
# ⚠ « Website » / « site Web » / « pagina d'internet » sont des LIENS placés dans la
# colonne du canton : sans ce filtre, ils étaient lus comme des cantons (26 entrées
# fantômes au premier essai). Une donnée qui a l'air d'un canton n'est pas un canton.
BRUIT = re.compile(
    r"^(Adressen|Adresses|Indirizzi|Gemäss|Selon|Secondo|Kanton|Canton|Cantone"
    r"|Website|Site\s?Web|site\s?Web|Sito|pagina|Seite|Page)\b",
    re.I,
)

# LISTE BLANCHE des 26 cantons, dans les graphies exactes du PDF (trilingue).
# Un canton n'est reconnu QUE s'il figure ici. Tout le reste ne change pas le canton
# courant. C'est la différence entre lire et supposer : sans liste blanche, le parseur
# « devinait » qu'une ligne était un canton parce qu'elle était dans la bonne colonne.
CANTONS = {
    "Aargau": "AG", "Appenzell Ausserrhoden": "AR", "Appenzell Innerrhoden": "AI",
    "Basel-Landschaft": "BL", "Basel-Stadt": "BS", "Bern / Berne": "BE",
    "Freiburg / Fribourg": "FR", "Genève": "GE", "Glarus": "GL", "Graubünden": "GR",
    "Jura": "JU", "Luzern": "LU", "Neuchâtel": "NE", "Nidwalden": "NW",
    "Obwalden": "OW", "Schaffhausen": "SH", "Schwyz": "SZ", "Solothurn": "SO",
    "St. Gallen": "SG", "Thurgau": "TG", "Ticino": "TI", "Uri": "UR",
    "Vaud": "VD", "Wallis / Valais": "VS", "Zug": "ZG", "Zürich": "ZH",
}

RE_NPA = re.compile(r"\b(\d{4})\b")
RE_EMAIL = re.compile(r"[\w.\-+]+@[\w.\-]+\.\w+")


TOLERANCE_LIGNE = 3.0  # points PDF : deux mots plus proches que ça sont sur la même ligne


def lignes_du_pdf(pdf_path):
    """Regroupe les mots en lignes (par proximité verticale), puis en colonnes (par x).

    ⚠ La première version regroupait par `round(top / 3)`. Un arrondi coupe une même
    ligne en deux dès qu'elle enjambe la frontière (top=300.4 → 100, top=302.9 → 101).
    Le canton se retrouvait alors seul sur une pseudo-ligne, séparé de son adresse : une
    autorité de ZOUG (Baarerstrasse 131, 6300 Zug) a ainsi été rattachée au VALAIS.

    Et les tests étaient VERTS — parce qu'aucun ne vérifiait que le code postal
    appartient bien au canton. C'est très exactement le mécanisme qui a produit trois ans
    de fausses données : un contrôle qui ne peut pas voir l'erreur qu'il devrait attraper.
    On regroupe donc par proximité réelle, et un test vérifie désormais la cohérence
    canton ↔ code postal.
    """
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            mots = sorted(page.extract_words(keep_blank_chars=False), key=lambda m: (m["top"], m["x0"]))

            groupes = []
            for m in mots:
                if groupes and abs(m["top"] - groupes[-1][0]["top"]) <= TOLERANCE_LIGNE:
                    groupes[-1].append(m)
                else:
                    groupes.append([m])

            for groupe in groupes:
                cellules = {nom: [] for nom, _, _ in COLONNES}
                for m in sorted(groupe, key=lambda m: m["x0"]):
                    for nom, xmin, xmax in COLONNES:
                        if xmin <= m["x0"] < xmax:
                            cellules[nom].append(m["text"])
                            break
                yield {nom: " ".join(v).strip() for nom, v in cellules.items()}


def extraire(pdf_path):
    """Lit le tableau. Une autorité s'étale sur PLUSIEURS lignes ; c'est la ligne
    portant le CODE POSTAL qui la termine.

    ⚠ Le premier parseur rattachait les lignes de continuation à l'entrée PRÉCÉDENTE
    (déjà close) au lieu de celle en construction. Résultat : « Préfecture de Lausanne,
    Grand-Rue 31, 1347 Le Sentier » — Le Sentier est à la Vallée de Joux, à 50 km de
    Lausanne. Plausible, bien formaté, faux. Exactement l'erreur qu'on combat.

    On accumule donc dans un tampon, et on n'émet QU'À la ligne du code postal.
    """
    autorites = []
    canton_courant = None
    tampon = {"designation": [], "adresse": []}

    def vider():
        tampon["designation"].clear()
        tampon["adresse"].clear()

    for ligne in lignes_du_pdf(pdf_path):
        texte_entier = " ".join(ligne.values()).strip()
        if not texte_entier:
            continue

        # Chapeau du document (titres, base légale trilingue, en-têtes) → ligne ignorée.
        if BRUIT.match(texte_entier) and not RE_NPA.search(ligne["npa_localite"] or ""):
            continue

        # Le canton ne change QUE sur une valeur de la liste blanche.
        # (« site Web » tombe dans la colonne canton : ce n'est pas un canton.)
        # ⚠ Ne PAS vider le tampon ici. Dans le PDF, le nom de l'autorité précède parfois
        # le nom du canton (cas du Valais : « Schlichtungskommission für Mietverhältnisse »
        # est sur la ligne AU-DESSUS de « Wallis / Valais »). Vider sur changement de
        # canton jetait ce nom — l'entrée sortait sans autorité. Le tampon est vidé après
        # chaque émission, et toute entrée se termine par un code postal : pas de fuite.
        candidat = (ligne["canton"] or "").strip()
        nouveau_canton = candidat in CANTONS
        if nouveau_canton:
            canton_courant = candidat

        npa_loc = ligne["npa_localite"] or ""
        m_npa = RE_NPA.search(npa_loc)

        # Une ligne qui apporte à la fois un canton, un code postal ET SON PROPRE NOM est
        # une entrée COMPLÈTE : elle n'hérite de rien. (Sans ça, l'autorité de Zoug héritait
        # du fragment « bail à loyer » resté du Valais.)
        # Mais si elle n'a PAS de nom à elle, le nom est sur la ligne d'AU-DESSUS — c'est le
        # cas du Valais, où « Schlichtungskommission für Mietverhältnisse » précède le canton.
        # Vider aveuglément effaçait ce nom. Les deux cas coexistent dans le même document :
        # une seule règle ne peut pas les couvrir, il faut regarder ce que la ligne apporte.
        if nouveau_canton and m_npa and ligne["designation"]:
            vider()

        if not m_npa:
            # Ligne de continuation : on met de côté, on n'émet rien.
            if ligne["designation"]:
                tampon["designation"].append(ligne["designation"])
            if ligne["adresse"]:
                tampon["adresse"].append(ligne["adresse"])
            continue

        # Ligne terminale : le code postal clôt l'entrée.
        designation = " ".join(tampon["designation"] + ([ligne["designation"]] if ligne["designation"] else [])).strip()
        adresse = " ".join(tampon["adresse"] + ([ligne["adresse"]] if ligne["adresse"] else [])).strip()
        email = RE_EMAIL.search(ligne["email"] or "")

        autorites.append({
            "canton": canton_courant,
            "designation": designation or None,
            "adresse": adresse or None,
            "npa": m_npa.group(1),
            "localite": npa_loc.replace(m_npa.group(1), "").strip() or None,
            "telephone": ligne["telephone"] or None,
            "email": email.group(0) if email else None,
        })
        vider()

    return autorites


def en_routes(autorites, pdf_nom):
    """Transforme en « routes d'action » : ce qu'un citoyen doit savoir pour AGIR.

    Chaque champ porte sa source et sa date. Aucun champ n'est déduit, complété ou
    embelli. Ce qui manque vaut null — et le dire est une information utile.
    """
    aujourdhui = date.today().isoformat()
    routes = []
    for a in autorites:
        # Un trou doit être DIT — et sous le nom qu'il porte DANS la route publiée, sinon
        # aucun test ne peut le vérifier. (Le premier jet déclarait « designation » alors
        # que la route expose « autorite » : un trou invisible est un trou qui reste.)
        CHAMPS = {"autorite": "designation", "adresse": "adresse", "npa": "npa",
                  "localite": "localite", "telephone": "telephone", "email": "email"}
        manquants = [nom_public for nom_public, nom_source in CHAMPS.items() if not a.get(nom_source)]
        routes.append(
            {
                "probleme": "litige_bail",
                "acte": "saisir l'autorité de conciliation en matière de baux à loyer",
                "canton": a["canton"],
                "canton_code": CANTONS.get(a["canton"] or ""),
                "autorite": a["designation"],
                "adresse": a["adresse"],
                "npa": a["npa"],
                "localite": a["localite"],
                "telephone": a["telephone"],
                "email": a["email"],
                "cout": "gratuit (art. 113 al. 2 let. c CPC)",
                "source": SOURCE_PAGE,
                "source_document": pdf_nom,
                "source_titre": SOURCE_TITRE,
                "verifie_le": aujourdhui,
                "statut": "lu_source_officielle" if not manquants else "lu_source_officielle_incomplet",
                "champs_manquants": manquants or None,
            }
        )
    return routes


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    pdf_path = Path(sys.argv[1])
    sortie = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None

    autorites = extraire(pdf_path)
    routes = en_routes(autorites, pdf_path.name)

    cantons = sorted({r["canton"] for r in routes if r["canton"]})
    complets = [r for r in routes if not r["champs_manquants"]]

    print(f"  autorités lues        : {len(routes)}")
    print(f"  cantons couverts      : {len(cantons)}")
    print(f"  entrées complètes     : {len(complets)}")
    print(f"  entrées incomplètes   : {len(routes) - len(complets)}  (champs manquants explicites, jamais devinés)")
    print(f"  source                : {SOURCE_PAGE}")

    if sortie:
        sortie.parent.mkdir(parents=True, exist_ok=True)
        sortie.write_text(json.dumps(routes, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  écrit                 : {sortie}")
    else:
        print(json.dumps(routes[:3], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

# Maths Lycée — Première spécialité, 2026–2027

Cette édition contient 13 chapitres de première : cours Beamer, exercices, corrigés et QCM. Les anciens brouillons de terminale ne sont pas publiés dans le catalogue.

## Consulter le site

Ouvrir `index.html` dans un navigateur. L’affichage mathématique est inclus dans `vendor/` et fonctionne sans CDN. Les résultats des QCM restent dans le navigateur de l’élève.

## Modifier un document LaTeX

Dans `resources/p01/` (ou le chapitre souhaité) :

- `cours.tex` : diaporama Beamer 16:9.
- `exercices.tex` : feuille A4.
- `correction.tex` : corrigé avec rappels des énoncés.
- `theme-slides.tex` et `theme-fiches.tex` : couleurs, polices et mise en page.
- `sources-latex.zip` : les cinq fichiers à importer dans Overleaf.

Choisir **pdfLaTeX**, puis compiler deux fois pour actualiser la pagination. Le fichier principal à sélectionner est `cours.tex`, `exercices.tex` ou `correction.tex` selon le PDF voulu. Les thèmes doivent rester dans le même dossier.

Chaque diapositive est un bloc `\begin{frame} ... \end{frame}`. Les calculs sont de vrais objets LaTeX, les dessins sont modifiables avec TikZ et les scripts Python utilisent `codepython`.

## Modifier les questions ou régénérer

Les contenus structurés sont dans `content/p01.json` à `p13.json`. Chaque réponse de QCM porte un index `answer` de 0 à 3. Une seule réponse doit être correcte.

Le script `python3 scripts/build.py` met à jour le catalogue et les ZIP sans écraser les fichiers `.tex` existants. `python3 scripts/build.py --compile` compile aussi les PDF et conserve les changements manuels des `.tex`. Il nécessite une distribution TeX complète (TeX Live ou MacTeX).

**Attention :** `--refresh-tex` remplace les `.tex` à partir des JSON. N’utiliser cette option que si les JSON constituent la source de référence et que les changements manuels ont été reportés ou sauvegardés.

Pour mettre à jour les thèmes de tous les chapitres, modifier les modèles dans `latex/`. Le script les recopie dans chaque dossier lors de la génération. Pour personnaliser un chapitre isolé, compiler directement ses `.tex`, sans relancer le générateur.

## Fichiers du site

`index.html` contient la page principale, `style.css` la présentation et `app.js` la navigation, les filtres et les QCM. `catalogue.js` est généré à partir du contenu. Les liens fonctionnent à la racine ou dans un sous-dossier GitHub Pages.

## Publication GitHub Pages

Le site est préparé localement. Aucune publication n’est présumée effectuée.

Créer un dépôt, y placer le contenu de ce dossier (hors `.build/` et `backups/`), puis dans Settings → Pages choisir **Deploy from a branch**, branche `main`, dossier `/ (root)`. Les PDF étant déjà compilés, aucune installation de LaTeX n’est nécessaire pour héberger le site.

## Programme et sources

Le découpage pédagogique correspond au programme de première spécialité publié au BO du 2 avril 2026, applicable en 2026–2027. Voir `COUVERTURE.md`. Les situations et exercices sont rédigés pour ces supports. Les données contextualisées sont des exemples pédagogiques fictifs.

KaTeX est distribué avec sa licence MIT dans `vendor/KATEX-LICENSE`.

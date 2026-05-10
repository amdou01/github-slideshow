# Mini-moelleux 🧁

Une petite app web monofichier qui héberge des fiches recettes interactives, avec checklists cochables, minuteurs de cuisson et état persistant. Zéro dépendance, zéro build : juste un `.html` à ouvrir.

## Recettes incluses

- 🧁 **Mini-moelleux au sirop de canne** — version revisitée pour airfryer, 6 personnes, 2 fournées, avec protocole de rattrapage si la pâte est trop liquide.
- 🥞 **Crêpes sucrées classiques** — pâte traditionnelle avec repos d'1 h, 12 crêpes pour 4 personnes.
- 🍮 **Flan pâtissier à la vanille** — appareil onctueux sur pâte brisée, moule 22 cm, 8 parts.
- 🍰 **Tiramisu classique italien** — mascarpone, œufs séparés, biscuits cuillère imbibés au café. 6 personnes, repos 4 h.
- 🍪 **Cookies aux pépites de chocolat** — croquant aux bords, moelleux au centre. 12 cookies, four 12 min.
- 🥧 **Quiche lorraine à l'ancienne** — pâte brisée maison, lardons fumés, appareil œufs-crème. 8 parts, moule 26 cm.

## Lancer en local

L'app tient dans un seul fichier sans étape de build :

```bash
# Option 1 : ouvrir directement dans le navigateur
xdg-open mini-moelleux.html      # Linux
open mini-moelleux.html          # macOS

# Option 2 : servir en local pour tester l'install PWA / le Wake Lock
python3 -m http.server 8000
# puis http://localhost:8000/mini-moelleux.html
```

Le routing se fait par hash : `#/` affiche l'accueil avec la liste des recettes, `#/r/<id>` ouvre une fiche (par exemple `#/r/moelleux`).

## Ajouter une recette

L'app est entièrement data-driven. Pour ajouter une recette :

1. Ouvrir `mini-moelleux.html`.
2. Localiser la table `const RECIPES = { … }` (vers le début du `<script>`).
3. Y ajouter une nouvelle entrée en suivant le shape ci-dessous. La clé de l'objet (ex. `tarte`) devient l'identifiant utilisé dans l'URL (`#/r/tarte`).
4. Sauvegarder et recharger : la recette apparaît automatiquement sur l'accueil, son état (cases cochées, minuteurs) est persisté sous la clé `recipe-state-v1-<id>` dans `localStorage`.

## Structure d'une recette

```js
const RECIPES = {
  // L'identifiant (clé) sert d'URL : #/r/moelleux
  moelleux: {
    // ── Identité (obligatoire) ──────────────────────────────
    emoji:   '🧁',
    accent:  '#C75B3F',           // couleur d'accent CSS de la fiche
    name:    'Mini-moelleux',
    nameEm:  'au sirop de canne', // sous-titre en italique
    ref:     'CHK-001-v3 · Mai 2026',
    summary: "Version revisitée : sirop de canne pur + lait frais local…",

    // ── Encadré méta en haut de la fiche (obligatoire) ──────
    meta: [
      { label: 'Portions',    value: '6 personnes' },
      { label: 'Préparation', value: '10 min' },
      { label: 'Cuisson',     value: '2 × 15 min' }
    ],

    // ── Frise des phases de la recette (obligatoire) ────────
    phases: [
      { time: '5 MIN',  name: 'Mise en place', steps: '01 · 02',
        accent: 'terra',  target: 's01' },
      { time: '30 MIN', name: 'Cuisson',       steps: '07',
        accent: 'indigo', target: 's07' }
      // accent ∈ { terra, ochre, indigo, moss, … }
      // target = ancre de la section visée au clic
    ],

    // ── Sections numérotées : le cœur de la checklist ───────
    sections: [
      {
        num: '01',
        title: 'Mise en place — ingrédients',
        time: '5 min',
        // callout optionnel en haut de section
        callout: { variant: 'tip', label: 'Logique chef pro',
                   text: 'Pendant que le beurre fond…' },
        items: [
          { qty: '250 ml', text: 'Sirop de canne pur',
            note: 'Apporte le sucre et le parfum', tag: 'Base liquide' },
          { text: 'Pépites de chocolat', opt: 'Option', tag: 'Garniture' }
          // qty, note, tag, opt sont tous optionnels
          // text accepte du HTML (<b>, <i>…)
        ]
      },
      {
        num: '07', title: 'Cuisson', time: '2 × 15 min',
        // bloc température/temps optionnel
        tempBlock: [
          { lab: 'Température', val: '160',   unit: '°C' },
          { lab: 'Fournée 1',   val: '15-18', unit: 'min' }
        ],
        // minuteurs interactifs (son + vibration + Wake Lock)
        timers: [
          { seconds: 900, label: 'Fournée 1' },
          { seconds: 720, label: 'Contrôle 12 min' }
        ],
        items: [ /* … */ ]
      },
      {
        // section spéciale "SOS" avec sous-groupes
        num: '⚠', anchor: 'sos', variant: 'sos',
        title: 'Diagnostic & rattrapage', time: 'SOS',
        intro: 'La consistance idéale ressemble à…',
        groups: [
          { heading: 'Solution 1 — Ajout de farine',
            badge: { text: 'RECOMMANDÉ' },
            items: [ /* … */ ] }
        ],
        callouts: [
          { variant: 'dark', label: 'Cause probable', text: '…' }
        ]
      }
    ],

    // ── Encadrés finaux (optionnels) ────────────────────────
    warnings: [
      { bold: 'Ne jamais dépasser 180°C :',
        text: 'le sirop de canne caramélise très vite.' }
    ],
    quality: [
      { label: 'Aspect',  text: 'Dôme régulier, surface dorée' },
      { label: 'Texture', text: 'Mie aérée, moelleuse' }
    ]
  }
};
```

Champs obligatoires : `emoji`, `accent`, `name`, `summary`, `meta`, `phases`, `sections`. Tout le reste (`callout`, `tempBlock`, `timers`, `groups`, `warnings`, `quality`, `opt`, `qty`, `note`, `tag`…) est optionnel et ne s'affiche que si présent.

## Stack

- **Vanilla JS** — pas de framework, pas de bundler, pas de `node_modules`.
- **CSS custom properties** — thème et accents par recette via variables CSS.
- **Google Fonts** — Fraunces (titres), Inter Tight (corps), JetBrains Mono (chiffres et timers).
- **Web Storage API** — état persisté par recette sous `recipe-state-v1-<id>`.
- **Wake Lock API** — empêche l'écran de s'éteindre quand un minuteur tourne.
- **Web Audio API** — bip de fin de minuteur synthétisé sans fichier audio.
- **Vibration API** — retour haptique sur mobile en fin de cuisson.
- **PWA** — manifeste inline en data-URI, installable depuis le navigateur.

## État du projet

Développement en cours sur la branche `claude/optimize-recipe-app-YLuRB`, suivi dans la PR [#3](../../pull/3). Le contenu Jekyll/GitHub Learning Lab historique du repo (dossiers `_posts`, `_layouts`, `Gemfile`…) est conservé pour l'instant mais n'est pas utilisé par l'app.

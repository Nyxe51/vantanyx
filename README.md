# Vantanyx – Stay Focus

Appli web installable (PWA) pour rester focus sur ses objectifs. Publiée sur GitHub Pages : `https://<ton-pseudo>.github.io/vantanyx/`

## Tester sur ton PC (nécessite Node 22 LTS)

```
npm install
npm run dev
```

Puis ouvre l'adresse affichée dans le terminal. Elle se termine par `/vantanyx/` (c'est normal).

## Publier

Dépose les fichiers sur GitHub (branche `main`) : le site se reconstruit et se met en ligne tout seul (onglet **Actions** pour suivre).
Réglage à faire une seule fois : **Settings → Pages → Source : GitHub Actions**.

## Structure

- `index.html` : coquille de la page (icônes iPhone, manifest)
- `vite.config.js` : config + PWA (adresse `/vantanyx/`, icônes, hors-ligne)
- `public/` : icônes et favicon (copiés tels quels)
- `src/main.js` : point de départ : branche l'état, l'affichage, les clics
- `src/store.js` : seul fichier qui sait où sont rangées les données (stockage local pour l'instant, Firestore plus tard)
- `src/router.js` : navigation (`#/accueil`, `#/sport`…)
- `src/logic/` : calculs purs, sans écran (XP, rangs, % du jour, stats, thème, appui long, photos)
- `src/screens/` : un fichier par écran (`home.js`, `soon.js` pour ce qui n'est pas encore fait)
- `src/ui/` : coquille (barre du bas, menu), icônes
- `src/styles/` : `base.css`, `glass.css`, `components.css`, `shell.css`, `home.css`
- `src/data/` : contenus en JSON (`ranks.json`, `quotes.json`, `default-rules.json`)
- `src/assets/` : logo (webp + svg)
- `.github/workflows/deploy.yml` : publication automatique sur GitHub Pages

## Notes

- Ne lance pas `npm audit fix --force` : les alertes `npm audit` concernent des outils de construction, pas l'appli publiée, et la commande casserait la config PWA.
- Polices Unbounded et Manrope auto-hébergées (paquets `@fontsource`) : aucune requête vers Google, et elles marchent hors ligne.

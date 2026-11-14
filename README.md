# Vantanyx – Stay Focus

Appli web installable (PWA) pour rester focus sur ses objectifs. Publiée sur GitHub Pages : `https://nyxe51.github.io/vantanyx/`

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
- `src/main.js` : point de départ (page provisoire pour l'instant)
- `src/styles/` : `base.css` (variables, polices), `glass.css` (effet verre)
- `src/data/` : contenus en JSON (`ranks.json`, `quotes.json`)
- `src/assets/` : logo (webp + svg)
- `.github/workflows/deploy.yml` : publication automatique sur GitHub Pages

Les dossiers `screens/` et `logic/` seront ajoutés avec les premiers écrans.

## Notes

- Ne lance pas `npm audit fix --force` : les alertes `npm audit` concernent des outils de construction, pas l'appli publiée, et la commande casserait la config PWA.
- Polices Unbounded et Manrope auto-hébergées (paquets `@fontsource`) : aucune requête vers Google, et elles marchent hors ligne.

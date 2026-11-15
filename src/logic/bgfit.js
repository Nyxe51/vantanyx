// Cadrage du fond d'accueil : { x, y, z }
//  - x, y (0 à 1) : quel point de l'image reste fixe (comme background-position en %) ; 0,5 / 0,5 = centré
//  - z (≥ 1)      : zoom par rapport à la taille « remplit toute la zone » (1 = pas de zoom)
// L'image recouvre toujours la zone entière : on ne voit jamais de vide.
export const DEFAULT_FIT = { x: 0.5, y: 0.5, z: 1 };
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Taille affichée de l'image (en px) dans une zone W × H, pour une image de proportion a = largeur / hauteur.
export function shownSize(W, H, a, z) {
  return { dw: Math.max(W, H * a) * z, dh: Math.max(W / a, H) * z };
}

// Déplace l'image de (dx, dy) pixels : le doigt glisse vers la droite → l'image suit.
export function pan(fit, a, W, H, dx, dy) {
  const { dw, dh } = shownSize(W, H, a, fit.z);
  return {
    ...fit,
    x: dw - W > 1 ? clamp(fit.x - dx / (dw - W)) : fit.x,
    y: dh - H > 1 ? clamp(fit.y - dy / (dh - H)) : fit.y,
  };
}

export const withZoom = (fit, z) => ({ ...fit, z: clamp(z, MIN_ZOOM, MAX_ZOOM) });

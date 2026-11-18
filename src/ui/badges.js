// Badges de rang (images détourées, une par rang). L'id du rang = nom du fichier (voir data/ranks.json).
const files = import.meta.glob('../assets/badges/*.webp', { eager: true, query: '?url', import: 'default' });
export const badgeUrl = (rankId) => files[`../assets/badges/${rankId}.webp`] || '';

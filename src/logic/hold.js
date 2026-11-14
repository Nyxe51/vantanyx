// « Maintiens pour valider » : un appui de 2 secondes remplit la règle, puis déclenche onFire.
// Les éléments concernés portent data-hold="<id de règle>", data-done="0|1" et, pour une paire, data-j="0|1".
const HOLD_MS = 2000;

export function initHold(root, onFire) {
  let h = null;

  const cancel = () => {
    if (!h) return;
    cancelAnimationFrame(h.raf);
    h.el.classList.remove('holding');
    h.el.style.setProperty('--f', h.done ? 1 : 0);
    h = null;
  };

  const step = () => {
    if (!h) return;
    const p = Math.min((performance.now() - h.t0) / HOLD_MS, 1);
    h.el.style.setProperty('--f', h.done ? 1 - p : p);
    if (p >= 1) {
      const { id, j, done } = h;
      cancelAnimationFrame(h.raf);
      h = null;
      if (navigator.vibrate) navigator.vibrate(20);
      onFire(id, j, done);
      return;
    }
    h.raf = requestAnimationFrame(step);
  };

  root.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('[data-hold]');
    if (!el || h || e.button > 0) return;
    h = {
      el,
      id: el.dataset.hold,
      j: el.dataset.j === undefined ? null : Number(el.dataset.j),
      done: el.dataset.done === '1',
      x: e.clientX,
      y: e.clientY,
      t0: performance.now(),
      raf: 0,
    };
    el.classList.add('holding');
    h.raf = requestAnimationFrame(step);
  });
  // Si le doigt bouge (on fait défiler la page), on annule.
  root.addEventListener('pointermove', (e) => {
    if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 10) cancel();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => root.addEventListener(n, cancel));
  // Empêche le menu contextuel iOS/Android pendant l'appui long.
  root.addEventListener('contextmenu', (e) => {
    if (e.target.closest('[data-hold]')) e.preventDefault();
  });
}

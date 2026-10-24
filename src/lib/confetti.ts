/** Burst of confetti in the current theme's colors. No-op when the user prefers reduced motion. */
export function confetti(x = window.innerWidth / 2, y = window.innerHeight * 0.4): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const css = getComputedStyle(document.documentElement);
  const colors = ['--h2', '--h3', '--h4', '--accent', '--mine', '--btn-primary-bg']
    .map((v) => css.getPropertyValue(v).trim())
    .filter((c) => c && !c.startsWith('linear-gradient') && !c.startsWith('rgba') && !c.startsWith('color-mix'));
  const palette = colors.length ? colors : ['#16a34a', '#fbbf24', '#f472b6', '#60a5fa'];
  for (let i = 0; i < 80; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = palette[i % palette.length];
    p.style.setProperty('--dx', `${Math.random() * 560 - 280}px`);
    p.style.setProperty('--up', `${-Math.random() * 220 - 60}px`);
    p.style.setProperty('--dy', `${Math.random() * 280 + 140}px`);
    p.style.setProperty('--rot', `${Math.random() * 900 - 450}deg`);
    p.style.animationDuration = `${1.2 + Math.random() * 0.9}s`;
    document.body.appendChild(p);
    window.setTimeout(() => p.remove(), 2400);
  }
}

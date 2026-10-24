import { useEffect, useRef, useState } from 'react';
import { THEMES, applyTheme, getTheme } from '../lib/themes';

function Swatches({ colors }: { colors: readonly string[] }) {
  return (
    <span className="swatches" aria-hidden="true">
      {colors.map((c) => (
        <i key={c} style={{ background: c }} />
      ))}
    </span>
  );
}

export function ThemeSwitcher() {
  const [current, setCurrent] = useState(getTheme);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const active = THEMES.find((t) => t.id === current) ?? THEMES[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const pick = (id: string) => {
    applyTheme(id);
    setCurrent(id);
    setOpen(false);
  };

  return (
    <div className="theme-switch" ref={root}>
      <button
        type="button"
        className="btn btn-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Swatches colors={active.swatches} />
        Theme
      </button>
      {open && (
        <ul className="theme-menu" role="menu" aria-label="Choose a theme">
          {THEMES.map((t) => (
            <li key={t.id} role="none">
              <button type="button" role="menuitemradio" aria-checked={t.id === current} onClick={() => pick(t.id)}>
                <Swatches colors={t.swatches} />
                {t.label}
                <span className="check">✓</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

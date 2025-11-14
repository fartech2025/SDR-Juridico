import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../hooks/useTheme';

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
        isLight
          ? 'border-slate-300 bg-white text-slate-800 hover:border-blue-400'
          : 'border-white/15 bg-white/5 text-white hover:border-blue-400/40 hover:text-blue-200'
      }`}
      aria-label="Alternar tema"
    >
      {isLight ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </button>
  );
}

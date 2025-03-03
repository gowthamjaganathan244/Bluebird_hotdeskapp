import React from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/outline';

const ThemeToggle = ({ toggleTheme, isDarkMode }) => {
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-primary text-white focus:outline-none transition duration-300 hover:bg-secondary dark:hover:bg-accent flex items-center gap-2"
    >
      {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
};

export default ThemeToggle;

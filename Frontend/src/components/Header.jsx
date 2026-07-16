import React from "react";
import { FiMenu } from "react-icons/fi";
import { BsSun, BsMoon } from "react-icons/bs";

export const Header = ({
  onMenuClick,
  isDarkMode,
  toggleDarkMode,
  language,
  setLanguage,
}) => {
  const bgStyle = isDarkMode
    ? { backgroundColor: "#0d1117" }
    : { backgroundColor: "#f1f5f9" };

  return (
    <header
      className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-800/60 transition-all duration-300 sticky top-0 z-40 backdrop-blur-md"
      style={bgStyle}
    >
      {/* LEFT — Hamburger (mobile only) */}
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 md:hidden transition-all active:scale-90"
          aria-label="Open menu"
        >
          <FiMenu size={22} />
        </button>
      </div>

      {/* RIGHT — Language + Theme */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Language Selector — shown on all sizes */}
        <div className="relative group">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="appearance-none px-3 md:px-5 py-1.5 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.25em] cursor-pointer bg-white dark:bg-white/3 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 outline-none hover:border-cyan-500/50 dark:hover:border-cyan-400/40 transition-all shadow-sm group-hover:shadow-md"
          >
            <option value="en" className="text-slate-900 bg-white font-sans">
              EN
            </option>
            <option value="hi" className="text-slate-900 bg-white font-sans">
              HI
            </option>
            <option value="bn" className="text-slate-900 bg-white font-sans">
              BN
            </option>
          </select>

          {/* Full label on desktop */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="appearance-none hidden sm:block absolute inset-0 opacity-0 cursor-pointer"
            aria-hidden="true"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="bn">Bengali</option>
          </select>

          {/* Glowing Cyan Dot Indicator */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.6)]" />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className="relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-xl overflow-hidden bg-white dark:bg-white/3 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-cyan-500/20 hover:border-cyan-500/30 hover:scale-105 active:scale-95 transition-all duration-500 group"
          aria-label="Toggle theme"
        >
          {/* Internal Cyan Glow Hover Effect */}
          <div className="absolute inset-0 bg-linear-to-br from-cyan-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 transition-transform duration-500 group-hover:rotate-12">
            {isDarkMode ? (
              <BsSun
                className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                size={18}
              />
            ) : (
              <BsMoon className="text-cyan-600" size={16} />
            )}
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
